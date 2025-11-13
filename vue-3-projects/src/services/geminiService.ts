import type { Recipe } from '@/types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

async function fetchWithRetry(url: string, payload: any, maxRetries: number = 5): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                const errorMessage = result.error?.message || `HTTP error! status: ${response.status}`;

                if (response.status === 503 || response.status === 500) {
                    if (attempt < maxRetries) {
                        const delay = Math.pow(2, attempt) * 1000;
                        console.warn(`Attempt ${attempt} failed with ${response.status}. Retrying in ${delay / 1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw new Error(`The model is temporarily unavailable (503/500). Max retries exceeded: ${errorMessage}`);
                }

                throw new Error(`API Error: ${errorMessage}`);
            }

            return result;

        } catch (error) {
            console.error(`Error during API call attempt ${attempt}:`, error);
            if (attempt === maxRetries) {
                throw new Error(`An error occurred while processing the recipe: ${(error as Error).message}`);
            }
        }
    }
    throw new Error("Failed to extract recipe after multiple retries.");
}

export async function extractRecipeFromUrl(url: string): Promise<Recipe> {
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set. Please ensure it's configured.");
    }

    const prompt = `You are a professional recipe extraction assistant. Use Google Search Grounding to analyze the recipe at the URL: ${url}. 
    Extract the recipe name, all ingredients with their quantities and units, and all steps or instructions for making the recipe.
    
    Respond ONLY with a valid JSON object. 
    You MUST wrap the entire JSON object in a 'json' markdown code block. Do NOT include any other text, greetings, or explanations outside the JSON block.

    Example Format:
    
    \`\`\`json
    {
        "recipeName": "Recipe Title",
        "ingredients":
        [
            {"name": "Ingredient Name", "quantity": "2 cups"},
            {"name": "Another Ingredient", "quantity": "1 tsp"}
        ],
        "steps":
        [
            {"number": 1, "description": "First step."},
            {"number": 2, "description": "Second step."}
        ]
    }
    \`\`\`
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ "google_search": {} }],
    };

    try {
        const result = await fetchWithRetry(API_URL, payload);

        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!jsonText) {
            throw new Error("The model did not return any content.");
        }

        let contentToParse = jsonText.trim();

        const jsonMatch = contentToParse.match(/```json\s*([\s\S]*?)\s*```/);

        if (jsonMatch && jsonMatch[1]) {
            contentToParse = jsonMatch[1].trim();
        }

        if (!contentToParse.startsWith('{') || !contentToParse.endsWith('}')) {
            console.error("Content failed final JSON check:", contentToParse);
            throw new Error("Model returned content but it was not wrapped in a valid JSON block as requested.");
        }

        const recipe = JSON.parse(contentToParse) as Recipe;
        return recipe;

    } catch (error) {
        throw new Error(`Failed to extract recipe: ${(error as Error).message}.`);
    }
}
