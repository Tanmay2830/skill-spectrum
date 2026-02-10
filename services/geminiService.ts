
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SkillNode, SimulationScenario, UserRole, LearningResource, UserState } from '../types';
import { searchYouTubeVideos } from './youtubeService';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Universe Generation ---

const SYSTEM_INSTRUCTION_GENERATOR = `
You are the architect of Skill Universe. Generate a hierarchical graph of skills.
Structure:
- Galaxy: Major domain (e.g., Backend Systems, Frontend Engineering, Cloud Infrastructure)
- Planet: Specific Skill (e.g., Distributed Databases, Web Security, DevOps Pipelines)
- Moon: Specific Task (e.g., Query Tuning, OAuth Integration, CI/CD Optimization)
- Team: For Manager view, represents a team cluster
- User: For HR view, represents an individual

Assign "readiness" (0-100) and "demand" (0-100).
`;

export const generateSkillUniverseData = async (role: string, userRole: UserRole): Promise<SkillNode[]> => {
  try {
    let prompt = `Generate a skill universe for role: ${role}.`;
    
    if (userRole === UserRole.EMPLOYEE) {
      prompt += ` Focus on a personal learning path. Create 1 Galaxy, 3 Planets, and 2 Moons per Planet. Ensure one Planet is specifically 'Backend Systems' if it fits.`;
    } else if (userRole === UserRole.MANAGER) {
      prompt += ` Focus on team capabilities. Create 1 Galaxy (The Dept), 3 Teams (as Planets), and 3 Users per Team (as Moons) representing their skills.`;
    } else if (userRole === UserRole.HR_ADMIN) {
      prompt += ` Focus on org-wide supply/demand. Create 4 Galaxies (Domains) with 2 Planets each. High demand planets should have high 'demand' scores.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_GENERATOR,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["GALAXY", "PLANET", "MOON", "TEAM", "USER"] },
              description: { type: Type.STRING },
              parentId: { type: Type.STRING, nullable: true },
              readiness: { type: Type.INTEGER },
              demand: { type: Type.INTEGER },
              color: { type: Type.STRING }
            },
            required: ["id", "name", "type", "description", "readiness", "demand"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as any[];
      return data.map(node => ({
        ...node,
        radius: calculateRadius(node.type, node.demand, userRole),
        color: node.color || getColor(node.type),
        decay: node.type === 'PLANET' && Math.random() > 0.7 ? Math.floor(Math.random() * 60) + 20 : 0,
        teamStats: node.type === 'TEAM' ? [
          { subject: 'Backend', A: Math.random() * 100, fullMark: 100 },
          { subject: 'Frontend', A: Math.random() * 100, fullMark: 100 },
          { subject: 'DevOps', A: Math.random() * 100, fullMark: 100 },
          { subject: 'Data', A: Math.random() * 100, fullMark: 100 },
          { subject: 'QA', A: Math.random() * 100, fullMark: 100 },
          { subject: 'Security', A: Math.random() * 100, fullMark: 100 },
        ] : undefined
      }));
    }
    return getFallbackData(userRole);
  } catch (error) {
    console.error("Failed to generate universe:", error);
    return getFallbackData(userRole);
  }
};

function calculateRadius(type: string, demand: number, role: UserRole): number {
  const base = type === 'GALAXY' ? 60 : type === 'PLANET' || type === 'TEAM' ? 30 : 10;
  if (role === UserRole.HR_ADMIN && demand > 80) return base * 1.5;
  return base;
}

function getColor(type: string) {
  switch(type) {
    case 'GALAXY': return '#6366f1';
    case 'PLANET': return '#3b82f6';
    case 'MOON': return '#94a3b8';
    case 'TEAM': return '#10b981';
    case 'USER': return '#f59e0b';
    default: return '#cbd5e1';
  }
}

export const generateSimulationScenario = async (skillName: string, user?: UserState, readiness: number = 0): Promise<SimulationScenario> => {
  try {
    const effectiveExperience = (user?.level || 1) * 10 + (readiness / 2);
    let targetDifficulty: 'Junior' | 'Mid' | 'Senior' = "Mid";
    
    if (effectiveExperience < 40) targetDifficulty = "Junior";
    else if (effectiveExperience > 85) targetDifficulty = "Senior";

    const contextPrompt = user ? `User is a Level ${user.level} ${user.title} with role ${user.role}. ` : "";
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `${contextPrompt}Create a realistic enterprise simulation scenario for: ${skillName}.
      The user has a current readiness of ${readiness}% in this node.
      Requirement: The scenario complexity MUST be precisely at the ${targetDifficulty} level.
      High-stakes enterprise context is preferred.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            objective: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Junior", "Mid", "Senior"] },
            initialContext: { type: Type.STRING }
          },
          required: ["title", "objective", "difficulty", "initialContext"]
        }
      }
    });
    return JSON.parse(response.text!) as SimulationScenario;
  } catch (error) {
    console.error("Scenario generation failed:", error);
    return {
      title: `${skillName} Challenge`,
      objective: "Demonstrate proficiency in this domain.",
      difficulty: "Mid",
      initialContext: "The system has initialized a standard calibration protocol. Your response is required."
    };
  }
};

export const evaluatePerformance = async (
  scenario: SimulationScenario, 
  history: any[], 
  availableResources: LearningResource[]
): Promise<{ feedback: string; score: number; recommendedResourceIds: string[] }> => {
  try {
    const userMessages = history.filter(m => m.role === 'user').map(m => m.content).join('\n');
    const resourceList = availableResources.map(r => `ID: ${r.id}, Title: ${r.title}`).join('\n');
    
    const prompt = `
      Analyze performance.
      Objective: ${scenario.objective}
      Actions: ${userMessages}
      Resources: ${resourceList}
      
      Return JSON with feedback, score (0-100), and up to 2 Resource IDs.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            score: { type: Type.INTEGER },
            recommendedResourceIds: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["feedback", "score", "recommendedResourceIds"]
        }
      }
    });

    return JSON.parse(response.text!) as any;
  } catch (error) {
    return {
      feedback: "Manual evaluation pending.",
      score: 75,
      recommendedResourceIds: []
    };
  }
};

export const getLearningResources = async (skillName: string, user?: UserState, readiness: number = 0): Promise<LearningResource[]> => {
  try {
    // 1. Generate optimized YouTube query based on the specific skill domain
    const queryGen = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a high-precision YouTube search query for learning '${skillName}'. 
      Context: Enterprise professional environment. 
      Focus: Architecture, real-world implementation, and advanced concepts.
      Example for 'Backend Systems': 'Advanced Backend Architecture and System Design for Scalability'.`,
    });
    const searchQuery = queryGen.text?.trim() || `${skillName} architecture tutorial`;
    
    // 2. Fetch real YouTube results
    const ytResults = await searchYouTubeVideos(searchQuery, 4);
    
    // 3. Use Gemini to curate these AND suggest targeted Udemy courses for a personalized path
    const videoDataStr = ytResults.map(v => `ID: ${v.id}, Title: ${v.title}, Desc: ${v.description.substring(0, 80)}...`).join('\n');
    const gapAnalysis = readiness < 40 ? "Foundational gaps detected." : readiness < 75 ? "Intermediate proficiency identified. Needs implementation depth." : "Advanced user. Focus on specialized mastery.";
    
    const curationPrompt = `
      Skill: ${skillName}
      User Readiness: ${readiness}% (${gapAnalysis})
      User Title: ${user?.title || 'Professional'}
      
      Available YouTube Metadata:
      ${videoDataStr}

      STRICT INSTRUCTIONS:
      1. Review the YouTube videos. ONLY include them if they are strictly relevant to '${skillName}'.
      2. SUGGEST exactly 2 legendary Udemy courses specifically for '${skillName}'. These must be real, high-rated courses.
      3. Organize resources into a structured 3-Phase Roadmap (Foundations, Implementation, Advanced Mastery).
      4. For each resource, explain its 'relevance' based on the user's current readiness (${readiness}%).
      
      Return JSON array of LearningResource objects.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: curationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              provider: { type: Type.STRING, enum: ["YOUTUBE", "UDEMY", "DOCS", "INTERNAL"] },
              description: { type: Type.STRING },
              relevance: { type: Type.STRING },
              pathStep: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "title", "provider", "description", "relevance", "pathStep", "tags"]
          }
        }
      }
    });

    const curatedItems = JSON.parse(response.text!) as any[];
    
    return curatedItems.map(item => {
      const ytMatch = ytResults.find(v => v.id === item.id);
      
      // Personalized URL generation for search grounding
      const udemySearchUrl = `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skillName + ' ' + item.title)}`;
      const docsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(skillName + ' official documentation ' + item.title)}`;

      return {
        id: item.id,
        title: item.title,
        provider: item.provider,
        url: item.provider === 'YOUTUBE' ? item.id : (item.provider === 'UDEMY' ? udemySearchUrl : docsSearchUrl),
        description: item.description,
        relevance: item.relevance,
        pathStep: item.pathStep,
        tags: item.tags,
        thumbnail: ytMatch?.thumbnail || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&fit=crop`,
        viewCount: ytMatch?.viewCount,
        publishedAt: ytMatch?.publishedAt
      };
    });
  } catch (error) {
    console.warn("Resource curation protocol failed. Returning high-quality fallback path.", error);
    return getFallbackPath(skillName, readiness);
  }
};

const getFallbackPath = (skillName: string, readiness: number): LearningResource[] => {
  const isLow = readiness < 50;
  return [
    {
      id: "fallback-yt-1",
      title: `${skillName} Foundations & Architecture`,
      provider: "YOUTUBE",
      url: "dQw4w9WgXcQ", // Placeholder
      description: `Comprehensive overview of modern ${skillName} principles.`,
      relevance: isLow ? "Critical for establishing foundational context." : "Recommended for architectural review.",
      pathStep: "Phase 1: Foundations",
      tags: ["Essential", "Core"],
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&fit=crop"
    },
    {
      id: "fallback-udemy-1",
      title: `The Complete ${skillName} Bootcamp`,
      provider: "UDEMY",
      url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skillName)}`,
      description: "Structured certification path with hands-on labs.",
      relevance: "Fills systematic gaps in production implementation.",
      pathStep: "Phase 2: Advanced Implementation",
      tags: ["Certification", "Production"],
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&fit=crop"
    }
  ];
};

export const processSmartChat = async (
  message: string, 
  history: any[], 
  tools: { useSearch?: boolean, useMaps?: boolean, useThinking?: boolean },
  context?: string
) => {
  const model = tools.useThinking ? 'gemini-3-pro-preview' : (tools.useSearch ? 'gemini-3-flash-preview' : (tools.useMaps ? 'gemini-2.5-flash' : 'gemini-3-pro-preview'));
  const config: any = {};
  if (tools.useThinking) config.thinkingConfig = { thinkingBudget: 32768 };
  if (tools.useSearch) config.tools = [{ googleSearch: {} }];
  if (tools.useMaps) config.tools = [{ googleMaps: {} }];
  
  let finalMessage = context ? `[CONTEXT: ${context}] \n\nQuery: ${message}` : message;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: finalMessage,
      config: config
    });
    return { text: response.text, groundingMetadata: response.candidates?.[0]?.groundingMetadata };
  } catch (e) {
    return { text: "Uplink destabilized. Please refresh connection." };
  }
};

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K', aspectRatio: '1:1' | '4:3' | '16:9' | '3:4' | '9:16' = '1:1') => {
  try {
    if ((window as any).aistudio && !await (window as any).aistudio.hasSelectedApiKey()) {
      await (window as any).aistudio.openSelectKey();
    }
    const aiLocal = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await aiLocal.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { imageSize: size, aspectRatio: aspectRatio } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (e) { throw e; }
};

export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageBase64?: string) => {
  try {
    if ((window as any).aistudio && !await (window as any).aistudio.hasSelectedApiKey()) {
      await (window as any).aistudio.openSelectKey();
    }
    const aiLocal = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await aiLocal.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      image: imageBase64 ? { imageBytes: imageBase64, mimeType: 'image/png' } : undefined,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await aiLocal.operations.getVideosOperation({ operation });
    }
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
        const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        const blob = await videoRes.blob();
        return URL.createObjectURL(blob);
    }
    return null;
  } catch (e) { throw e; }
};

export const analyzeMedia = async (file: File, prompt: string, isVideo: boolean) => {
  const reader = new FileReader();
  const base64Data = await new Promise<string>((resolve) => {
    reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ inlineData: { mimeType: file.type, data: base64Data } }, { text: prompt }] }
    });
    return response.text;
  } catch (e) { return "Protocol audit failed."; }
};

const getFallbackData = (role: UserRole): SkillNode[] => [
  { id: 'g1', name: 'Cloud Engineering', type: 'GALAXY', description: 'Major Domain', radius: 60, color: '#6366f1', readiness: 75, demand: 90, x: 0, y: 0 },
  { id: 'p1', name: 'Backend Systems', type: 'PLANET', description: 'Advanced System Architecture', parentId: 'g1', radius: 30, color: '#3b82f6', readiness: 40, demand: 95, x: 100, y: 100 },
];
