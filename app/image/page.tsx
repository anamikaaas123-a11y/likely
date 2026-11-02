"use client";

import { useState } from "react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateImage() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setImage("");

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Image generation failed.");
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      setImage(imageUrl);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="image-generator">

      <header className="image-header">
        <a href="/" className="image-brand">likely.</a>
        <span>AI Image Generator</span>
      </header>

      <section className="image-content">

        <h1>Create something amazing.</h1>

        <p>
          Turn your imagination into images with Likely.
        </p>

        <div className="image-prompt-box">

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            rows={4}
            maxLength={1000}
          />

          <div className="prompt-footer">

            <span>{prompt.length}/1000</span>

            <button
              onClick={generateImage}
              disabled={!prompt.trim() || loading}
            >
              {loading ? "Generating..." : "✦ Generate Image"}
            </button>

          </div>

        </div>

        {loading && (
          <div className="image-loading">
            <div className="image-spinner"></div>
            <p>Likely is creating your image...</p>
            <span>This may take a little while.</span>
          </div>
        )}

        {error && (
          <div className="image-error">
            {error}
          </div>
        )}

        {image && (
          <div className="generated-result">

            <h2>Your generated image</h2>

            <img
              src={image}
              alt="AI generated artwork"
            />

            <a
              href={image}
              download="likely-generated-image.png"
              className="download-image"
            >
              ↓ Download Image
            </a>

          </div>
        )}

      </section>

    </main>
  );
}