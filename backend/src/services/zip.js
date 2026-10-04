// ZIP archive creation for batch downloads.
import fs from "node:fs";
import archiver from "archiver";

/**
 * Create a ZIP archive with per-site subfolders, including split parts.
 *
 * folderFiles: {sanitizedDomain: {png: path, pdf: path}}  (full-page files)
 * folderParts: {sanitizedDomain: [{index, pngPath, pdfPath}, ...]}
 */
export async function createExportZipWithParts(zipPath, folderFiles, folderParts) {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);

    for (const [folderName, files] of Object.entries(folderFiles)) {
      for (const [kind, filePath] of Object.entries(files)) {
        if (filePath && fs.existsSync(filePath)) {
          const ext = kind === "png" ? "png" : "pdf";
          archive.file(filePath, { name: `sitesnap-export/${folderName}/screenshot.${ext}` });
        }
      }
    }

    for (const [folderName, parts] of Object.entries(folderParts)) {
      for (const { index, pngPath, pdfPath } of parts) {
        if (fs.existsSync(pngPath)) {
          archive.file(pngPath, { name: `sitesnap-export/${folderName}/parts/part-${index}.png` });
        }
        if (fs.existsSync(pdfPath)) {
          archive.file(pdfPath, { name: `sitesnap-export/${folderName}/parts/part-${index}.pdf` });
        }
      }
    }

    archive.finalize();
  });
}
