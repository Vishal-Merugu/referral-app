import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-pro which has broader availability on older SDKs
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    You are an expert technical recruiter and resume parser.
    Extract the following fields in strict JSON format:
    1. "role"
    2. "experienceLevel"
    3. "skills"
    4. "remoteType"

    Resume Text:
    "I am a Senior Software Engineer with over 8 years of experience building modern web applications. I specialize in React, TypeScript, and Node.js. I am looking for a REMOTE position where I can lead a frontend team."
    
    Respond ONLY with the JSON format. Do not use block quotes.
  `;

  try {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
  } catch (e) {
    console.error('Error from Gemini:', e);
  }
}

test();
