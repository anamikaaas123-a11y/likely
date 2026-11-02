"use client";

import { useState } from "react";

export default function VideoGenerator() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [prompt, setPrompt] = useState("");
  const [video, setVideo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImage(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please select an image smaller than 10 MB.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setVideo("");
    setError("");
  }

  async function generateVideo() {
    if (!image || !prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setVideo("");

    try {
      const formData = new FormData();

      formData.append("image", image);
      formData.append("prompt", prompt);

      const response = await fetch("/api/video", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Video generation failed.");
      }

      setVideo(data.videoUrl);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="image-generator">

      <header className="image-header">
        <a href="/" className="image-brand">likely.</a>
        <span>AI Video Generator</span>
      </header>

      <section className="image-content">

        <h1>Bring your images to life.</h1>

        <p>
          Upload an image and describe the movement you want.
        </p>

        <div className="image-prompt-box">

          <label className="video-upload-label">
            Upload your image

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImage(e.target.files?.[0])
              }
            />
          </label>

          {preview && (
            <img
              src={preview}
              alt="Selected image"
              className="video-image-preview"
            />
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how you want your image to move..."
            rows={4}
          />

          <div className="prompt-footer">

            <span>Wan 2.2 Video Model</span>

            <button
              onClick={generateVideo}
              disabled={!image || !prompt.trim() || loading}
            >
              {loading ? "Generating..." : "✦ Generate Video"}
            </button>

          </div>

        </div>

        {loading && (
          <div className="image-loading">
            <div className="image-spinner"></div>

            <p>Likely is creating your video...</p>

            <span>
              Video generation may take several minutes.
              Please keep this page open.
            </span>
          </div>
        )}

        {error && (
          <div className="image-error">
            {error}
          </div>
        )}

        {video && (
          <div className="generated-result">

            <h2>Your generated video</h2>

            <video
              src={video}
              controls
              autoPlay
              loop
              className="generated-video"
            />

            <a
              href={video}
              target="_blank"
              rel="noreferrer"
              className="download-image"
            >
              Open Video
            </a>

          </div>
        )}

      </section>

    </main>
  );
}