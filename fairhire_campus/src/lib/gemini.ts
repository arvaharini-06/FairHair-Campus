import { GoogleGenAI, Type, Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface AnonymizedResume {
  anonymizedText: string;
  skills: { name: string; proficiency: number }[];
  projects: { title: string; techStack: string[]; github?: string; complexity: string }[];
  overallMeritScore: number;
  recruiterReasoning: string;
  skillGaps: { topic: string; learningPath: string }[];
}

export async function processResume(inputParts: Part[]): Promise<AnonymizedResume> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `You are an AI assistant specialized in HR and recruitment for high-growth tech companies. 
            Analyze the provided resume (could be text or a file like PDF/Image).
            
            Tasks:
            1. Anonymization (Pillar 1): Replace Name, Email, Phone, and specific College Name with generic tokens like [CANDIDATE_ID], [REDACTED_MAIL], [REDACTED_INSTITUTION] in the 'anonymizedText' field.
            
            2. Skill Vectoring (Pillar 2): List all technical skills. Assign a proficiency (1-10) based on context (e.g., used in a major project vs. just listed).
            
            3. Project Analysis (Pillar 2): Extract project titles, tech stacks, and GitHub links. Summarize the 'Complexity Level' for each project.
            
            4. Professionalism & Merit (Pillar 3): Calculate an 'Overall Merit Score' (0-100) based on skills and projects. Provide a 2-sentence 'Recruiter Reasoning' explaining the score.
            
            5. Growth Loop (Pillar 5): Identify exactly 3 'Skill Gaps' based on common industry requirements for this candidate's profile and suggest specific 'Learning Paths'.
            
            Provide the response in JSON format.`
          },
          ...inputParts
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          anonymizedText: {
            type: Type.STRING,
            description: "The redacted resume text or summary."
          },
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                proficiency: { type: Type.NUMBER }
              }
            }
          },
          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                github: { type: Type.STRING },
                complexity: { type: Type.STRING }
              }
            }
          },
          overallMeritScore: {
            type: Type.NUMBER,
            description: "Score from 0 to 100."
          },
          recruiterReasoning: {
            type: Type.STRING,
            description: "2-sentence reasoning."
          },
          skillGaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                learningPath: { type: Type.STRING }
              }
            }
          }
        },
        required: ["anonymizedText", "skills", "projects", "overallMeritScore", "recruiterReasoning", "skillGaps"]
      }
    }
  });

  return JSON.parse(response.text);
}
