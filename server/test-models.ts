import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  );
  const data = await response.json();

  if (data.models) {
    console.log('Available models for generateContent:');
    data.models
      .filter((m: any) =>
        m.supportedGenerationMethods.includes('generateContent'),
      )
      .forEach((m: any) => console.log(`- ${m.name}`));
  } else {
    console.log('Response:', data);
  }
}

listModels();
