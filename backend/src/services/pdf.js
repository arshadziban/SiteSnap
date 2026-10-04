// PDF generation from a rendered page.
import fs from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const PDF_OPTIONS = {
  printBackground: true,
  format: "A4",
  margin: { top: "0.4in", bottom: "0.4in", left: "0.4in", right: "0.4in" },
};

export async function generatePdf(page, outputPath) {
  await page.pdf({
    path: outputPath,
    printBackground: PDF_OPTIONS.printBackground,
    format: PDF_OPTIONS.format,
    margin: PDF_OPTIONS.margin,
  });
}

/**
 * Build a single-page PDF whose page exactly matches the given image.
 *
 * Used for per-part PDFs so each part's PDF visually matches its PNG.
 */
export async function pdfFromImage(imagePath, outputPath) {
  const imageBytes = await fs.readFile(imagePath);
  const { width, height } = await sharp(imageBytes).metadata();

  const doc = await PDFDocument.create();
  const pngImage = await doc.embedPng(imageBytes);
  const pdfPage = doc.addPage([width, height]);
  pdfPage.drawImage(pngImage, { x: 0, y: 0, width, height });

  const pdfBytes = await doc.save();
  await fs.writeFile(outputPath, pdfBytes);
}
