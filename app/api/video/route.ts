import { NextResponse } from "next/server";

const SPACE_URL = "https://kulkas2pintu-wan777.hf.space";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image");
    const prompt = formData.get("prompt");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an image." },
        { status: 400 }
      );
    }

    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please describe how the image should move." },
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file." },
        { status: 400 }
      );
    }

    // Upload the image to the Hugging Face Space.
    const uploadData = new FormData();
    uploadData.append("files", image, image.name);

    const uploadResponse = await fetch(
      `${SPACE_URL}/gradio_api/upload`,
      {
        method: "POST",
        body: uploadData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error("Image upload failed.");
    }

    const uploadedFiles = await uploadResponse.json();
    const imagePath = uploadedFiles[0];

    const imageData = {
      path: imagePath,
      url: `${SPACE_URL}/gradio_api/file=${imagePath}`,
      orig_name: image.name,
      mime_type: image.type,
      meta: { _type: "gradio.FileData" },
    };

    // Generate the video.
    const generationResponse = await fetch(
      `${SPACE_URL}/gradio_api/run/generate_video`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_image: imageData,
          last_image: imageData,
          prompt: prompt.trim(),
          steps: 8,
          negative_prompt: "blurry, distorted, low quality",
          duration_seconds: 3,
          guidance_scale: 1,
          guidance_scale_2: 1,
          seed: 0,
          randomize_seed: true,
          quality: 7,
          scheduler: "FlowMatchEulerDiscrete",
          flow_shift: 5,
          frame_multiplier: "16",
          video_component: true,
          safe_mode: true,
        }),
      }
    );

    const result = await generationResponse.json();

    if (!generationResponse.ok) {
      throw new Error(
        result.error || "Video generation failed."
      );
    }

    const videoData = result.output?.video;

    if (!videoData?.url && !videoData?.path) {
      throw new Error("The Space did not return a video.");
    }

    const videoUrl = videoData.url
      ? new URL(videoData.url, SPACE_URL).toString()
      : `${SPACE_URL}/gradio_api/file=${videoData.path}`;

    return NextResponse.json({ videoUrl });

  } catch (error) {
    console.error("Likely video error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Video generation failed. Please try again.",
      },
      { status: 500 }
    );
  }
}