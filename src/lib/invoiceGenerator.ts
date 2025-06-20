
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InvoiceData } from './types';
import { format, addDays, parse } from 'date-fns';

// Font constants
const FONT_PRIMARY = 'Arial';

export function generateInvoicePdf(invoiceData: InvoiceData) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // --- Document Settings ---
  const FONT_SIZE_TITLE = 28;
  const FONT_SIZE_HEADER_LABEL = 8;
  const FONT_SIZE_HEADER_VALUE = 10;
  const FONT_SIZE_SECTION_LABEL = 8;
  const FONT_SIZE_SECTION_TEXT = 10;
  const FONT_SIZE_TABLE_HEADER = 9;
  const FONT_SIZE_TABLE_BODY = 9;
  const FONT_SIZE_TOTALS_LABEL = 9;
  const FONT_SIZE_TOTALS_VALUE = 10;
  const FONT_SIZE_FOOTER_TEXT = 10;

  const MARGIN_LEFT = 20;
  const MARGIN_RIGHT = 20;
  const MARGIN_TOP = 20;
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const LINE_HEIGHT_NORMAL = 5;
  const LINE_HEIGHT_LABEL_OFFSET = 4;

  let currentY = MARGIN_TOP;

  doc.setFont(FONT_PRIMARY);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
  currentY += LINE_HEIGHT_NORMAL * 1.5;

  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setTextColor(50, 50, 50);
  doc.text('INVOICE', PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
  currentY += FONT_SIZE_TITLE * 0.35 + LINE_HEIGHT_NORMAL * 2;

  const rightColX = PAGE_WIDTH / 2 + 10;
  const leftColX = MARGIN_LEFT;
  let initialBlockY = currentY;
  const valueXOffset = 30; // Increased offset for right-aligned values

  // Right side: Invoice No, Payment ID, Order ID, Date, Due Date
  doc.setFont(FONT_PRIMARY, 'bold');
  doc.setFontSize(FONT_SIZE_HEADER_LABEL);
  doc.setTextColor(100, 100, 100);
  doc.text('INVOICE NO:', rightColX, currentY);
  doc.text('PAYMENT ID:', rightColX, currentY + LINE_HEIGHT_NORMAL);
  doc.text('ORDER ID:', rightColX, currentY + LINE_HEIGHT_NORMAL * 2);
  doc.text('DATE:', rightColX, currentY + LINE_HEIGHT_NORMAL * 3);
  doc.text('DUE DATE:', rightColX, currentY + LINE_HEIGHT_NORMAL * 4);

  doc.setFont(FONT_PRIMARY, 'normal');
  doc.setFontSize(FONT_SIZE_HEADER_VALUE);
  doc.setTextColor(50, 50, 50);

  let invoiceDateFormatted = 'N/A';
  let dueDateFormatted = 'N/A';
  try {
    const parsedInvoiceDate = typeof invoiceData.invoiceDate === 'string'
      ? parse(invoiceData.invoiceDate, 'PPP', new Date())
      : invoiceData.invoiceDate;

    if (parsedInvoiceDate && !isNaN(parsedInvoiceDate.getTime())) {
      invoiceDateFormatted = format(parsedInvoiceDate, 'dd.MM.yyyy');
      const dueDate = addDays(parsedInvoiceDate, 30);
      dueDateFormatted = format(dueDate, 'dd.MM.yyyy');
    }
  } catch (e) {
    console.error("Error parsing invoice date for formatting:", e, "Original date:", invoiceData.invoiceDate);
  }

  doc.text(invoiceData.invoiceNumber, rightColX + valueXOffset, currentY, { align: 'left' });
  doc.text(invoiceData.paymentId, rightColX + valueXOffset, currentY + LINE_HEIGHT_NORMAL, { align: 'left' });
  doc.text(invoiceData.orderId, rightColX + valueXOffset, currentY + LINE_HEIGHT_NORMAL * 2, { align: 'left' });
  doc.text(invoiceDateFormatted, rightColX + valueXOffset, currentY + LINE_HEIGHT_NORMAL * 3, { align: 'left' });
  doc.text(dueDateFormatted, rightColX + valueXOffset, currentY + LINE_HEIGHT_NORMAL * 4, { align: 'left' });

  currentY = initialBlockY; // Reset Y for left column
  doc.setFont(FONT_PRIMARY, 'bold');
  doc.setFontSize(FONT_SIZE_SECTION_LABEL);
  doc.setTextColor(100, 100, 100);
  doc.text('ISSUED TO:', leftColX, currentY);

  currentY += LINE_HEIGHT_LABEL_OFFSET;
  doc.setFont(FONT_PRIMARY, 'normal');
  doc.setFontSize(FONT_SIZE_SECTION_TEXT);
  doc.setTextColor(50, 50, 50);
  doc.text(invoiceData.userName, leftColX, currentY);
  currentY += LINE_HEIGHT_NORMAL;
  doc.text(invoiceData.userEmail, leftColX, currentY);
  currentY += LINE_HEIGHT_NORMAL;
  doc.setTextColor(150, 150, 150);
  doc.text("", leftColX, currentY); // Client Address Placeholder removed
  currentY += LINE_HEIGHT_NORMAL;

  currentY += LINE_HEIGHT_NORMAL;
  doc.setFont(FONT_PRIMARY, 'bold');
  doc.setFontSize(FONT_SIZE_SECTION_LABEL);
  doc.setTextColor(100, 100, 100);
  doc.text('PAY TO:', leftColX, currentY);

  currentY += LINE_HEIGHT_LABEL_OFFSET;
  doc.setFont(FONT_PRIMARY, 'normal');
  doc.setFontSize(FONT_SIZE_SECTION_TEXT);
  doc.setTextColor(50, 50, 50);
  doc.text(invoiceData.companyName, leftColX, currentY);
  currentY += LINE_HEIGHT_NORMAL;
  doc.text(`Contact: ${invoiceData.companyContact}`, leftColX, currentY);
  currentY += LINE_HEIGHT_NORMAL;
  // doc.text('Account No.: XXXX XXXX XXXX', leftColX, currentY); // Placeholder
  currentY += LINE_HEIGHT_NORMAL * 2; // Move down to make space for table

  autoTable(doc, {
    startY: currentY,
    head: [['DESCRIPTION', 'UNIT PRICE', 'QTY', 'TOTAL']],
    body: [
      [
        invoiceData.planName,
        `INR ${invoiceData.planPrice.toFixed(2)}`,
        '1',
        `INR ${invoiceData.planPrice.toFixed(2)}`,
      ],
    ],
    theme: 'striped',
    styles: {
      font: FONT_PRIMARY,
      fontSize: FONT_SIZE_TABLE_BODY,
      textColor: [80, 80, 80],
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 }, // Added horizontal padding
      lineWidth: 0.1, // Default line width for horizontal lines in 'striped'
      lineColor: [220, 220, 220], // Default line color for horizontal lines
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: FONT_SIZE_TABLE_HEADER,
      textColor: [120, 120, 120],
      fillColor: undefined, // No fill color for header
      lineWidth: 0.2, // Thicker bottom border for header
      lineColor: [180, 180, 180],
      cellPadding: { top: 3, right: 3, bottom: 2, left: 3 },
    },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH * 0.55, halign: 'left' }, // Description
      1: { cellWidth: CONTENT_WIDTH * 0.18, halign: 'right' }, // Unit Price
      2: { cellWidth: CONTENT_WIDTH * 0.09, halign: 'right' }, // Qty
      3: { cellWidth: CONTENT_WIDTH * 0.18, halign: 'right' }, // Total
    },
    didParseCell: (data) => {
      // Ensure header cells also follow columnStyles alignment
      if (data.section === 'head') {
        if (data.column.index === 0) data.cell.styles.halign = 'left';
        else if ([1, 2, 3].includes(data.column.index)) data.cell.styles.halign = 'right';
        // Ensure only bottom border for header cells
        data.cell.styles.lineWidth = { bottom: 0.2 };
        data.cell.styles.lineColor = [180, 180, 180];
      }
      // For body cells, 'striped' theme adds horizontal lines.
      // If specific top/bottom borders are needed for body cells beyond theme, set here.
      if (data.section === 'body') {
        data.cell.styles.lineWidth = { bottom: 0.1 }; // Ensure bottom border for rows
        data.cell.styles.lineColor = [220, 220, 220];
      }
    },
    tableLineWidth: 0.2, // Outer table border width
    tableLineColor: [180, 180, 180], // Outer table border color
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
  });

  currentY = (doc as any).lastAutoTable.finalY + LINE_HEIGHT_NORMAL * 3.5; // Increased padding

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, currentY - (LINE_HEIGHT_NORMAL * 1.2), PAGE_WIDTH - MARGIN_RIGHT, currentY - (LINE_HEIGHT_NORMAL * 1.2));

  doc.setFont(FONT_PRIMARY, 'bold');
  doc.setFontSize(FONT_SIZE_TOTALS_LABEL + 2);
  doc.setTextColor(30, 30, 30);
  doc.text('TOTAL', MARGIN_LEFT, currentY);

  doc.setFont(FONT_PRIMARY, 'bold');
  doc.setFontSize(FONT_SIZE_TOTALS_VALUE + 2);
  doc.setTextColor(30, 30, 30);
  doc.text(`INR ${invoiceData.planPrice.toFixed(2)}`, PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
  currentY += LINE_HEIGHT_NORMAL * 2;

  const footerY = doc.internal.pageSize.getHeight() - MARGIN_TOP - 5;
  doc.setFont(FONT_PRIMARY, 'bold');
  doc.setFontSize(FONT_SIZE_FOOTER_TEXT);
  doc.setTextColor(100, 100, 100);
  doc.text(invoiceData.companyName, PAGE_WIDTH - MARGIN_RIGHT, footerY, { align: 'right' });

  doc.save(`ProspectFlow-Invoice-${invoiceData.invoiceNumber}.pdf`);
}
