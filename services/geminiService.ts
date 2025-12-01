
import { GoogleGenAI } from "@google/genai";
import { Category } from '../types';

// Define the static lists to ensure consistency and fallback availability
export const CATEGORY_DATA: Record<Category, string[]> = {
  [Category.MOVIES]: [
    "The Wolf of Wall Street", 
    "The Godfather", 
    "Titanic", 
    "Shrek", 
    "Spider-Man", 
    "Superman", 
    "Batman", 
    "The Purge", 
    "The Hangover (בדרך לחתונה עוצרים בוגאס)"
  ],
  [Category.TV_SHOWS]: [
    "Breaking Bad", 
    "Money Heist", 
    "Lupin", 
    "Snowfall", 
    "Dragon Ball",
    "The Blacklist"
  ],
  [Category.TV_ACTORS]: [
    "Walter White", 
    "Jesse Pinkman", 
    "Saul Goodman", 
    "Gus Fring", 
    "Mike Ehrmantraut", 
    "Hank Schrader",
    "The Professor", 
    "Tokyo", 
    "Berlin", 
    "Nairobi", 
    "Rio", 
    "Denver", 
    "Lisbon",
    "Raymond Reddington"
  ],
  [Category.FOOTBALL_PLAYERS]: [
    "Ronaldo Nazário (R9)", 
    "Cristiano Ronaldo", 
    "Lionel Messi", 
    "Diego Maradona", 
    "Neymar", 
    "Claudia Pina", 
    "Ewa Pajor", 
    "Ronaldinho"
  ],
};

const getSystemInstruction = () => `
You are a game master for a party game called "Gozlan".
Your job is to provide a single secret word or name based on a category.
Strictly adhere to the specific lists provided in the prompt if they exist.
Ensure the response is a simple JSON object: { "secret": "The Word" }.
`;

export const fetchSecretWord = async (category: Category, excludeWords: string[] = []): Promise<string> => {
  // Check if we've used all words in the list, if so, ignore the exclude list (reset cycle)
  const allWords = CATEGORY_DATA[category];
  const availableWords = allWords.filter(w => !excludeWords.includes(w));
  
  // If we ran out of unique words, just pick any random one (soft reset)
  if (availableWords.length === 0) {
    console.log("All words used, resetting cycle for this category.");
    return allWords[Math.floor(Math.random() * allWords.length)];
  }

  if (!process.env.API_KEY) {
    console.warn("No API Key found, using fallback words.");
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let prompt = "";
    const excludeString = excludeWords.length > 0 ? ` Do NOT choose any of these words: ${JSON.stringify(excludeWords)}.` : "";

    switch (category) {
      case Category.MOVIES:
        prompt = `Select exactly one movie from this specific list: The Wolf of Wall Street, The Godfather, Titanic, Shrek, Spider-Man, Superman, Batman, The Purge, The Hangover (בדרך לחתונה עוצרים בוגאס).${excludeString}`;
        break;
      case Category.TV_SHOWS:
        prompt = `Select exactly one TV show from this specific list: Breaking Bad, Money Heist, Lupin, Snowfall, Dragon Ball, The Blacklist.${excludeString}`;
        break;
      case Category.TV_ACTORS:
        prompt = `Select exactly one famous CHARACTER NAME from the TV shows 'Breaking Bad', 'Money Heist', or 'The Blacklist'. Pool includes: Walter White, Jesse Pinkman, The Professor, Tokyo, Berlin, Saul Goodman, Raymond Reddington, etc. Do not use real names.${excludeString}`;
        break;
      case Category.FOOTBALL_PLAYERS:
        prompt = `Select exactly one football player from this specific list: Ronaldo Nazário (R9), Cristiano Ronaldo, Lionel Messi, Diego Maradona, Neymar, Claudia Pina, Ewa Pajor, Ronaldinho.${excludeString}`;
        break;
      default:
        prompt = `Give me a random popular noun.${excludeString}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: getSystemInstruction(),
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    const json = JSON.parse(text);
    let secret = json.secret;

    // Client-side double check to ensure uniqueness if the AI ignored the instruction
    if (excludeWords.includes(secret)) {
       console.warn("AI returned a used word, using fallback unique selection.");
       secret = availableWords[Math.floor(Math.random() * availableWords.length)];
    }

    return secret || availableWords[Math.floor(Math.random() * availableWords.length)];

  } catch (error) {
    console.error("Gemini API Error:", error);
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }
};
