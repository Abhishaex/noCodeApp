import { GoogleGenAI } from "@google/genai";

const systemPromptNew = `You are a frontend code generator. Given a user's description of a website or UI, you respond with TWO parts in this exact format:

1. First, a short friendly reply (1-2 sentences) confirming what you built.
2. Then a fenced code block with the label FRONTEND_HTML containing a single complete HTML document that implements the request.

Rules for the HTML:
- Use only HTML, CSS, and vanilla JavaScript. No build tools or frameworks.
- Use inline styles or a single <style> block. You may use Tailwind via CDN: <script src="https://cdn.tailwindcss.com"></script>.
- The page must be self-contained (one full HTML document) and render correctly in a browser.
- Make it responsive and good-looking.
- Do not include any text or comment outside the FRONTEND_HTML block that could break parsing.
- Do not write the word FRONTEND_HTML inside the code block or in your reply text—use it only as the code fence label (on the line with the opening \`\`\`).

Example format of your response:
I built a simple landing page with a hero and CTA button.

\`\`\`FRONTEND_HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>...</title><script src="https://cdn.tailwindcss.com"></script></head>
<body>...</body>
</html>
\`\`\``;

const systemPromptAmendment = `You are a frontend code generator. The user is CHATTING and wants to UPDATE the existing design—not replace it from scratch. They will give you the current HTML and a follow-up request (e.g. "make the button blue", "add a footer", "change the title"). You must:

1. Apply ONLY the requested change(s) to the existing HTML. Keep everything else the same.
2. Respond with TWO parts in this exact format:
   - First: a short friendly reply (1-2 sentences) confirming what you changed.
   - Then: a fenced code block with the label FRONTEND_HTML containing the FULL updated HTML document (complete, runnable page).

Rules:
- Output the ENTIRE HTML document in the FRONTEND_HTML block, not just a snippet. The result must be one complete <!DOCTYPE html>... document.
- Preserve existing structure, styles, and content except where the user asked for changes.
- Use only HTML, CSS, and vanilla JavaScript. No build tools or frameworks.
- Do not include any text or comment outside the FRONTEND_HTML block that could break parsing.
- Do not write the word FRONTEND_HTML inside the code block or in your reply—use it only as the fence label (e.g. \`\`\`FRONTEND_HTML on the opening line only).`;

export async function generateFrontend(
  userPrompt: string,
  previousHtml?: string | null
): Promise<{ reply: string; html: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });

  const isAmendment = previousHtml && previousHtml.trim().length > 0;

  const contents = isAmendment
    ? `${systemPromptAmendment}\n\n---\n\nCurrent HTML (to be updated):\n\n${previousHtml}\n\n---\n\nUser's follow-up request: ${userPrompt}`
    : `${systemPromptNew}\n\n---\n\nUser request: ${userPrompt}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
  });

  const text = response.text ?? "";

  // Reply is everything before the first ```; remove any FRONTEND_HTML that leaked into it
  const replyRaw = text.split("```")[0].trim();
  const reply = replyRaw.replace(/\s*FRONTEND_HTML\s*/gi, " ").replace(/\s+/g, " ").trim();

  // Extract HTML from code block – try several formats the model might use
  let html = "";
  const frontendMatch = text.match(/```(?:FRONTEND_HTML|frontend_html)\s*\n?([\s\S]*?)```/i);
  if (frontendMatch) {
    html = frontendMatch[1].trim();
  }
  if (!html) {
    const htmlBlockMatch = text.match(/```html\s*\n?([\s\S]*?)```/i);
    if (htmlBlockMatch) html = htmlBlockMatch[1].trim();
  }
  if (!html) {
    // Fallback: split by ``` and take the segment that looks like a full HTML document
    const parts = text.split("```");
    for (let i = 1; i < parts.length; i += 2) {
      const block = parts[i].replace(/^\w*\s*\n?/, "").trim();
      if (/<!DOCTYPE\s+html/i.test(block) && /<\/html\s*>/i.test(block)) {
        html = block;
        break;
      }
    }
  }

  // Remove FRONTEND_HTML from extracted HTML (model sometimes puts it as first line or in a comment)
  if (html) {
    html = html
      .replace(/^\s*FRONTEND_HTML\s*\n?/i, "")
      .replace(/\s*FRONTEND_HTML\s*\n?/gi, "")
      .replace(/<!--\s*FRONTEND_HTML\s*-->/gi, "")
      .trim();
  }

  return { reply, html };
}
