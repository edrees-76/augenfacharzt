import "server-only";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { PDFParse } from "pdf-parse";
import { splitTextIntoBlocks, type QuestionBlock } from "./splitQuestions";

export type ImportFileType = "PDF" | "DOCX" | "TXT" | "XLSX";

export type ExtractionResult = {
  rawText: string;
  blocks: QuestionBlock[];
  needsManualReview: boolean;
  warning?: string;
};

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const rawText = result.text ?? "";
    const avgCharsPerPage = result.total > 0 ? rawText.trim().length / result.total : rawText.trim().length;

    if (avgCharsPerPage < 20) {
      return {
        rawText,
        blocks: [],
        needsManualReview: true,
        warning:
          "In dieser PDF-Datei wurde kaum Text gefunden (vermutlich gescannte Seiten ohne Textebene). " +
          "Bitte manuell prüfen und die Fragen von Hand anlegen, oder die Datei vorab mit OCR versehen (Stage 2/3).",
      };
    }

    return { rawText, blocks: splitTextIntoBlocks(rawText), needsManualReview: false };
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value ?? "";
  return { rawText, blocks: splitTextIntoBlocks(rawText), needsManualReview: false };
}

function extractTxt(buffer: Buffer): ExtractionResult {
  const rawText = buffer.toString("utf-8");
  return { rawText, blocks: splitTextIntoBlocks(rawText), needsManualReview: false };
}

function findColumn(headers: string[], candidates: string[]): string | undefined {
  return headers.find((h) => candidates.some((c) => h.toLowerCase().includes(c)));
}

function extractXlsx(buffer: Buffer): ExtractionResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rawText: "", blocks: [], needsManualReview: true, warning: "Keine Tabellenblätter gefunden." };
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rows.length === 0) {
    return { rawText: "", blocks: [], needsManualReview: true, warning: "Die Tabelle enthält keine Zeilen." };
  }

  const headers = Object.keys(rows[0]);
  const questionCol = findColumn(headers, ["frage", "question"]) ?? headers[0];
  const answerCol = findColumn(headers, ["antwort", "answer"]);

  const blocks: QuestionBlock[] = [];
  const rawLines: string[] = [];

  rows.forEach((row, index) => {
    const originalText = String(row[questionCol] ?? "").trim();
    if (!originalText || originalText.length < 5) return;
    const originalAnswer = answerCol ? String(row[answerCol] ?? "").trim() || undefined : undefined;
    blocks.push({ originalText, originalAnswer, pageReference: `Zeile ${index + 2}` });
    rawLines.push(`${originalText}${originalAnswer ? `\nAntwort: ${originalAnswer}` : ""}`);
  });

  return { rawText: rawLines.join("\n\n"), blocks, needsManualReview: blocks.length === 0 };
}

export async function extractQuestionBlocks(
  fileType: ImportFileType,
  buffer: Buffer,
): Promise<ExtractionResult> {
  switch (fileType) {
    case "PDF":
      return extractPdf(buffer);
    case "DOCX":
      return extractDocx(buffer);
    case "TXT":
      return extractTxt(buffer);
    case "XLSX":
      return extractXlsx(buffer);
  }
}
