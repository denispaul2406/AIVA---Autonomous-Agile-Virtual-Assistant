import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as gemini from '../services/gemini.js';
import * as calendar from '../services/calendar.js';
import * as slack from '../services/slack.js';

const router = Router();

/**
 * POST /api/agent4/report-blocker
 * Report a new blocker. AI solution is auto-generated.
 * Auth: All roles.
 */
router.post('/report-blocker', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { projectId, description } = req.body;

        if (!projectId || !description) {
            res.status(400).json({ error: 'projectId and description are required' });
            return;
        }

        const blocker = {
            description,
            reportedBy: req.user!.email,
            reportedByUid: req.user!.uid,
            timestamp: new Date().toISOString(),
            status: 'OPEN' as const,
        };

        // Save blocker to Firestore (without AI solution yet)
        const blockerRef = await db.collection('projects').doc(projectId).collection('blockers').add(blocker);

        // Generate AI solution asynchronously
        let aiSolution = '';
        try {
            aiSolution = await gemini.resolveBlocker(description);
            await blockerRef.update({ aiSolution });
        } catch (aiError) {
            console.error('AI solution generation failed:', aiError);
            aiSolution = 'Unable to generate AI solution. Please escalate to PM.';
            await blockerRef.update({ aiSolution });
        }

        // Slack notification
        await slack.notifyBlocker(description, req.user!.email, aiSolution);

        res.json({
            success: true,
            blocker: { id: blockerRef.id, ...blocker, aiSolution },
        });
    } catch (error: any) {
        console.error('Report blocker error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/agent4/resolve-blocker
 * Mark a blocker as resolved.
 * Auth: Team Lead only.
 */
router.post('/resolve-blocker', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { projectId, blockerId } = req.body;

        if (!projectId || !blockerId) {
            res.status(400).json({ error: 'projectId and blockerId are required' });
            return;
        }

        await db.collection('projects').doc(projectId).collection('blockers').doc(blockerId).update({
            status: 'RESOLVED',
            resolvedAt: new Date().toISOString(),
        });

        const blockerDoc = await db.collection('projects').doc(projectId).collection('blockers').doc(blockerId).get();
        await slack.notifyBlockerResolved(blockerDoc.data()?.description || '');

        res.json({ success: true });
    } catch (error: any) {
        console.error('Resolve blocker error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/agent4/escalate-blocker
 * Escalate a blocker — optionally schedule a PM meeting.
 * Auth: Team Lead only.
 */
router.post('/escalate-blocker', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { projectId, blockerId } = req.body;

        if (!projectId || !blockerId) {
            res.status(400).json({ error: 'projectId and blockerId are required' });
            return;
        }

        // Update blocker status
        await db.collection('projects').doc(projectId).collection('blockers').doc(blockerId).update({
            status: 'ESCALATED',
        });

        // Optionally schedule a PM meeting via Calendar
        const teamEmails = (process.env.TEAM_MEMBER_EMAILS || '').split(',').filter(Boolean);
        let meetLink = '';

        const hasOAuthCreds = !!(
            process.env.GOOGLE_OAUTH_CLIENT_ID &&
            process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
            process.env.GOOGLE_OAUTH_REFRESH_TOKEN
        );
        const hasServiceAccountCreds = !!(
            process.env.GOOGLE_CALENDAR_CLIENT_EMAIL && process.env.GOOGLE_CALENDAR_PRIVATE_KEY
        );

        if ((hasOAuthCreds || hasServiceAccountCreds) && teamEmails.length > 0) {
            try {
                const blockerDoc = await db.collection('projects').doc(projectId).collection('blockers').doc(blockerId).get();
                const blockerDesc = blockerDoc.data()?.description || 'Blocker escalation';

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];

                const calResult = await calendar.createCalendarEvent({
                    title: `[ESCALATED] Blocker Discussion`,
                    date: dateStr,
                    duration: '30 mins',
                    agenda: [`Discuss escalated blocker: ${blockerDesc}`, 'Identify resolution path', 'Assign action items'],
                    attendeeEmails: teamEmails,
                });
                meetLink = calResult.meetLink;
            } catch (calError) {
                console.error('Escalation calendar event failed:', calError);
            }
        }

        res.json({ success: true, meetLink });
    } catch (error: any) {
        console.error('Escalate blocker error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
