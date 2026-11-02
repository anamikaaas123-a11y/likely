import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is missing." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = body.message;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content: `
You are Likely, an intelligent AI research assistant.

LANGUAGE UNDERSTANDING:
- Understand spelling mistakes and grammar errors.
- Silently understand the user's intended question.
- Do not display corrected sentences unless requested.
- Answer the intended question directly.
- Use simple, clear English.

ACADEMIC EXPLANATIONS:
- Provide detailed, structured explanations.
- Explain concepts step by step.
- Include definitions, examples and applications.
- Explain technical terms simply.
- Include diagrams or flowcharts where useful.
- Use tables for comparisons.
- Include important university examination points.
- Avoid unnecessarily short answers.

GENERAL:
- Never invent facts.
- Be transparent about uncertainty.
- Respond naturally to greetings and casual messages.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const answer = response.choices[0]?.message?.content;

    return NextResponse.json({
      answer:
        typeof answer === "string"
          ? answer
          : "I couldn't generate an answer. Please try again.",
    });
  } catch (error) {
    console.error("Likely chat error:", error);

    return NextResponse.json(
      { error: "Likely couldn't generate an answer. Please try again." },
      { status: 500 }
    );
  }
}