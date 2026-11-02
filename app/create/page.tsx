"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CreatePage() {
  const [title, setTitle] = useState("My Document");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateDocument() {
    if (!prompt.trim()) {
      setError("Please enter what you want to create.");
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
          message: `Create a professionally structured document about:

${prompt}

Formatting instructions:
- Use # for the main heading.
- Use ## for section headings.
- Use ### for smaller headings.
- Use **text** for bold text.
- Use *text* for italic text.
- Use bullet points where appropriate.
- Use numbered lists for procedures.
- Use Markdown tables for comparisons.
- Use code blocks for programming examples.
- Include an introduction and conclusion when appropriate.
- Keep all important information.
- Organise the content clearly.
- Return only the document content.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate document.");
      }

      if (!data.answer || typeof data.answer !== "string") {
        throw new Error("The AI returned an empty document. Please try again.");
      }

      setContent(data.answer);
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
    if (!content.trim()) {
      setError("Generate a document before downloading.");
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const maxWidth = pageWidth - margin * 2;
      const bottomMargin = 20;

      let y = 25;

      function checkPage(height = 8) {
        if (y + height > pageHeight - bottomMargin) {
          pdf.addPage();
          y = 20;
        }
      }

      function addHeading(text: string, level: number) {
        y += 3;

        const fontSize = level === 1 ? 20 : level === 2 ? 16 : 13;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(fontSize);

        const lines = pdf.splitTextToSize(text, maxWidth);
        const lineHeight = fontSize * 0.55;

        lines.forEach((line: string) => {
          checkPage(lineHeight);
          pdf.text(line, margin, y);
          y += lineHeight;
        });

        y += 3;
      }

      function addFormattedText(text: string, fontSize = 11) {
        // Handles bold, italic and inline code.
        // Markdown links are treated as normal text.
        const tokenPattern =
          /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+`)/g;

        const tokens = text.split(tokenPattern).filter(Boolean);

        let x = margin;
        const maxX = pageWidth - margin;
        const lineHeight = fontSize * 0.45 + 1.5;

        pdf.setFontSize(fontSize);

        tokens.forEach((token) => {
          let value = token;
          let style: "normal" | "bold" | "italic" = "normal";
          let font = "helvetica";

          if (token.startsWith("**") && token.endsWith("**")) {
            value = token.slice(2, -2);
            style = "bold";
          } else if (token.startsWith("*") && token.endsWith("*")) {
            value = token.slice(1, -1);
            style = "italic";
          } else if (token.startsWith("`") && token.endsWith("`")) {
            value = token.slice(1, -1);
            font = "courier";
          }

          pdf.setFont(font, style);
          pdf.setFontSize(fontSize);

          const words = value.split(/(\s+)/);

          words.forEach((word) => {
            if (!word) return;

            const wordWidth = pdf.getTextWidth(word);

            if (x + wordWidth > maxX && x > margin) {
              y += lineHeight;
              x = margin;
              checkPage(lineHeight);
            }

            checkPage(lineHeight);
            pdf.text(word, x, y);
            x += wordWidth;
          });
        });
        y += lineHeight;
      }

      function addCodeBlock(lines: string[]) {
        const fontSize = 9;
        const lineHeight = 5;
        const padding = 4;

        pdf.setFont("courier", "normal");
        pdf.setFontSize(fontSize);

        const formattedLines: string[] = [];

        lines.forEach((line) => {
          const wrapped = pdf.splitTextToSize(
            line || " ",
            maxWidth - padding * 2
          );
          formattedLines.push(...wrapped);
        });

        formattedLines.forEach((line) => {
          checkPage(lineHeight + 4);

          pdf.setFillColor(242, 242, 242);
          pdf.roundedRect(
            margin,
            y - 4,
            maxWidth,
            lineHeight + 2,
            1,
            1,
            "F"
          );

          pdf.setFont("courier", "normal");
          pdf.setFontSize(fontSize);
          pdf.setTextColor(40, 40, 40);
          pdf.text(line, margin + padding, y);

          y += lineHeight + 2;
        });

        y += 4;
        pdf.setTextColor(0, 0, 0);
      }

      function addTable(rows: string[][]) {
        if (rows.length === 0) return;

        const columns = Math.max(...rows.map((row) => row.length));
        const columnWidth = maxWidth / columns;

        rows.forEach((row, rowIndex) => {
          const cells = Array.from(
            { length: columns },
            (_, index) => row[index] || ""
          );

          const cellLines = cells.map((cell) =>
            pdf.splitTextToSize(cell, columnWidth - 4)
          );

          const maxLines = Math.max(
            1,
            ...cellLines.map((lines) => lines.length)
          );

          const rowHeight = Math.max(9, maxLines * 5 + 4);

          checkPage(rowHeight);

          if (rowIndex === 0) {
            pdf.setFillColor(225, 230, 240);
          } else {
            pdf.setFillColor(250, 250, 250);
          }

          pdf.setDrawColor(190, 190, 190);
          pdf.rect(margin, y - 5, maxWidth, rowHeight, "FD");

          cells.forEach((_, columnIndex) => {
            const x = margin + columnIndex * columnWidth;

            if (columnIndex > 0) {
              pdf.line(
                x,
                y - 5,
                x,
                y - 5 + rowHeight
              );
            }

            pdf.setFont(
              "helvetica",
              rowIndex === 0 ? "bold" : "normal"
            );
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);

            cellLines[columnIndex].forEach(
              (line: string, lineIndex: number) => {
                pdf.text(line, x + 2, y + lineIndex * 5);
              }
            );
          });

          y += rowHeight;
        });

        y += 5;
      }

      // Document title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);

      const titleLines = pdf.splitTextToSize(title, maxWidth);

      titleLines.forEach((line: string) => {
        checkPage(12);
        pdf.text(line, margin, y);
        y += 12;
      });

      y += 5;

      pdf.setDrawColor(160, 160, 160);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Markdown content processing
      const lines = content.split("\n");

      let insideCodeBlock = false;
      let codeLines: string[] = [];
      let tableRows: string[][] = [];

      function flushTable() {
        if (tableRows.length > 0) {
          addTable(tableRows);
          tableRows = [];
        }
      }

      function flushCode() {
        if (codeLines.length > 0) {
          addCodeBlock(codeLines);
          codeLines = [];
        }
      }

      lines.forEach((originalLine) => {
        const line = originalLine.trim();

        // Code blocks
        if (line.startsWith("```")) {
          flushTable();

          if (!insideCodeBlock) {
            insideCodeBlock = true;
            codeLines = [];
          } else {
            insideCodeBlock = false;
            flushCode();
          }

          return;
        }

        if (insideCodeBlock) {
          codeLines.push(originalLine);
          return;
        }

        // Markdown tables
        if (line.startsWith("|") && line.endsWith("|")) {
          const cells = line
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim());

          const isSeparator = cells.every((cell) =>
            /^:?-{3,}:?$/.test(cell)
          );

          if (!isSeparator) {
            tableRows.push(cells);
          }

          return;
        }

        flushTable();

        if (!line) {
          y += 3;
          return;
        }

        // Headings
        if (line.startsWith("### ")) {
          addHeading(line.replace(/^###\s+/, ""), 3);
          return;
        }

        if (line.startsWith("## ")) {
          addHeading(line.replace(/^##\s+/, ""), 2);
          return;
        }

        if (line.startsWith("# ")) {
          addHeading(line.replace(/^#\s+/, ""), 1);
          return;
        }

        // Horizontal rule
        if (/^([-*_])\1{2,}$/.test(line)) {
          checkPage(8);
          pdf.setDrawColor(180, 180, 180);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 7;
          return;
        }

        // Bullet lists
        if (/^[-*+]\s+/.test(line)) {
          addFormattedText("•  " + line.replace(/^[-*+]\s+/, ""));
          return;
        }

        // Numbered lists
        if (/^\d+[.)]\s+/.test(line)) {
          addFormattedText(line);
          return;
        }

        // Blockquotes
        if (line.startsWith("> ")) {
          const quote = line.replace(/^>\s?/, "");

          checkPage(10);
          pdf.setDrawColor(120, 120, 120);
          pdf.setLineWidth(0.8);
          pdf.line(margin + 2, y - 4, margin + 2, y + 5);

          pdf.setTextColor(90, 90, 90);
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);

          const quoteLines = pdf.splitTextToSize(
            quote,
            maxWidth - 8
          );

          quoteLines.forEach((quoteLine: string) => {
            checkPage(7);
            pdf.text(quoteLine, margin + 7, y);
            y += 6;
          });

          pdf.setTextColor(0, 0, 0);
          y += 3;
          return;
        }

        // Normal paragraphs
        addFormattedText(line);
      });

      flushTable();
      flushCode();

      // Page numbers
      const pageCount = pdf.getNumberOfPages();

      for (let page = 1; page <= pageCount; page++) {
        pdf.setPage(page);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);

        pdf.text(
          `Page ${page} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      const safeTitle =
        title.trim().replace(/[^\w-]+/g, "_") || "document";

      pdf.save(`${safeTitle}.pdf`);
      setError("");
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Unable to create the PDF. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white px-5 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          LIKELY CREATE STUDIO
        </h1>

        <p className="text-gray-400 mb-8">
          Turn your ideas into professionally structured PDF documents.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Document title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              What would you like to create?
            </label>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste your syllabus, notes, assignment or document requirements..."
              rows={6}
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 outline-none resize-y focus:border-gray-500"
            />
          </div>

          <button
            type="button"
            onClick={generateDocument}
            disabled={loading}
            className="bg-white text-black font-semibold rounded-lg px-6 py-3 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Document"}
          </button>

          {loading && (
            <p className="text-gray-400 text-sm">
              Likely is preparing your document...
            </p>
          )}

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          {/* Preview and PDF download */}
          {content.trim().length > 0 && (
            <div className="pt-6 border-t border-[#333]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold">
                  Document Preview
                </h2>

                <button
                  type="button"
                  onClick={downloadPDF}
                  className="bg-white text-black font-semibold rounded-lg px-5 py-3 hover:bg-gray-200"
                >
                  Download PDF
                </button>
              </div>

              <div className="w-full min-h-[400px] bg-[#1e1e1e] border border-[#333] rounded-lg p-6 text-gray-200">
                <article className="markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </article>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Your document is displayed with formatting. Click Download
                PDF to save it.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}