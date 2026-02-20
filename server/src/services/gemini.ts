import { GoogleGenAI } from '@google/genai';
import { SRS, Meeting, Task } from '../types/index.js';

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Ordered list of models to try. If the primary model is rate-limited,
 * we fall through to the next one.
 */
const MODEL_CASCADE = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
];

/**
 * Delay helper — returns a promise that resolves after `ms` milliseconds.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Core generation function with:
 *   1. Exponential backoff retry (up to MAX_RETRIES per model)
 *   2. Fallback model cascade (tries next model if current is exhausted)
 *
 * Returns the raw text response from the first successful call.
 */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2s, 4s, 8s

interface GenerateOptions {
  prompt: string;
  json?: boolean; // If true, request JSON response
}

const generateWithRetry = async ({ prompt, json }: GenerateOptions): Promise<string> => {
  const ai = getAI();
  const errors: string[] = [];

  for (const model of MODEL_CASCADE) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Gemini] Trying ${model} (attempt ${attempt}/${MAX_RETRIES})...`);

        const config: any = {};
        if (json) config.responseMimeType = 'application/json';

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const text = response.text || '';
        if (!text) throw new Error('Empty response from Gemini');

        console.log(`[Gemini] ✅ Success with ${model}`);
        return text;
      } catch (error: any) {
        const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
        const isQuotaExhausted = error.message?.includes('quota') || error.message?.includes('Quota');

        // Extract retry delay from error if available
        let retryDelay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        const retryMatch = error.message?.match(/retry in (\d+(?:\.\d+)?)s/i);
        if (retryMatch) {
          retryDelay = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000; // Add 1s buffer
        }

        const errorMsg = `${model}@attempt${attempt}: ${error.message?.substring(0, 100)}`;
        errors.push(errorMsg);
        console.warn(`[Gemini] ⚠️ ${errorMsg}`);

        if (isRateLimit || isQuotaExhausted) {
          if (attempt < MAX_RETRIES) {
            console.log(`[Gemini] ⏳ Rate limited, waiting ${retryDelay}ms before retry...`);
            await delay(retryDelay);
            continue; // retry same model
          } else {
            console.log(`[Gemini] ❌ ${model} exhausted after ${MAX_RETRIES} attempts, trying next model...`);
            break; // move to next model
          }
        }

        // For non-rate-limit errors, also retry with backoff
        if (attempt < MAX_RETRIES) {
          await delay(retryDelay);
          continue;
        }
        break; // move to next model
      }
    }
  }

  throw new Error(
    `All Gemini models exhausted after retries. Errors:\n${errors.join('\n')}\n\n` +
    'Possible fixes:\n' +
    '1. Wait 1-2 minutes and try again\n' +
    '2. Enable billing on your Google Cloud project to remove free-tier limits\n' +
    '3. Generate a new API key from a different Google Cloud project'
  );
};

// ========================
// Agent Functions
// ========================

/**
 * Agent 1: Business Analyst — Generate SRS from raw requirements.
 */
export const generateSRS = async (rawInput: string): Promise<Omit<SRS, 'id' | 'status'>> => {
  const prompt = `
    You are an expert Business Analyst Agent.
    Analyze the following raw client requirements and convert them into a structured Software Requirements Specification (SRS).
    
    Raw Requirements: "${rawInput}"
    
    Return the response in JSON format strictly matching this schema:
    {
      "title": "Project Name",
      "overview": "High level summary",
      "sections": [
        { "title": "Functional Requirements", "content": "bullet points in markdown..." },
        { "title": "Non-Functional Requirements", "content": "performance, security, scalability..." },
        { "title": "User Stories", "content": "As a user, I want..." },
        { "title": "Acceptance Criteria", "content": "Given... When... Then..." },
        { "title": "Technical Constraints", "content": "technology, infrastructure..." }
      ]
    }
  `;

  const text = await generateWithRetry({ prompt, json: true });
  const data = JSON.parse(text);

  return {
    ...data,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Agent 2: Coordinator — Generate meeting schedule based on SRS.
 */
export const generateMeetingPlan = async (srs: SRS): Promise<Omit<Meeting, 'id' | 'calendarEventId'>> => {
  const meetingDate = new Date();
  meetingDate.setDate(meetingDate.getDate() + 2);
  const dateStr = meetingDate.toISOString().split('T')[0];

  const prompt = `
    You are an expert Coordinator Agent.
    Based on the following SRS, schedule a requirements discussion meeting.

    CRITICAL: You MUST generate a VALID JSON response. Do not include markdown or code block fences.
    The response MUST include 'agenda' and 'attendees' arrays.
    
    Project: ${srs.title}
    Overview: ${srs.overview}
    
    The meeting date should be: ${dateStr}
    
    Generate a JSON response:
    {
      "title": "Meeting Title",
      "date": "${dateStr}",
      "duration": "45 mins",
      "agenda": ["Item 1", "Item 2", "Item 3", "Item 4"],
      "attendees": ["Team Lead", "Developer 1", "Developer 2", "Tester"],
      "meetLink": ""
    }
  `;

  const text = await generateWithRetry({ prompt, json: true });
  const data = JSON.parse(text);

  // Validation
  if (!data.title || !data.date || !data.duration || !Array.isArray(data.agenda) || !Array.isArray(data.attendees)) {
    throw new Error('Incomplete Meeting Plan generated. Missing critical fields (agenda/attendees).');
  }

  return {
    ...data,
    meetLink: '',
    status: 'tentative' as const,
  };
};

/**
 * Agent 3: Tech Lead — Generate tasks from SRS + meeting.
 */
export const generateTasks = async (srs: SRS, meeting: Meeting, teamContext: { uid: string; name: string; role: string }[] = []): Promise<Omit<Task, 'createdAt'>[]> => {
  const teamMemberNames = teamContext.length > 0
    ? teamContext.map(m => `${m.name} (${m.role})`).join(', ')
    : "Team Lead, Developer 1, Developer 2, Tester";

  const prompt = `
    You are an expert Tech Lead Agent.
    Convert the SRS and Meeting outcomes into actionable technical tasks for a Kanban board.
    Identify required resources (tools, access, software) for each task.
    
    SRS Context: ${srs.overview}
    SRS Sections: ${srs.sections.map(s => s.title + ': ' + s.content.substring(0, 200)).join('\n')}
    Meeting Agenda: ${meeting.agenda.join(', ')}
    
    The Available Team Members are: ${teamMemberNames}
    
    Generate a JSON array of 6-8 tasks. Each task object:
    {
      "id": "T-1",
      "title": "Task title",
      "description": "Detailed description",
      "assignee": "${teamContext.length > 0 ? teamContext[0].name : 'Developer 1'}",
      "assigneeUid": "${teamContext.length > 0 ? teamContext[0].uid : ''}", 
      "status": "TODO",
      "resourcesNeeded": ["Github Access", "IDE", "Database"],
      "missingResources": []
    }
    
    IMPORTANT: 
    1. Randomly flag 1-2 tasks as having "missingResources".
    2. Assign tasks ONLY to the Available Team Members listed above. Distribute work based on their roles if visible.
    3. If 'assigneeUid' is available, include it.
  `;

  const text = await generateWithRetry({ prompt, json: true });
  const tasks = JSON.parse(text);

  // Post-process to ensure assigneeUid is set correctly if AI missed it
  return tasks.map((t: any) => {
    const member = teamContext.find(m => m.name === t.assignee || t.assignee.includes(m.name));
    return {
      ...t,
      assigneeUid: member ? member.uid : t.assigneeUid
    };
  });
};

/**
 * Agent 4: Scrum Master — Generate solution for a blocker.
 */
export const resolveBlocker = async (blockerDesc: string): Promise<string> => {
  const prompt = `
    You are a Scrum Master Agent.
    A team member has reported the following blocker: "${blockerDesc}".
    
    Provide a concise, actionable solution (max 3 sentences).
    If it's technical, suggest a specific fix with steps.
    If it's administrative or resource-related, suggest scheduling a meeting or escalating.
    If it needs PM intervention, say so clearly.
  `;

  return await generateWithRetry({ prompt, json: false });
};
