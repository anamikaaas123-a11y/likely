import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const token = process.env.HF_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Hugging Face token is missing." },
        { status: 500 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please enter an image description." },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "Please keep your prompt under 1000 characters." },
        { status: 400 }
      );
    }

    const client = new InferenceClient(token);

    const imageBlob = await client.textToImage({
      model: "black-forest-labs/FLUX.1-dev",
      inputs: prompt.trim(),
    });

    return new Response(imageBlob, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error("Image generation error:", error);

    return NextResponse.json(
      {
        error: "Image generation failed. Please try again later."
      },
      { status: 500 }
    );
  }
}