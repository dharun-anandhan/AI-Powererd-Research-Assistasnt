import React, { useEffect, useState, useRef } from 'react';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@13.0.0/lib/marked.esm.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Icon } from './Icon';


interface DetailedReportProps {
  report: string;
}

export const DetailedReport: React.FC<DetailedReportProps> = ({ report }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report) {
      const parsedHtml = marked.parse(report);
      setHtmlContent(parsedHtml as string);
    }
  }, [report]);

  const handleDownloadPdf = async () => {
    const content = reportContentRef.current;
    if (!content) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(content, { 
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save('detailed-report.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Detailed Comparative Report</h2>
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-wait"
        >
          <Icon name="download" className="h-5 w-5" />
          <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
        </button>
      </div>
      <div
        ref={reportContentRef}
        className="prose prose-slate dark:prose-invert max-w-none p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};