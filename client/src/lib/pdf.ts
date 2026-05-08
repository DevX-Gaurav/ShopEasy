import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function downloadElementAsPdf(el: HTMLElement, filename: string) {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / canvas.height;
  let imgWidth = pageWidth - 32;
  let imgHeight = imgWidth / ratio;
  if (imgHeight > pageHeight - 32) {
    imgHeight = pageHeight - 32;
    imgWidth = imgHeight * ratio;
  }
  const x = (pageWidth - imgWidth) / 2;
  const y = 16;
  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST");
  pdf.save(filename);
}