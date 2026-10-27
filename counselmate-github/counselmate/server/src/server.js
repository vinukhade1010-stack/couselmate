import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

try {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`CounselMate API running on http://localhost:${env.port}`);
    console.log(env.geminiKey ? 'Chatbot: Gemini AI is on.' : 'Chatbot: no GEMINI_API_KEY set, running in basic mode.');
  });
} catch (err) {
  console.error('Could not start the server:', err.message);
  process.exit(1);
}
