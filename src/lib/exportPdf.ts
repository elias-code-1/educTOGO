import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPdf(
  markdownContent: string,
  fileName: string
): Promise<void> {
  // 1. Create temporary div
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.style.top = '0';
  div.style.width = '800px'; 
  div.style.padding = '20px';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.color = '#1a1a1a';
  div.style.lineHeight = '1.6';
  div.style.fontSize = '13px';
  div.style.backgroundColor = '#ffffff';

  // 2. Convert markdown to HTML simple
  let html = markdownContent
    .replace(/^# (.*$)/gim, '<h1 style="color: #003366; font-size: 20px; margin-bottom: 12px;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #003366; font-size: 16px; margin-top: 16px;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="color: #333; font-size: 14px;">$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/\n/gim, '<br />');

  // Wrap list items in ul if found
  if (html.includes('<li')) {
    html = html.replace(/(<li.*<\/li>)/gim, '<ul>$1</ul>');
  }

  div.innerHTML = html;
  document.body.appendChild(div);

  // 4. Capture div with html2canvas
  const canvas = await html2canvas(div, { scale: 2 });
  const imgData = canvas.toDataURL('image/jpeg', 1.0);

  // 5. Create PDF A4
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add pages if needed
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // 7. Remove div and save
  document.body.removeChild(div);
  pdf.save(fileName + ".pdf");
}
