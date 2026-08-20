import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Converts an ARGB / RGB Excel color object to CSS Hex string.
 * Handles: ARGB strings, theme indices with tint, and raw hex strings.
 */
function parseExcelColor(colorObj, defaultColor = null) {
  if (!colorObj) return defaultColor;

  if (typeof colorObj === 'string') {
    if (colorObj.startsWith('#')) return colorObj;
    if (colorObj.length === 8) return `#${colorObj.slice(2)}`;
    if (colorObj.length === 6) return `#${colorObj}`;
  }

  if (colorObj.argb) {
    const argb = String(colorObj.argb);
    if (argb.length === 8) return `#${argb.slice(2)}`;
    if (argb.length === 6) return `#${argb}`;
    return `#${argb}`;
  }

  if (colorObj.theme !== undefined) {
    const themeMap = {
      0: '#FFFFFF',   // lt1 (Background 1)
      1: '#000000',   // dk1 (Text 1)
      2: '#E7E6E6',   // lt2 (Background 2)
      3: '#44546A',   // dk2 (Text 2)
      4: '#4472C4',   // accent1
      5: '#ED7D31',   // accent2
      6: '#A5A5A5',   // accent3
      7: '#FFC000',   // accent4
      8: '#5B9BD5',   // accent5
      9: '#70AD47'    // accent6
    };
    let hex = themeMap[colorObj.theme] || defaultColor;

    if (hex && colorObj.tint !== undefined && colorObj.tint !== 0) {
      hex = applyTint(hex, colorObj.tint);
    }
    return hex;
  }

  return defaultColor;
}

/**
 * Applies a tint value to a hex color.
 */
function applyTint(hex, tint) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  let nr, ng, nb;
  if (tint > 0) {
    nr = Math.round(r + (255 - r) * tint);
    ng = Math.round(g + (255 - g) * tint);
    nb = Math.round(b + (255 - b) * tint);
  } else {
    const absTint = Math.abs(tint);
    nr = Math.round(r * (1 - absTint));
    ng = Math.round(g * (1 - absTint));
    nb = Math.round(b * (1 - absTint));
  }

  const clamp = (v) => Math.max(0, Math.min(255, v));
  return `#${clamp(nr).toString(16).padStart(2, '0')}${clamp(ng).toString(16).padStart(2, '0')}${clamp(nb).toString(16).padStart(2, '0')}`;
}

/**
 * Maps ExcelJS border styles to CSS border styles
 */
function parseBorderStyle(borderObj) {
  if (!borderObj || !borderObj.style) return null;
  const color = parseExcelColor(borderObj.color, '#000000');

  let width = '1px';
  let style = 'solid';

  switch (borderObj.style) {
    case 'medium':
      width = '2px';
      break;
    case 'thick':
      width = '3px';
      break;
    case 'double':
      style = 'double';
      width = '3px';
      break;
    case 'dashed':
    case 'mediumDashed':
      style = 'dashed';
      break;
    case 'dotted':
      style = 'dotted';
      break;
    case 'slantDashDot':
    case 'dashDot':
    case 'dashDotDot':
    case 'mediumDashDot':
    case 'mediumDashDotDot':
      style = 'dashed';
      break;
    case 'hair':
      width = '0.5px';
      break;
    case 'thin':
    default:
      width = '1px';
      break;
  }

  return `${width} ${style} ${color}`;
}

/**
 * Safely extracts a display-ready string from an ExcelJS cell value
 */
function getCellDisplayValue(cell) {
  if (cell.text !== undefined && cell.text !== null && cell.text !== '') {
    return String(cell.text);
  }

  const val = cell.value;
  if (val === null || val === undefined) return '';

  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'VERDADERO' : 'FALSO';

  if (val instanceof Date) {
    return val.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (typeof val === 'object') {
    if (val.error) return String(val.error);
    if (val.result !== undefined && val.result !== null) {
      if (val.result instanceof Date) {
        return val.result.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
      return String(val.result);
    }
    if (val.richText && Array.isArray(val.richText)) {
      return val.richText.map(t => t.text || '').join('');
    }
    if (val.text) return String(val.text);
    if (val.hyperlink) return val.text || val.hyperlink || '';
  }

  return String(val);
}

/**
 * Reads an Excel workbook and extracts sheets data, styles, merges, auto-detected data bounds, and embedded images.
 */
export async function parseExcelWorkbook(arrayBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheets = [];

  for (let sIdx = 0; sIdx < workbook.worksheets.length; sIdx++) {
    const sheet = workbook.worksheets[sIdx];
    if (sheet.state === 'hidden') continue;

    // Dimension scanner
    let rowCount = Math.max(sheet.rowCount || 1, sheet.actualRowCount || 1);
    let colCount = Math.max(sheet.columnCount || 1, sheet.actualColumnCount || 1);

    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      rowCount = Math.max(rowCount, rowNumber);
      if (row.cellCount) {
        colCount = Math.max(colCount, row.cellCount);
      }
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        colCount = Math.max(colCount, colNumber);
      });
    });

    if (sheet._merges) {
      Object.keys(sheet._merges).forEach(key => {
        const range = sheet._merges[key];
        rowCount = Math.max(rowCount, range.bottom);
        colCount = Math.max(colCount, range.right);
      });
    }

    const sheetImages = sheet.getImages ? sheet.getImages() : [];
    sheetImages.forEach(img => {
      if (img.range) {
        const tl = img.range.tl;
        const br = img.range.br;
        if (tl) {
          const r = Math.ceil((tl.nativeRow !== undefined ? tl.nativeRow : (tl.row || 0)) + 1);
          const c = Math.ceil((tl.nativeCol !== undefined ? tl.nativeCol : (tl.col || 0)) + 1);
          rowCount = Math.max(rowCount, r);
          colCount = Math.max(colCount, c);
        }
        if (br) {
          const r = Math.ceil((br.nativeRow !== undefined ? br.nativeRow : (br.row || 0)) + 1);
          const c = Math.ceil((br.nativeCol !== undefined ? br.nativeCol : (br.col || 0)) + 1);
          rowCount = Math.max(rowCount, r);
          colCount = Math.max(colCount, c);
        }
      }
    });

    // Auto-detect last row with actual text data or images (ignores trailing empty formatted cells)
    let autoMaxRow = 1;
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      let hasText = false;
      row.eachCell({ includeEmpty: false }, (cell) => {
        const txt = getCellDisplayValue(cell);
        if (txt && txt.trim() !== '') hasText = true;
      });
      if (hasText) autoMaxRow = Math.max(autoMaxRow, rowNumber);
    });

    sheetImages.forEach(img => {
      if (img.range) {
        const tl = img.range.tl;
        const br = img.range.br;
        if (tl) {
          const r = Math.ceil((tl.nativeRow !== undefined ? tl.nativeRow : (tl.row || 0)) + 1);
          autoMaxRow = Math.max(autoMaxRow, r);
        }
        if (br) {
          const r = Math.ceil((br.nativeRow !== undefined ? br.nativeRow : (br.row || 0)) + 1);
          autoMaxRow = Math.max(autoMaxRow, r);
        }
      }
    });

    // Column widths & Row heights
    const colWidths = [];
    for (let c = 1; c <= colCount; c++) {
      const col = sheet.getColumn(c);
      const widthInChars = col.width || 9.5;
      colWidths.push(Math.max(Math.round(widthInChars * 7 + 6), 35));
    }

    const rowHeights = [];
    for (let r = 1; r <= rowCount; r++) {
      const row = sheet.getRow(r);
      const heightInPoints = row.height || 16;
      rowHeights.push(Math.max(Math.round(heightInPoints * 1.333), 20));
    }

    // Merges Map
    const mergedMap = {};
    if (sheet._merges) {
      Object.keys(sheet._merges).forEach(key => {
        const range = sheet._merges[key];
        const top = range.top;
        const left = range.left;
        const bottom = range.bottom;
        const right = range.right;

        const rowspan = bottom - top + 1;
        const colspan = right - left + 1;

        for (let r = top; r <= bottom; r++) {
          for (let c = left; c <= right; c++) {
            const cellKey = `${r},${c}`;
            if (r === top && c === left) {
              mergedMap[cellKey] = { isMaster: true, rowspan, colspan, hidden: false };
            } else {
              mergedMap[cellKey] = { isMaster: false, rowspan: 1, colspan: 1, hidden: true };
            }
          }
        }
      });
    }

    // Images
    const images = [];

    sheetImages.forEach((img) => {
      try {
        const imgData = workbook.getImage(img.imageId);
        if (!imgData) return;

        let base64 = imgData.base64;
        if (!base64 && imgData.buffer) {
          const uint8 = new Uint8Array(imgData.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          base64 = btoa(binary);
        }

        if (base64) {
          const ext = imgData.extension || 'png';
          const mimeType = ext === 'jpeg' || ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
          const src = `data:${mimeType};base64,${base64}`;

          const tl = img.range?.tl || { col: 0, row: 0 };
          const br = img.range?.br;

          const tlCol = tl.nativeCol !== undefined ? tl.nativeCol : (tl.col || 0);
          const tlRow = tl.nativeRow !== undefined ? tl.nativeRow : (tl.row || 0);

          const tlColFloor = Math.floor(tlCol);
          const tlRowFloor = Math.floor(tlRow);

          let topPx = 0;
          for (let r = 0; r < tlRowFloor; r++) {
            topPx += rowHeights[r] || 20;
          }
          const tlRowFrac = tlRow - tlRowFloor;
          if (tlRowFrac > 0) {
            topPx += Math.round(tlRowFrac * (rowHeights[tlRowFloor] || 20));
          }
          if (tl.nativeRowOff) topPx += Math.round(tl.nativeRowOff / 9525);
          else if (tl.rowOff) topPx += Math.round(tl.rowOff / (tl.rowOff > 1000 ? 9525 : 1));

          let leftPx = 0;
          for (let c = 0; c < tlColFloor; c++) {
            leftPx += colWidths[c] || 35;
          }
          const tlColFrac = tlCol - tlColFloor;
          if (tlColFrac > 0) {
            leftPx += Math.round(tlColFrac * (colWidths[tlColFloor] || 35));
          }
          if (tl.nativeColOff) leftPx += Math.round(tl.nativeColOff / 9525);
          else if (tl.colOff) leftPx += Math.round(tl.colOff / (tl.colOff > 1000 ? 9525 : 1));

          let widthPx = 150;
          let heightPx = 100;

          if (br) {
            const brCol = br.nativeCol !== undefined ? br.nativeCol : (br.col || 0);
            const brRow = br.nativeRow !== undefined ? br.nativeRow : (br.row || 0);

            const brColFloor = Math.floor(brCol);
            const brRowFloor = Math.floor(brRow);

            let brTop = 0;
            for (let r = 0; r < brRowFloor; r++) {
              brTop += rowHeights[r] || 20;
            }
            const brRowFrac = brRow - brRowFloor;
            if (brRowFrac > 0) {
              brTop += Math.round(brRowFrac * (rowHeights[brRowFloor] || 20));
            }
            if (br.nativeRowOff) brTop += Math.round(br.nativeRowOff / 9525);
            else if (br.rowOff) brTop += Math.round(br.rowOff / (br.rowOff > 1000 ? 9525 : 1));

            let brLeft = 0;
            for (let c = 0; c < brColFloor; c++) {
              brLeft += colWidths[c] || 35;
            }
            const brColFrac = brCol - brColFloor;
            if (brColFrac > 0) {
              brLeft += Math.round(brColFrac * (colWidths[brColFloor] || 35));
            }
            if (br.nativeColOff) brLeft += Math.round(br.nativeColOff / 9525);
            else if (br.colOff) brLeft += Math.round(br.colOff / (br.colOff > 1000 ? 9525 : 1));

            widthPx = Math.max(brLeft - leftPx, 20);
            heightPx = Math.max(brTop - topPx, 15);
          } else if (img.range?.ext) {
            const w = img.range.ext.width;
            const h = img.range.ext.height;
            widthPx = w > 10000 ? Math.round(w / 9525) : (w || 150);
            heightPx = h > 10000 ? Math.round(h / 9525) : (h || 100);
          }

          images.push({ src, topPx, leftPx, widthPx, heightPx });
        }
      } catch (err) {
        console.warn('Could not process embedded image in sheet:', err);
      }
    });

    // Matrix
    const matrix = [];
    for (let r = 1; r <= rowCount; r++) {
      const rowCells = [];
      const row = sheet.getRow(r);

      for (let c = 1; c <= colCount; c++) {
        const cell = row.getCell(c);
        const cellKey = `${r},${c}`;
        const mergeInfo = mergedMap[cellKey] || { isMaster: true, rowspan: 1, colspan: 1, hidden: false };

        if (mergeInfo.hidden) {
          rowCells.push({ hidden: true });
          continue;
        }

        const value = getCellDisplayValue(cell);

        const font = cell.font || {};
        const fill = cell.fill || {};
        const alignment = cell.alignment || {};
        const border = cell.border || {};

        let bgColor = 'transparent';
        if (fill.type === 'pattern') {
          if (fill.pattern === 'solid') {
            bgColor = parseExcelColor(fill.fgColor, 'transparent');
          } else if (fill.fgColor) {
            bgColor = parseExcelColor(fill.fgColor, 'transparent');
          }
        } else if (fill.type === 'gradient' && fill.stops && fill.stops.length > 0) {
          bgColor = parseExcelColor(fill.stops[0].color, 'transparent');
        }

        let vertAlign = 'middle';
        if (alignment.vertical === 'top') vertAlign = 'top';
        else if (alignment.vertical === 'bottom') vertAlign = 'bottom';
        else if (alignment.vertical === 'center' || alignment.vertical === 'middle') vertAlign = 'middle';

        const style = {
          fontFamily: font.name ? `"${font.name}", Segoe UI, Arial, sans-serif` : 'Segoe UI, Arial, sans-serif',
          fontSize: `${font.size || 11}pt`,
          fontWeight: font.bold ? 'bold' : 'normal',
          fontStyle: font.italic ? 'italic' : 'normal',
          textDecoration: [
            font.underline ? 'underline' : '',
            font.strike ? 'line-through' : ''
          ].filter(Boolean).join(' ') || 'none',
          color: parseExcelColor(font.color, '#000000'),
          backgroundColor: bgColor,
          textAlign: alignment.horizontal || 'left',
          verticalAlign: vertAlign,
          whiteSpace: alignment.wrapText ? 'pre-wrap' : 'nowrap',
          overflow: 'hidden',
          borderTop: parseBorderStyle(border.top),
          borderLeft: parseBorderStyle(border.left),
          borderBottom: parseBorderStyle(border.bottom),
          borderRight: parseBorderStyle(border.right),
        };

        rowCells.push({
          value,
          style,
          rowspan: mergeInfo.rowspan,
          colspan: mergeInfo.colspan,
          hidden: false
        });
      }
      matrix.push(rowCells);
    }

    sheets.push({
      name: sheet.name || `Hoja ${sIdx + 1}`,
      rowCount,
      colCount,
      autoMaxRow, // Auto-detected last active row (e.g. 30)
      colWidths,
      rowHeights,
      matrix,
      images
    });
  }

  return { name: workbook.title || 'Libro de Excel', sheets };
}

/**
 * Converts rendered Excel DOM element to PDF using html2canvas & jsPDF.
 */
export async function convertExcelDomToPdf(containerEl, options = {}) {
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
  const marginMm = 8; // 8mm margin

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
    const xPos = marginMm + (contentWidthMm - renderWidthMm) / 2;
    const yPos = marginMm + (contentHeightMm - renderHeightMm) / 2;
    pdf.addImage(imgData, 'PNG', xPos, yPos, renderWidthMm, renderHeightMm);
  } else {
    const totalPages = Math.ceil(renderHeightMm / contentHeightMm);
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const yOffset = marginMm - (page * contentHeightMm);
      pdf.addImage(imgData, 'PNG', marginMm, yOffset, renderWidthMm, renderHeightMm);
    }
  }

  return pdf.output('blob');
}
