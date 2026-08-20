import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Trash2, 
  CheckCircle,
  Eye,
  Settings2,
  FileCheck,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseExcelWorkbook, convertExcelDomToPdf } from '../services/excelService';
import LoadingOverlay from './LoadingOverlay';
import PdfViewerModal from './PdfViewerModal';

export default function ExcelToPdf({ lang = 'es', t }) {
  const [excelFile, setExcelFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [customMaxRow, setCustomMaxRow] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Preparando renderizado...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [generatedBlob, setGeneratedBlob] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Conversion Options
  const [orientation, setOrientation] = useState('portrait');
  const [fitMode, setFitMode] = useState('single_page'); // 'single_page' | 'fit_width' | 'actual_size'
  const [showGridlines, setShowGridlines] = useState(true);

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setIsParsing(true);
    setExcelFile(file);
    setDownloadUrl(null);
    setGeneratedBlob(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parsed = await parseExcelWorkbook(arrayBuffer);
      setWorkbookData(parsed);
      setActiveSheetIdx(0);
      
      if (parsed.sheets[0]) {
        setCustomMaxRow(parsed.sheets[0].autoMaxRow || parsed.sheets[0].rowCount);
      }
    } catch (err) {
      console.error('Error reading Excel file:', err);
      alert('Ocurrió un error al leer el archivo de Excel. Asegúrate de que sea un archivo .xlsx válido.');
      setExcelFile(null);
      setWorkbookData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const currentSheet = workbookData?.sheets[activeSheetIdx];

  useEffect(() => {
    if (currentSheet) {
      setCustomMaxRow(currentSheet.autoMaxRow || currentSheet.rowCount);
    }
  }, [activeSheetIdx, workbookData]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleConvertToPdf = async () => {
    if (!previewRef.current || !workbookData) return;
    setIsConverting(true);
    setIsDone(false);
    setProgress(20);
    setStatusText('Capturando cuadrícula en Ultra HD 384 DPI...');

    try {
      await new Promise(r => setTimeout(r, 500));

      setProgress(50);
      setStatusText(fitMode === 'single_page' ? 'Ajustando escala a 1 sola página HD...' : 'Generando vectorización...');

      const activeSheet = workbookData.sheets[activeSheetIdx];
      const pdfBlob = await convertExcelDomToPdf(previewRef.current, {
        orientation,
        fitMode,
        showGridlines,
        sheetName: activeSheet?.name || 'Excel'
      });

      setProgress(90);
      setStatusText('Compilando documento Ultra HD final...');
      await new Promise(r => setTimeout(r, 400));

      setProgress(100);
      setIsDone(true);
      setGeneratedBlob(pdfBlob);

      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        const baseName = excelFile.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_Convertido_HD.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setIsConverting(false);
      }, 1000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al convertir la hoja de Excel a PDF: ' + err.message);
      setIsConverting(false);
    }
  };

  const maxRowsToRender = customMaxRow || currentSheet?.rowCount || 1;
  const displayMatrix = currentSheet?.matrix?.slice(0, maxRowsToRender) || [];
  const maxRenderTopPx = (currentSheet?.rowHeights || []).slice(0, maxRowsToRender).reduce((a, b) => a + b, 0);
  const displayImages = (currentSheet?.images || []).filter(img => img.topPx < maxRenderTopPx);

  return (
    <div>
      <LoadingOverlay 
        isOpen={isConverting}
        title={t('tools.excel.title')}
        subtitle={fitMode === 'single_page' ? `Empaquetando filas 1-${maxRowsToRender} en 1 sola página HD.` : `Procesando filas 1-${maxRowsToRender}.`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      {/* Fullscreen HD PDF Viewer Modal */}
      <PdfViewerModal 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        pdfBlobUrl={downloadUrl}
        title={`Visor HD - ${excelFile?.name}`}
        t={t}
      />

      <div className="hero-section">
        <h1 className="hero-title">{t('tools.excel.title')}</h1>
        <p className="hero-subtitle">{t('tools.excel.sub')}</p>
      </div>

      {!excelFile ? (
        <div 
          className={`dropzone-container ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
          <div className="dropzone-icon dropzone-excel-icon">
            <FileSpreadsheet size={36} />
          </div>
          <h3 className="dropzone-title">{t('dropzone.dragExcel')}</h3>
          <p className="dropzone-subtitle">Soporta archivos .xlsx con tablas, colores, formatos e imágenes</p>
          <button className="btn-primary btn-excel" type="button">
            <Upload size={18} />
            <span>{t('dropzone.browseExcel')}</span>
          </button>
        </div>
      ) : isParsing ? (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="dropzone-icon dropzone-excel-icon" style={{ margin: '0 auto 1.5rem auto' }}>
            <FileSpreadsheet size={36} />
          </div>
          <h3>Procesando libro de Excel...</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Leyendo la estructura, celdas, estilos e imágenes incrustadas.
          </p>
        </div>
      ) : (
        <div>
          {/* Options Header Bar */}
          <div className="options-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <Settings2 size={18} />
              <span>{t('options.title')}</span>
            </div>

            {/* Row Range Selector */}
            {currentSheet && (
              <div className="option-group">
                <label>{t('options.rowsToInclude')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>{t('options.rowsRange')}</span>
                  <input 
                    type="number" 
                    min="1" 
                    max={currentSheet.rowCount}
                    className="option-select"
                    style={{ width: '65px', textAlign: 'center', fontWeight: 700 }}
                    value={maxRowsToRender}
                    onChange={(e) => setCustomMaxRow(Math.max(1, Math.min(currentSheet.rowCount, Number(e.target.value))))}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={() => setCustomMaxRow(currentSheet.autoMaxRow)}
                    title="Auto-detectar última fila con datos"
                  >
                    {t('options.btnAuto').replace('{num}', currentSheet.autoMaxRow)}
                  </button>
                </div>
              </div>
            )}

            <div className="option-group">
              <label>{t('options.fitModeLabel')}</label>
              <select 
                className="option-select"
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value)}
              >
                <option value="single_page">{t('options.fitSinglePage')}</option>
                <option value="fit_width">{t('options.fitWidth')}</option>
                <option value="actual_size">{t('options.actualSize')}</option>
              </select>
            </div>

            <div className="option-group">
              <label>{t('options.orientationLabel')}</label>
              <select 
                className="option-select"
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
              >
                <option value="portrait">{t('options.portrait')}</option>
                <option value="landscape">{t('options.landscape')}</option>
              </select>
            </div>

            <div className="option-group">
              <label>{t('options.gridlinesLabel')}</label>
              <select 
                className="option-select"
                value={showGridlines ? 'show' : 'hide'}
                onChange={(e) => setShowGridlines(e.target.value === 'show')}
              >
                <option value="show">{t('options.showGrid')}</option>
                <option value="hide">{t('options.hideGrid')}</option>
              </select>
            </div>
          </div>

          {/* Sheet Selector Tabs */}
          {workbookData && workbookData.sheets.length > 1 && (
            <div className="sheet-tabs">
              {workbookData.sheets.map((sheet, idx) => (
                <button 
                  key={idx} 
                  className={`sheet-tab-btn ${idx === activeSheetIdx ? 'active' : ''}`}
                  onClick={() => setActiveSheetIdx(idx)}
                >
                  <FileSpreadsheet size={16} />
                  <span style={{ marginLeft: '0.4rem' }}>{sheet.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Live Interactive Preview Box */}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={18} />
              <span>{t('options.previewTitle')} ({currentSheet?.name}): Filas 1 a {maxRowsToRender}</span>
            </span>

            <span className="file-card-badge">
              {displayImages.length} imágenes incrustadas detectadas
            </span>
          </div>

          <div className="excel-preview-wrapper">
            <div 
              ref={previewRef} 
              className="excel-render-container"
              style={{
                maxWidth: orientation === 'landscape' ? '1000px' : '800px',
              }}
            >
              {currentSheet && (
                <div style={{ position: 'relative' }}>
                  {/* Embedded Images Overlay */}
                  {displayImages.map((img, i) => (
                    <img 
                      key={i} 
                      src={img.src} 
                      alt={`Imagen Excel ${i + 1}`}
                      style={{
                        position: 'absolute',
                        top: `${img.topPx}px`,
                        left: `${img.leftPx}px`,
                        width: `${img.widthPx}px`,
                        height: `${img.heightPx}px`,
                        objectFit: 'contain',
                        zIndex: 10,
                        pointerEvents: 'none'
                      }}
                    />
                  ))}

                  {/* Render Table Grid */}
                  <table className={`excel-table-render ${showGridlines ? 'show-gridlines' : ''}`}>
                    <colgroup>
                      {currentSheet.colWidths.map((w, cIdx) => (
                        <col key={cIdx} style={{ width: `${w}px` }} />
                      ))}
                    </colgroup>
                    <tbody>
                      {displayMatrix.map((row, rIdx) => (
                        <tr key={rIdx} style={{ height: `${currentSheet.rowHeights[rIdx] || 20}px` }}>
                          {row.map((cell, cIdx) => {
                            if (cell.hidden) return null;
                            return (
                              <td 
                                key={cIdx}
                                rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
                                colSpan={cell.colspan > 1 ? cell.colspan : undefined}
                                style={cell.style}
                              >
                                {cell.value !== '' && cell.value !== null && cell.value !== undefined ? cell.value : '\u00A0'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setExcelFile(null); setWorkbookData(null); setDownloadUrl(null); }}>
              <Trash2 size={18} />
              <span>{t('actions.changeFile')}</span>
            </button>

            {downloadUrl && (
              <button className="btn-secondary" onClick={() => setIsViewerOpen(true)}>
                <Maximize2 size={18} />
                <span>{t('options.fullscreenViewer')}</span>
              </button>
            )}

            {downloadUrl ? (
              <a href={downloadUrl} download={`${excelFile.name.replace(/\.[^/.]+$/, '')}_Convertido_HD.pdf`} className="btn-primary btn-excel">
                <CheckCircle size={20} />
                <span>{t('actions.readyDownload')}</span>
              </a>
            ) : (
              <button 
                className="btn-primary btn-excel" 
                onClick={handleConvertToPdf}
                disabled={isConverting}
              >
                <FileCheck size={20} />
                <span>{t('tools.excel.btn')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
