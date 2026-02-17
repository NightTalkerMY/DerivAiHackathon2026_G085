// src/ai/aiTutor.js
export async function* askTutorStream(payload) {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: payload.user_id,
      query: payload.query,
      user_state: payload.user_state || {
        current_chapter: "2. Risk Management",
        finished_chapters: ["1. Psychology"],
        unfinished_chapters: ["3. Technical Analysis"],
        win_rate: "42%"
      }
    }),
  });

  if (!response.ok) throw new Error('Sensei is silent...');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop();

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || !cleanLine.startsWith("data: ")) continue;
      
      const data = cleanLine.replace("data: ", "");
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        
        // --- CHANGED HERE ---
        // If it's the final metadata packet (has 'done': true), yield the whole object
        if (parsed.done) {
            yield parsed; 
        } 
        // If it's a text chunk, yield just the text
        else if (parsed.text) {
            yield parsed.text;
        }
        
        if (parsed.error) throw new Error(parsed.error);
      } catch (e) {
        console.error("Parse Error:", data, e);
      }
    }
  }
}