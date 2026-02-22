const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "AIzaSyAmB_kZ7_9V9HY61WmlvPiHcnBUAuAOiRA");

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent("Hello world");
    console.log("text-embedding-004 SUCCESS", result.embedding.values.length);
  } catch (e) {
    console.error("text-embedding-004 ERR:", e.message);
  }
}
run();
