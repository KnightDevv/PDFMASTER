import mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Parses a Word .docx file ArrayBuffer into HTML with inline base64 images
 */
export async function parseWordDocument(arrayBuffer) {
  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1.doc-title:fresh",
          "p[style-name='Heading 1'] => h2.doc-h1:fresh",
          "p[style-name='Heading 2'] => h3.doc-h2:fresh"
        ]
      }
    );

    return {
      html: result.value || '<p>Documento sin contenido.</p>',
      messages: result.messages
    };
  } catch (err) {
    console.error('Error parsing Word document:', err);
    throw new Error('No se pudo leer el archivo .docx. Asegúrate de que sea un archivo Word válido.');
  }
}

/**
 * Converts rendered Word DOM element to PDF using html2canvas & jsPDF.
 * Supports fitMode:
 * - 'single_page': Scales both width and height to fit 100% on 1 single PDF page.
 * - 'fit_width': Scales width to page width, allows multi-page vertical flow.
 * - 'actual_size': Real size multi-page rendering.
 */
export async function convertWordDomToPdf(containerEl, options = {}) {
  const {
    orientation = 'portrait',
    fitMode = 'single_page', // 'single_page' | 'fit_width' | 'actual_size'
  } = options;

  // Render scale 4 = 384 DPI Ultra HD razor-sharp quality!
  const renderScale = 4;
  const canvas = await html2canvas(containerEl, {
    scale: renderScale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    letterRendering: true,
    windowWidth: containerEl.scrollWidth,
    windowHeight: containerEl.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  const isLandscape = orientation === 'landscape';

  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;
  const marginMm = 10; // 10mm margin

  const contentWidthMm = pageWidthMm - (marginMm * 2);
  const contentHeightMm = pageHeightMm - (marginMm * 2);

  const srcWidthPx = canvas.width / renderScale;
  const srcHeightPx = canvas.height / renderScale;

  const pxToMm = 25.4 / 96;
  const srcWidthMm = srcWidthPx * pxToMm;
  const srcHeightMm = srcHeightPx * pxToMm;

  let renderWidthMm = srcWidthMm;
  let renderHeightMm = srcHeightMm;

  if (fitMode === 'single_page') {
    // Proportional scaling to fit BOTH width and height on 1 single page!
    const scaleX = contentWidthMm / srcWidthMm;
    const scaleY = contentHeightMm / srcHeightMm;
    const fitScale = Math.min(scaleX, scaleY);

    renderWidthMm = srcWidthMm * fitScale;
    renderHeightMm = srcHeightMm * fitScale;
  } else if (fitMode === 'fit_width') {
    const scaleFactor = contentWidthMm / srcWidthMm;
    renderWidthMm = contentWidthMm;
    renderHeightMm = srcHeightMm * scaleFactor;
  }

  const pdf = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'mm',
    format: 'a4'
  });

  if (fitMode === 'single_page') {
    // EXACTLY 1 PAGE! Center content horizontally and vertically
    const xPos = marginMm + (contentWidthMm - renderWidthMm) / 2;
    const yPos = marginMm + (contentHeightMm - renderHeightMm) / 2;
    pdf.addImage(imgData, 'PNG', xPos, yPos, renderWidthMm, renderHeightMm);
  } else {
    // Multi-page slicing if content height exceeds page height
    const totalPages = Math.ceil(renderHeightMm / contentHeightMm);
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      const yOffset = marginMm - (page * contentHeightMm);
      pdf.addImage(imgData, 'PNG', marginMm, yOffset, renderWidthMm, renderHeightMm);
    }
  }

  return pdf.output('blob');
}
