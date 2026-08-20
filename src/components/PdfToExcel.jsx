import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Trash2, 
  CheckCircle,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ExcelJS from 'exceljs';
import * as pdfjsLib from 'pdfjs-dist';
import LoadingOverlay from './LoadingOverlay';

export default function PdfToExcel({ lang = 'es', t }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Analizando estructura tabular...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;
    setFile(f);
    setDownloadUrl(null);
  };

  const handleConvertToExcel = async () => {
    if (!file) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(15);
    setStatusText('Analizando coordenadas y filas del PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      const workbook = new ExcelJS.Workbook();
      const numPages = pdf.numPages;

      for (let p = 1; p <= numPages; p++) {
        setProgress(Math.round(20 + (p / numPages) * 60));
        setStatusText(`Mapeando celdas de página ${p} de ${numPages}...`);

        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const sheet = workbook.addWorksheet(`Hoja ${p}`);

        // Group items by Y coordinate (rows)
        const rowMap = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          if (!rowMap[y]) rowMap[y] = [];
          rowMap[y].push({ x, text: item.str });
        });

        // Sort rows top-to-bottom
        const sortedY = Object.keys(rowMap).map(Number).sort((a, b) => b - a);

        sortedY.forEach((y, rIdx) => {
          const items = rowMap[y].sort((a, b) => a.x - b.x);
          const excelRow = sheet.getRow(rIdx + 1);

          items.forEach((item, cIdx) => {
            const cell = excelRow.getCell(cIdx + 1);
            cell.value = item.text;
            cell.border = {
              top: { style: 'thin', color: { argb: 'D0D7DE' } },
              left: { style: 'thin', color: { argb: 'D0D7DE' } },
              bottom: { style: 'thin', color: { argb: 'D0D7DE' } },
              right: { style: 'thin', color: { argb: 'D0D7DE' } }
            };
            cell.font = { name: 'Segoe UI', size: 10 };
          });
        });
      }

      setProgress(90);
      setStatusText('Generando libro Excel .xlsx...');
      await new Promise(r => setTimeout(r, 400));

      const xlsxBuffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_Convertido.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Error converting PDF to Excel:', err);
      alert('Error al convertir PDF a Excel: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Convertiendo PDF a Excel"
        subtitle={`Mapeando coordenadas tabulares de "${file?.name}".`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Convertir PDF a Excel</h1>
        <p className="hero-subtitle">
          Extrae datos y tablas directamente de tus documentos PDF a hojas de cálculo .xlsx editables.
        </p>
      </div>

      {!file ? (
        <div 
          className={`dropzone-container ${isDragOver ? 'drag-over' : ''}`}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".pdf,application/pdf" 
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
          <div className="dropzone-icon dropzone-excel-icon">
            <FileSpreadsheet size={36} />
          </div>
          <h3 className="dropzone-title">{t('dropzone.dragPdf')}</h3>
          <p className="dropzone-subtitle">Genera un libro .xlsx estructurado con cuadrícula y celdas</p>
          <button className="btn-primary btn-excel" type="button">
            <Upload size={18} />
            <span>{t('dropzone.browsePdf')}</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setDownloadUrl(null); }}>
              <Trash2 size={18} />
              <span>{t('actions.changeFile')}</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`${file.name.replace(/\.[^/.]+$/, '')}_Convertido.xlsx`} className="btn-primary btn-excel">
                <CheckCircle size={20} />
                <span>¡Excel Listo! Descargar de nuevo</span>
              </a>
            ) : (
              <button 
                className="btn-primary btn-excel" 
                onClick={handleConvertToExcel}
                disabled={isProcessing}
              >
                <FileCheck size={20} />
                <span>Convertir PDF a Excel .xlsx</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
