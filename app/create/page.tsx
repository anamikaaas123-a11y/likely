"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

export default function CreatePDF() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateContent() {
    if (!prompt.trim()) {
      setError("Please describe the PDF you want to create.");
      return;
    }

    setLoading(true);
    setError("");
    setContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Create detailed, well-structured document content for this request: ${prompt}. Use clear headings, explanations, examples and a suitable conclusion. Format it so it can be converted into a professional PDF.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Content generation failed.");
      }

      setContent(data.answer);
      setTitle(prompt.slice(0, 60));
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

  function downloadPDF() {
    if (!content.trim()) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 7;

    let y = 25;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);

    const heading = title || "Likely Document";
    const headingLines = pdf.splitTextToSize(heading, maxWidth);

    pdf.text(headingLines, margin, y);
    y += headingLines.length * 10 + 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const paragraphs = content.split("\n");

    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();

      if (!trimmed) {
        y += 4;
        return;
      }

      const lines = pdf.splitTextToSize(trimmed, maxWidth);

      if (y + lines.length * lineHeight > pageHeight - 20) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(lines, margin, y);
      y += lines.length * lineHeight + 3;
    });

    pdf.save("Likely-Document.pdf");
  }

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        <a
          href="/"
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Back to Likely
        </a>

        <div className="mt-10 mb-8">
          <p className="text-sm text-purple-400 font-semibold">
            LIKELY CREATE STUDIO
          </p>

          <h1 className="text-4xl font-bold mt-3">
            PDF Generator
          </h1>

          <p className="text-gray-400 mt-3">
            Turn your ideas into professionally structured PDF documents.
          </p>
        </div>

        <div className="bg-[#17171f] border border-gray-800 rounded-2xl p-6">

          <label className="block text-sm font-medium mb-3">
            What would you like to create?
          </label>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create detailed Operating Systems exam notes covering process management, threads and concurrency..."
            className="w-full min-h-36 bg-[#0d0d13] border border-gray-700 rounded-xl p-4 outline-none focus:border-purple-500 resize-y"
          />

          <button
            onClick={generateContent}
            disabled={loading}
            className="mt-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold"
          >
            {loading ? "Generating..." : "Generate Document"}
          </button>

          {loading && (
            <p className="text-purple-300 mt-4 text-sm animate-pulse">
              Likely is preparing your document...
            </p>
          )}

          {error && (
            <p className="text-red-400 mt-4 text-sm">
              {error}
            </p>
          )}

        </div>

        {content && (
          <div className="mt-8 bg-[#17171f] border border-gray-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Document Preview
            </h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0d0d13] border border-gray-700 rounded-lg p-3 mb-4 outline-none focus:border-purple-500"
              placeholder="Document title"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-96 bg-[#0d0d13] border border-gray-700 rounded-xl p-4 text-gray-200 leading-7 outline-none focus:border-purple-500 resize-y"
            />

            <button
              onClick={downloadPDF}
              className="mt-5 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold"
            >
              Download PDF
            </button>

          </div>
        )}

      </div>
    </main>
  );
}