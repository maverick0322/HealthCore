interface ExportNutritionistReportPdfOptions {
  element: HTMLElement;
  fileName: string;
}

export const exportNutritionistReportPdf = async ({
  element,
  fileName,
}: ExportNutritionistReportPdfOptions) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  });

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const renderWidth = pageWidth - margin * 2;
  const renderHeight = (canvas.height * renderWidth) / canvas.width;
  const printablePageHeight = pageHeight - margin * 2;

  let remainingHeight = renderHeight;
  let offsetY = margin;

  pdf.addImage(imageData, 'PNG', margin, offsetY, renderWidth, renderHeight, undefined, 'FAST');
  remainingHeight -= printablePageHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    offsetY = margin - (renderHeight - remainingHeight);
    pdf.addImage(imageData, 'PNG', margin, offsetY, renderWidth, renderHeight, undefined, 'FAST');
    remainingHeight -= printablePageHeight;
  }

  pdf.save(fileName);
};
