import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as gemini from '../services/gemini.js';
import * as slack from '../services/slack.js';
import admin from 'firebase-admin';

const router = Router();

/**
 * POST /api/agent3/generate-tasks
 * Generate tasks from SRS + meeting using Gemini.
 * Auth: Team Lead only.
 */
router.post('/generate-tasks', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { projectId } = req.body;

        if (!projectId) {
            res.status(400).json({ error: 'projectId is required' });
            return;
        }

        // Update agent status
        await db.collection('projects').doc(projectId).update({
            'agentStatuses.techLead': 'PROCESSING',
        });

        // Get approved SRS
        const srsSnapshot = await db.collection('projects').doc(projectId)
            .collection('srs')
            .where('status', '==', 'approved')
            .limit(1)
            .get();

        // Get confirmed meeting
        const meetingSnapshot = await db.collection('projects').doc(projectId)
            .collection('meetings')
            .orderBy('status')
            .limit(1)
            .get();

        if (srsSnapshot.empty) {
            res.status(400).json({ error: 'No approved SRS found' });
            return;
        }

        const srsData = srsSnapshot.docs[0].data();
        const meetingData = meetingSnapshot.empty ? { agenda: ['General planning'], title: 'Planning Meeting' } : meetingSnapshot.docs[0].data();

        // Get team members with their roles
        const projectDocRef = await db.collection('projects').doc(projectId).get();
        const teamMemberUids = projectDocRef.data()?.teamMembers || [];

        let teamContext: any[] = [];
        if (teamMemberUids.length > 0) {
            const chunks = [];
            for (let i = 0; i < teamMemberUids.length; i += 10) {
                chunks.push(teamMemberUids.slice(i, i + 10));
            }

            const memberPromises = chunks.map(chunk =>
                db.collection('users')
                    .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
                    .get()
            );

            const snapshots = await Promise.all(memberPromises);
            const userDocs = snapshots.flatMap(snap => snap.docs);
            teamContext = userDocs.map(doc => ({
                uid: doc.id,
                name: doc.data().displayName || doc.data().email?.split('@')[0],
                role: doc.data().role || 'developer',
            }));
        }

        // Generate tasks via Gemini with team context
        const tasks = await gemini.generateTasks(srsData as any, meetingData as any, teamContext);

        // Save tasks to Firestore
        const batch = db.batch();
        const tasksWithTimestamp = tasks.map(task => ({
            ...task,
            createdAt: new Date().toISOString(),
        }));

        for (const task of tasksWithTimestamp) {
            const taskRef = db.collection('projects').doc(projectId).collection('tasks').doc(task.id);
            batch.set(taskRef, task);
        }
        await batch.commit();

        // Update project — advance to Agent 4
        await db.collection('projects').doc(projectId).update({
            activeAgent: 4,
            'agentStatuses.techLead': 'COMPLETED',
            'agentStatuses.scrumMaster': 'IDLE',
        });

        // Slack notification
        const projectData = projectDocRef.data();
        const missingCount = tasks.filter((t: any) => t.missingResources && t.missingResources.length > 0).length;
        await slack.notifyTasksCreated(projectData?.name || 'Unknown', tasks.length, missingCount);

        res.json({
            success: true,
            tasks: tasksWithTimestamp,
        });
    } catch (error: any) {
        console.error('Agent 3 error:', error);
        if (req.body.projectId) {
            await db.collection('projects').doc(req.body.projectId).update({
                'agentStatuses.techLead': 'FAILED',
            }).catch(() => { });
        }
        res.status(500).json({ error: error.message || 'Failed to generate tasks' });
    }
});

/**
 * PATCH /api/agent3/tasks/:taskId
 * Update a task's status (drag on Kanban).
 * Auth: All roles.
 */
router.patch('/tasks/:taskId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { projectId, status } = req.body;
        const taskId = req.params.taskId as string;

        if (!projectId || !status) {
            res.status(400).json({ error: 'projectId and status are required' });
            return;
        }

        await db.collection('projects').doc(projectId).collection('tasks').doc(taskId).update({
            status,
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('Update task error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
