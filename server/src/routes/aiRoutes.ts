import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

/* ─── POST /api/ai/match ──────────────────────────────
   Body: { resumeText: string }
   Returns: JSON object with extracted search filters:
   {
     role: string | null;
     experienceLevel: "JUNIOR" | "MID" | "SENIOR" | "STAFF" | null;
     skills: string[];
     remoteType: "REMOTE" | "HYBRID" | "ONSITE" | null;
   }
*/
router.post('/match', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { resumeText } = req.body as { resumeText: string };
    if (!resumeText || resumeText.trim().length < 50) {
      return res
        .status(400)
        .json({ error: 'Resume text must be at least 50 characters.' });
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    // If no API key configured, return empty filters (fallback)
    if (!apiKey) {
      console.warn(
        '[AI match] No Google API key found. Returning empty filters.',
      );
      return res.json({
        role: '',
        experienceLevel: '',
        skills: [],
        remoteType: '',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // We can use gemini-1.5-flash or gemini-2.5-flash depending on availability
    // Trying 1.5-flash first as it's universally available on new API keys
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `
      You are an expert technical recruiter and resume parser.
      Read the following resume or profile text and extract the applicant's core attributes so they can be used as search filters to find job postings.
      
      Extract the following fields in strict JSON format:
      1. "role": The primary job title they are looking for or most qualified for (e.g. "Frontend Engineer", "Product Manager"). Ensure it is a short, concise string. Return empty string if unknown.
      2. "experienceLevel": Analyze their years of experience and output EXACTLY one of these strings: "JUNIOR" (0-2 years), "MID" (3-5 years), "SENIOR" (6-9 years), "STAFF" (10+ years). Output empty string if unknown.
      3. "skills": An array of up to 5 core technical skills or tools mentioned in the text (e.g. ["React", "TypeScript", "AWS"]). Output empty array if none found.
      4. "remoteType": Based on their stated preferences, output EXACTLY one of these strings: "REMOTE", "HYBRID", "ONSITE". Return empty string if unknown.

      Resume Text:
      """
      ${resumeText}
      """
      
      Respond ONLY with the JSON object. Do not wrap it in markdown block quotes.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      // Parse the JSON. The model is instructed to return pure JSON.
      const parsed = JSON.parse(
        text
          .trim()
          .replace(/^```json/, '')
          .replace(/```$/, ''),
      );

      return res.json({
        role: parsed.role || '',
        experienceLevel: parsed.experienceLevel || '',
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        remoteType: parsed.remoteType || '',
      });
    } catch (parseErr) {
      console.error('[AI match] Failed to parse JSON from Gemini:', text);
      return res
        .status(500)
        .json({ error: 'Failed to extract filters from profile.' });
    }
  } catch (err) {
    console.error('[AI match]', err);
    return res
      .status(500)
      .json({ error: 'AI analysis failed. Try again later.' });
  }
});

export default router;
