
import type { Ingredient } from '@/types';
import { GoogleGenAI } from '@google/genai';

export async function extractIngredientsFromUrl(url: string): Promise<Ingredient[]> {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY environment variable not set. Please ensure it's configured.");
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const prompt = `You are a professional recipe extraction assistant. 
    Analyze the recipe at the URL: ${url}. 
    Extract all ingredients with their quantities and units. 
    Respond with ONLY a valid JSON array of objects. 
    Each object must have a "name" and a "quantity" key. 
    Do not add any commentary, explanations, or markdown formatting.
    Example format:
    [
    {"name": "All-purpose flour", "quantity": "2 cups"},
    {"name": "Baking soda", "quantity": "1 tsp"}
    ]`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        if (!response.text) {
            throw new Error("No ingredients found.");
        }

        const jsonText = response.text.trim();

        // Sometimes the model wraps the JSON in a markdown code block.
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]) as Ingredient[];
        }

        // Check for raw JSON array.
        if (jsonText.startsWith('[') && jsonText.endsWith(']')) {
            return JSON.parse(jsonText) as Ingredient[];
        }

        console.error("Failed to parse JSON from model response:", jsonText);
        throw new Error("The model did not return a valid JSON array of ingredients. Please try another URL.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to extract ingredients. The model may not be able to access this URL or the recipe format is unsupported. Please try a different one.`);
        }
        throw new Error("An unknown error occurred while processing the recipe.");
    }
}
