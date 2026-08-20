import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker — use a reliable fallback version if pdfjsLib.version is unavailable
const PDFJS_VERSION = pdfjsLib.version || '3.11.174';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

/**
 * Gets page count and metadata for a PDF file.
 */
export async function getPdfInfo(file) {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    return { pageCount, arrayBuffer };
  } catch (err) {
    console.error('Error reading PDF metadata:', err);
    throw new Error('El archivo PDF especificado no se pudo leer o está dañado.');
  }
}

/**
 * Generates a Data URL thumbnail of a specific page in a PDF file.
 */
export async function renderPdfPageThumbnail(arrayBuffer, pageNum = 1, scale = 0.5) {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    if (pageNum > pdf.numPages || pageNum < 1) return null;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');

    page.cleanup();
    pdf.destroy();

    return dataUrl;
  } catch (err) {
    console.warn('Error rendering PDF thumbnail for page', pageNum, ':', err);
    return null;
  }
}

/**
 * Merges multiple PDF files into a single PDF document.
 */
export async function mergePdfFiles(items, onProgress) {
  const mergedPdf = await PDFDocument.create();
  const totalItems = items.length;

  for (let i = 0; i < totalItems; i++) {
    const item = items[i];

    try {
      const srcDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
      const totalPages = srcDoc.getPageCount();

      const pageIndices = item.pageRange && item.pageRange.length > 0
        ? item.pageRange.map(p => p - 1).filter(idx => idx >= 0 && idx < totalPages)
        : srcDoc.getPageIndices();

      if (pageIndices.length === 0) continue;

      const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);

      copiedPages.forEach((page) => {
        if (item.rotation && item.rotation !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + item.rotation) % 360));
        }
        mergedPdf.addPage(page);
      });
    } catch (err) {
      console.error(`Error merging file ${item.file?.name}:`, err);
      throw new Error(`Error al procesar el archivo "${item.file?.name || `#${i + 1}`}".`);
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalItems) * 100));
    }
  }

  if (mergedPdf.getPageCount() === 0) {
    throw new Error('No se pudo generar el PDF resultante: no hay páginas para unir.');
  }

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
}

/**
 * Splits a PDF file — extracts selected page numbers into a new PDF.
 */
export async function splitPdfFile(arrayBuffer, selectedPageNumbers) {
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const newPdf = await PDFDocument.create();

  const validIndices = selectedPageNumbers
    .map(n => n - 1)
    .filter(idx => idx >= 0 && idx < totalPages);

  if (validIndices.length === 0) {
    throw new Error('No se seleccionaron páginas válidas para extraer.');
  }

  const copiedPages = await newPdf.copyPages(srcDoc, validIndices);
  copiedPages.forEach(page => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Converts multiple image files (PNG, JPG, WebP) into a PDF document.
 * Supports fitMode:
 * - 'single_page': Fits ALL images onto 1 single PDF page!
 * - 'page_per_image': Each image on its own PDF page (Default).
 */
export async function imagesToPdf(imageFiles, margin = 10, orientation = 'portrait', fitMode = 'page_per_image') {
  const pdfDoc = await PDFDocument.create();
  const marginPt = margin * 2.835; // 1mm ≈ 2.835pt

  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;

  const embeddedImages = [];

  for (const file of imageFiles) {
    let image;
    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      const imageBytes = await file.arrayBuffer();
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      const imageBytes = await file.arrayBuffer();
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = new Image();
      img.src = dataUrl;
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const pngBuffer = await pngBlob.arrayBuffer();
      image = await pdfDoc.embedPng(pngBuffer);
    }
    embeddedImages.push(image);
  }

  if (fitMode === 'single_page') {
    // FIT ALL IMAGES ONTO 1 SINGLE PAGE!
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const availableW = pageWidth - (marginPt * 2);
    const availableH = pageHeight - (marginPt * 2);

    const count = embeddedImages.length;
    // Calculate grid dimensions e.g. 2x2, 3x2, etc.
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const cellW = availableW / cols;
    const cellH = availableH / rows;

    embeddedImages.forEach((img, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);

      const { width: imgW, height: imgH } = img;
      const scale = Math.min((cellW - 8) / imgW, (cellH - 8) / imgH, 1);
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      const cellX = marginPt + (c * cellW);
      // PDF y-axis is bottom-up!
      const cellY = pageHeight - marginPt - ((r + 1) * cellH);

      const x = cellX + (cellW - drawW) / 2;
      const y = cellY + (cellH - drawH) / 2;

      page.drawImage(img, { x, y, width: drawW, height: drawH });
    });
  } else {
    // ONE PAGE PER IMAGE
    for (const image of embeddedImages) {
      const { width: imgW, height: imgH } = image;
      const availableW = pageWidth - (marginPt * 2);
      const availableH = pageHeight - (marginPt * 2);

      const scale = Math.min(availableW / imgW, availableH / imgH, 1);
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      const x = (pageWidth - drawW) / 2;
      const y = (pageHeight - drawH) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(image, { x, y, width: drawW, height: drawH });
    }
  }

  if (pdfDoc.getPageCount() === 0) {
    throw new Error('No se pudo generar el PDF: no hay imágenes válidas.');
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
