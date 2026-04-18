import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Create an authenticated Google Calendar client.
 *
 * Preferred: OAuth 2.0 with a refresh token. This creates the event as a real
 * user, which is the ONLY way to get a working Google Meet link on a consumer
 * (non-Workspace) Google account.
 *
 * Fallback: service account JWT. Service accounts can create calendar events
 * but Google does NOT return a Meet link for consumer accounts.
 */
const getCalendarClient = () => {
    if (
        process.env.GOOGLE_OAUTH_CLIENT_ID &&
        process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
        process.env.GOOGLE_OAUTH_REFRESH_TOKEN
    ) {
        const oauth2 = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET
        );
        oauth2.setCredentials({
            refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
        });
        return google.calendar({ version: 'v3', auth: oauth2 });
    }

    const jwt = new google.auth.JWT(
        process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        SCOPES
    );
    return google.calendar({ version: 'v3', auth: jwt });
};

/**
 * True if OAuth credentials (with refresh token) are configured.
 * When true, we are authenticating as a real user and can request a Meet link.
 */
const isUsingOAuth = (): boolean =>
    !!(
        process.env.GOOGLE_OAUTH_CLIENT_ID &&
        process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
        process.env.GOOGLE_OAUTH_REFRESH_TOKEN
    );

interface CreateMeetingParams {
    title: string;
    date: string; // YYYY-MM-DD
    duration: string; // e.g. "45 mins"
    agenda: string[];
    attendeeEmails: string[];
}

interface CalendarResult {
    eventId: string;
    meetLink: string;
    htmlLink: string;
}

/**
 * Create a Google Calendar event with an auto-generated Google Meet link.
 * Adds all team members as attendees.
 */
export const createCalendarEvent = async (params: CreateMeetingParams): Promise<CalendarResult> => {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Parse duration to minutes
    const durationMinutes = parseInt(params.duration) || 45;

    // Create start and end times (default 10:00 AM IST)
    const startTime = new Date(`${params.date}T10:00:00+05:30`);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const agendaText = (params.agenda || []).map((item, i) => `${i + 1}. ${item}`).join('\n');

    const event = {
        summary: params.title,
        description: `**AIVA Auto-Scheduled Meeting**\n\nAgenda:\n${agendaText}\n\n---\nThis meeting was automatically scheduled by AIVA - AI Sequential Scrum Master.`,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        attendees: params.attendeeEmails.map(email => ({ email })),
        conferenceData: {
            createRequest: {
                requestId: `aiva-meet-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 30 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    let response;
    try {
        response = await calendar.events.insert({
            calendarId,
            requestBody: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all',
        });
    } catch (error: any) {
        // If service account cannot invite attendees, retry without them.
        // (Not applicable when using OAuth — a real user can invite attendees.)
        if (
            !isUsingOAuth() &&
            error.errors &&
            error.errors[0]?.reason === 'forbiddenForServiceAccounts'
        ) {
            console.warn('Calendar: Service account cannot invite attendees. Retrying without guest list...');
            const retryEvent = { ...event };
            delete (retryEvent as any).attendees;

            response = await calendar.events.insert({
                calendarId,
                requestBody: retryEvent,
                conferenceDataVersion: 1,
                sendUpdates: 'none',
            });
        } else {
            throw error;
        }
    }

    const meetLink = response.data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === 'video'
    )?.uri || '';

    return {
        eventId: response.data.id || '',
        meetLink,
        htmlLink: response.data.htmlLink || '',
    };
};
