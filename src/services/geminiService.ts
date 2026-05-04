import { GoogleGenAI, Type } from "@google/genai";
import { Repository } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async recommendKeywords(likedRepos: Repository[]): Promise<string[]> {
    if (likedRepos.length === 0) return [];

    const repoContext = likedRepos.map(r => `${r.full_name}: ${r.description}`).join('\n');

    const prompt = `Based on the following GitHub repositories a user likes, recommend 5-8 search keywords or technology tags that would help them discover similar interesting projects. Just return a JSON array of strings.
    
    User Liked Repos:
    ${repoContext}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return [];
    }
  },

  async summarizeInterests(interests: string[], likedRepos: Repository[]): Promise<string> {
    const context = [
      `Declared interests: ${interests.join(', ')}`,
      `Liked Repos: ${likedRepos.map(r => r.name).join(', ')}`
    ].join('\n');

    const prompt = `Summarize the technical persona of this developer in 2 sentences based on these interests and liked repositories:
    ${context}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      return response.text || "A curious developer exploring various technologies.";
    } catch (error) {
      return "An innovative developer seeking great projects.";
    }
  }
};
