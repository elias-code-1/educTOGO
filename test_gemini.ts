import { generateSummary } from './src/lib/gemini.ts';
async function run() {
  try {
    const res = await generateSummary("test", "text");
    console.log("Type of res:", typeof res);
    console.log("Length of res:", res?.length);
  } catch (e) {
    console.error(e);
  }
}
run();
