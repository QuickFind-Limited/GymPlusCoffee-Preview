import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Logger } from '@/services/Logger';

export const generatePDFFromElement = async (
  elementId: string,
  filename: string = 'purchase-order.pdf',
  returnBase64: boolean = false
): Promise<string | void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    Logger.error('Element not found for PDF generation');
    return;
  }

  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF or return base64
    if (returnBase64) {
      // Return base64 without data URI prefix
      const base64String = pdf.output('dataurlstring').split(',')[1];
      return base64String;
    } else {
      pdf.save(filename);
    }
  } catch (error) {
    Logger.error('Error generating PDF:', error);
    throw error;
  }
};

export const printElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    Logger.error('Element not found for printing');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    Logger.error('Could not open print window');
    return;
  }

  // Copy styles and content
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('');
      } catch (e) {
        Logger.debug('Cannot access stylesheet');
        return '';
      }
    })
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};