import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as gemini from '../services/gemini.js';
import * as calendar from '../services/calendar.js';
import * as slack from '../services/slack.js';
import admin from 'firebase-admin';

const router = Router();

/**
 * POST /api/agent2/schedule-meeting
 * Generate meeting plan via Gemini, then create a Google Calendar event.
 * Auth: Team Lead only.
 */
router.post('/schedule-meeting', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { projectId } = req.body;

        if (!projectId) {
            res.status(400).json({ error: 'projectId is required' });
            return;
        }

        // Update agent status
        await db.collection('projects').doc(projectId).update({
            'agentStatuses.coordinator': 'PROCESSING',
        });

        // Get the approved SRS
        const srsSnapshot = await db.collection('projects').doc(projectId)
            .collection('srs')
            .where('status', '==', 'approved')
            .limit(1)
            .get();

        if (srsSnapshot.empty) {
            res.status(400).json({ error: 'No approved SRS found for this project' });
            return;
        }

        const srsData = srsSnapshot.docs[0].data();

        // Generate meeting plan via Gemini
        const meetingPlan = await gemini.generateMeetingPlan(srsData as any);

        // Get team member emails from users collection
        const projectDoc = await db.collection('projects').doc(projectId).get();
        const teamMemberUids = projectDoc.data()?.teamMembers || [];

        // Always include current user (Team Lead)
        if (!teamMemberUids.includes(req.user!.uid)) {
            teamMemberUids.push(req.user!.uid);
        }

        let teamEmails: string[] = [];
        if (teamMemberUids.length > 0) {
            // Firestore 'in' query supports up to 10 value. Batch if needed, but for MVP < 10 is fine.
            // Actually, querying by documentId 'in' array
            const chunks = [];
            for (let i = 0; i < teamMemberUids.length; i += 10) {
                chunks.push(teamMemberUids.slice(i, i + 10));
            }

            const emailPromises = chunks.map(chunk =>
                db.collection('users')
                    .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
                    .get()
            );

            const snapshots = await Promise.all(emailPromises);
            const userDocs = snapshots.flatMap(snap => snap.docs);
            teamEmails = userDocs.map(doc => doc.data().email).filter(Boolean);
        }

        // Fallback to env if empty (for backward compatibility or testing)
        if (teamEmails.length === 0) {
            teamEmails = (process.env.TEAM_MEMBER_EMAILS || '').split(',').filter(Boolean);
        }

        let meetLink = '';
        let calendarEventId = '';

        // Create Google Calendar event (if configured)
        if (process.env.GOOGLE_CALENDAR_CLIENT_EMAIL && process.env.GOOGLE_CALENDAR_PRIVATE_KEY) {
            try {
                const calResult = await calendar.createCalendarEvent({
                    title: meetingPlan.title,
                    date: meetingPlan.date,
                    duration: meetingPlan.duration,
                    agenda: meetingPlan.agenda,
                    attendeeEmails: teamEmails,
                });
                meetLink = calResult.meetLink || 'https://meet.google.com/placeholder-link';
                calendarEventId = calResult.eventId;
            } catch (calError) {
                console.error('Calendar creation failed (continuing without):', calError);
                meetLink = 'https://meet.google.com/placeholder-link';
            }
        } else {
            meetLink = 'https://meet.google.com/placeholder-link';
        }

        // Save meeting to Firestore
        const meetingData = {
            ...meetingPlan,
            meetLink,
            calendarEventId,
            status: 'tentative',
        };

        const meetingRef = await db.collection('projects').doc(projectId).collection('meetings').add(meetingData);

        // Update project status
        await db.collection('projects').doc(projectId).update({
            'agentStatuses.coordinator': 'WAITING_APPROVAL',
        });

        // Slack notification
        await slack.notifyMeetingScheduled(meetingPlan.title, meetingPlan.date, meetLink, meetingPlan.agenda);

        res.json({
            success: true,
            meeting: { id: meetingRef.id, ...meetingData },
        });
    } catch (error: any) {
        console.error('Agent 2 error:', error);
        if (req.body.projectId) {
            await db.collection('projects').doc(req.body.projectId).update({
                'agentStatuses.coordinator': 'FAILED',
            }).catch(() => { });
        }
        res.status(500).json({ error: error.message || 'Failed to schedule meeting' });
    }
});

/**
 * POST /api/agent2/confirm-meeting
 * Confirm the meeting and advance to Agent 3.
 * Auth: Team Lead only.
 */
router.post('/confirm-meeting', verifyAuth, requireRole(UserRole.TEAM_LEAD), async (req: Request, res: Response) => {
    try {
        const { projectId, meetingId } = req.body;

        if (!projectId || !meetingId) {
            res.status(400).json({ error: 'projectId and meetingId are required' });
            return;
        }

        // Update meeting status
        await db.collection('projects').doc(projectId).collection('meetings').doc(meetingId).update({
            status: 'confirmed',
        });

        // Advance pipeline to Agent 3
        await db.collection('projects').doc(projectId).update({
            activeAgent: 3,
            'agentStatuses.coordinator': 'COMPLETED',
            'agentStatuses.techLead': 'IDLE',
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('Confirm meeting error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
