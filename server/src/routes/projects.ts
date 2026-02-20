import { Router, Request, Response } from 'express';
import { db, auth } from '../config/firebase.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { UserRole, AgentStatus } from '../types/index.js';

const router = Router();

/**
 * POST /api/projects
 * Create a new project.
 * Auth: Team Lead only.
 */
router.post('/', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'name is required' });
            return;
        }

        const project = {
            name,
            createdBy: req.user!.uid,
            createdAt: new Date().toISOString(),
            status: 'active' as const,
            rawRequirements: '',
            activeAgent: 1,
            agentStatuses: {
                ba: AgentStatus.IDLE,
                coordinator: AgentStatus.IDLE,
                techLead: AgentStatus.IDLE,
                scrumMaster: AgentStatus.IDLE,
            },
            teamMembers: [req.user!.uid],
        };

        const projectRef = await db.collection('projects').add(project);

        res.json({
            success: true,
            project: { id: projectRef.id, ...project },
        });
    } catch (error: any) {
        console.error('Create project error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/projects
 * List all projects for the current user.
 * Auth: All roles.
 */
router.get('/', verifyAuth, async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('projects')
            .where('teamMembers', 'array-contains', req.user!.uid)
            .get();

        const projects = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        res.json({ projects });
    } catch (error: any) {
        console.error('List projects error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/projects/:id
 * Get a single project with all subcollections (SRS, meetings, tasks, blockers).
 * Auth: All roles.
 */
router.get('/:id', verifyAuth, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const projectDoc = await db.collection('projects').doc(id).get();

        if (!projectDoc.exists) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Fetch subcollections in parallel
        const [srsSnap, meetingsSnap, tasksSnap, blockersSnap] = await Promise.all([
            db.collection('projects').doc(id).collection('srs').get(),
            db.collection('projects').doc(id).collection('meetings').get(),
            db.collection('projects').doc(id).collection('tasks').get(),
            db.collection('projects').doc(id).collection('blockers').get(),
        ]);

        res.json({
            project: { id: projectDoc.id, ...projectDoc.data() },
            srs: srsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            meetings: meetingsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            tasks: tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            blockers: blockersSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || '')),
        });
    } catch (error: any) {
        console.error('Get project error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/projects/:id/add-member
 * Add a team member to the project.
 * Auth: Team Lead only.
 */
router.post('/:id/add-member', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { memberUid } = req.body;

        if (!memberUid) {
            res.status(400).json({ error: 'memberUid is required' });
            return;
        }

        // Verify user exists
        const userDoc = await db.collection('users').doc(memberUid).get();
        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const admin = await import('firebase-admin');
        await db.collection('projects').doc(id).update({
            teamMembers: admin.default.firestore.FieldValue.arrayUnion(memberUid),
        });

        const updatedProject = await db.collection('projects').doc(id).get();

        res.json({
            success: true,
            project: { id: updatedProject.id, ...updatedProject.data() }
        });
    } catch (error: any) {
        console.error('Add member error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove member from project
router.post('/:id/remove-member', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { memberUid } = req.body;

        if (!memberUid) {
            res.status(400).json({ error: 'memberUid is required' });
            return;
        }

        const admin = await import('firebase-admin');
        await db.collection('projects').doc(id).update({
            teamMembers: admin.default.firestore.FieldValue.arrayRemove(memberUid),
        });

        const updatedProject = await db.collection('projects').doc(id).get();

        res.json({
            success: true,
            project: { id: updatedProject.id, ...updatedProject.data() }
        });
    } catch (error: any) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/set-role
 * Set the role for a user (stored in Firestore users collection).
 * Auth: Team Lead only (or self-registration).
 */
router.post('/auth/set-role', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { targetUid, role } = req.body;

        // Allow self-registration or Team Lead setting others' roles
        const isSettingSelf = targetUid === req.user!.uid;
        const isTeamLead = req.user!.role === UserRole.TEAM_LEAD;

        if (!isSettingSelf && !isTeamLead) {
            res.status(403).json({ error: 'Only Team Lead can set other users\' roles' });
            return;
        }

        if (!Object.values(UserRole).includes(role)) {
            res.status(400).json({ error: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` });
            return;
        }

        await db.collection('users').doc(targetUid).set({
            role,
            email: req.user!.email,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        res.json({ success: true });
    } catch (error: any) {
        console.error('Set role error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/projects/:id/reset-agent
 * Reset a failed agent's status back to IDLE so it can be retried.
 * Auth: Team Lead only.
 */
router.patch('/:id/reset-agent', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { agentKey } = req.body; // 'ba' | 'coordinator' | 'techLead' | 'scrumMaster'

        const validKeys = ['ba', 'coordinator', 'techLead', 'scrumMaster'];
        if (!validKeys.includes(agentKey)) {
            res.status(400).json({ error: `Invalid agentKey. Must be one of: ${validKeys.join(', ')}` });
            return;
        }

        await db.collection('projects').doc(id).update({
            [`agentStatuses.${agentKey}`]: AgentStatus.IDLE,
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('Reset agent error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
