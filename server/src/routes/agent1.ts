import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as gemini from '../services/gemini.js';
import * as slack from '../services/slack.js';

const router = Router();

/**
 * POST /api/agent1/generate-srs
 * Generate SRS from raw requirements using Gemini.
 * Auth: Team Lead only.
 */
router.post('/generate-srs', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { projectId, rawRequirements } = req.body;

        if (!projectId || !rawRequirements) {
            res.status(400).json({ error: 'projectId and rawRequirements are required' });
            return;
        }

        // Update project agent status
        await db.collection('projects').doc(projectId).update({
            rawRequirements,
            'agentStatuses.ba': 'PROCESSING',
        });

        // Generate SRS via Gemini
        const srsData = await gemini.generateSRS(rawRequirements);

        // Save SRS to Firestore
        const srsRef = await db.collection('projects').doc(projectId).collection('srs').add({
            ...srsData,
            status: 'draft',
        });

        // Update project status
        await db.collection('projects').doc(projectId).update({
            'agentStatuses.ba': 'WAITING_APPROVAL',
        });

        // Slack notification
        const projectDoc = await db.collection('projects').doc(projectId).get();
        await slack.notifySRSGenerated(projectDoc.data()?.name || 'Unknown', srsData.title);

        res.json({
            success: true,
            srs: { id: srsRef.id, ...srsData, status: 'draft' },
        });
    } catch (error: any) {
        console.error('Agent 1 error:', error);

        // Try to update status to FAILED
        if (req.body.projectId) {
            await db.collection('projects').doc(req.body.projectId).update({
                'agentStatuses.ba': 'FAILED',
            }).catch(() => { });
        }

        res.status(500).json({ error: error.message || 'Failed to generate SRS' });
    }
});

/**
 * POST /api/agent1/approve-srs
 * Approve an SRS document and advance the pipeline.
 * Auth: Team Lead only.
 */
router.post('/approve-srs', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { projectId, srsId } = req.body;

        if (!projectId || !srsId) {
            res.status(400).json({ error: 'projectId and srsId are required' });
            return;
        }

        // Update SRS status
        await db.collection('projects').doc(projectId).collection('srs').doc(srsId).update({
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: req.user!.uid,
        });

        // Advance pipeline to Agent 2
        await db.collection('projects').doc(projectId).update({
            activeAgent: 2,
            'agentStatuses.ba': 'COMPLETED',
            'agentStatuses.coordinator': 'IDLE',
        });

        // Slack notification
        const srsDoc = await db.collection('projects').doc(projectId).collection('srs').doc(srsId).get();
        await slack.notifySRSApproved(srsDoc.data()?.title || 'SRS', req.user!.email);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Approve SRS error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
