import { GoogleGenAI, Type } from "@google/genai";
import { SRS, Meeting, Task, Blocker } from "../types";

// In a real app, this should be securely handled.
// For this demo, we assume process.env.API_KEY is available.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-flash-preview"; // Using gemini-3-flash-preview as per new guidelines

export const Agent1_GenerateSRS = async (rawInput: string): Promise<SRS> => {
  const ai = getAI();
  const prompt = `
    You are an expert Business Analyst Agent (Agent 1).
    Analyze the following raw client requirements and convert them into a structured Software Requirements Specification (SRS).
    
    Raw Requirements: "${rawInput}"
    
    Return the response in JSON format strictly matching this schema:
    {
      "title": "Project Name",
      "overview": "High level summary",
      "sections": [
        { "title": "Functional Requirements", "content": "bullet points..." },
        { "title": "Non-Functional Requirements", "content": "performance, security..." },
        { "title": "User Stories", "content": "As a user..." }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text || "{}";
  const data = JSON.parse(text);
  
  return {
    ...data,
    generatedAt: new Date().toISOString()
  };
};

export const Agent2_ScheduleMeeting = async (srs: SRS): Promise<Meeting> => {
  const ai = getAI();
  const prompt = `
    You are an expert Coordinator Agent (Agent 2).
    Based on the following SRS Title and Overview, schedule a requirements discussion meeting.
    
    Project: ${srs.title}
    Overview: ${srs.overview}
    
    Generate a JSON response:
    {
      "title": "Meeting Title",
      "date": "suggest a date 2 days from now (YYYY-MM-DD format)",
      "duration": "e.g. 45 mins",
      "agenda": ["Item 1", "Item 2"],
      "attendees": ["Product Owner", "Tech Lead", "Dev Team"],
      "link": "https://meet.google.com/abc-defg-hij"
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
};

export const Agent3_PlanTasks = async (srs: SRS, meeting: Meeting): Promise<Task[]> => {
  const ai = getAI();
  const prompt = `
    You are an expert Tech Lead Agent (Agent 3).
    Convert the SRS and Meeting outcomes into actionable technical tasks for a Kanban board.
    Also, identify required resources (tools, access, software).
    
    SRS Context: ${srs.overview}
    Meeting Agenda: ${meeting.agenda.join(', ')}
    
    Generate a JSON array of tasks. Each task object:
    {
      "id": "T-1",
      "title": "Setup Repo",
      "description": "Initialize Git repository",
      "assignee": "Dev 1",
      "status": "TODO",
      "resourcesNeeded": ["Github Access", "IDE"],
      "missingResources": [] 
    }
    
    *CRITICAL*: Randomly flag 1 task as having "missingResources" (e.g., "AWS Access Keys missing") to demonstrate the "Resource Flag" feature.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text || "[]";
  return JSON.parse(text);
};

export const Agent4_ResolveBlocker = async (blockerDesc: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    You are a Scrum Master Agent (Agent 4).
    A team member has reported the following blocker: "${blockerDesc}".
    
    Provide a concise, actionable solution (max 2 sentences).
    If it's technical, suggest a fix. If administrative, suggest a meeting.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  return response.text || "Could not generate solution.";
};