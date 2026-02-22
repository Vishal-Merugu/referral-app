const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const texts = ['Hello world', 'Another sentence'];
    const result = await model.batchEmbedContents({
      requests: texts.map((t) => ({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: t }] },
      })),
    });
    console.log('batch SUCCESS', result.embeddings.length);
  } catch (e) {
    console.error('batch ERR:', e.message);
  }
}
run();
