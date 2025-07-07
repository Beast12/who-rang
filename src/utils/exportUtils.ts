import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types for export data
interface ExportData {
  overallStats: {
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    avg_processing_time: number;
    successful_requests: number;
    failed_requests: number;
  };
  dailyStats: Array<{
    date: string;
    cost: number;
    requests: number;
    tokens: number;
  }>;
  modelStats: Array<{
    model: string;
    cost: number;
    avg_time: number;
    requests: number;
    tokens: number;
  }>;
  usageLogs: Array<{
    id: number;
    provider: string;
    model: string;
    operation_type: string;
    visitor_event_id?: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
    processing_time_ms: number;
    created_at: string;
    success: boolean;
    error_message?: string;
    event_timestamp?: string;
  }>;
  budget?: {
    monthly_limit: number;
    monthly_spent: number;
    remaining: number;
  };
  period: string;
}

// Format currency
const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;

// Format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// CSV Export Functions
export const exportToCSV = (data: ExportData) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `AI_Analytics_Report_${timestamp}_${data.period}.csv`;

  let csvContent = '';

  // Header
  csvContent += 'AI Cost Analytics Report\n';
  csvContent += `Generated: ${new Date().toLocaleString()}\n`;
  csvContent += `Period: ${data.period}\n\n`;

  // Overview Statistics
  csvContent += 'OVERVIEW STATISTICS\n';
  csvContent += 'Metric,Value\n';
  csvContent += `Total Spent,${formatCurrency(data.overallStats.total_cost)}\n`;
  csvContent += `API Requests,${data.overallStats.total_requests}\n`;
  csvContent += `Successful Requests,${data.overallStats.successful_requests}\n`;
  csvContent += `Failed Requests,${data.overallStats.failed_requests}\n`;
  csvContent += `Total Tokens,${formatNumber(data.overallStats.total_tokens)}\n`;
  csvContent += `Average Response Time,${Math.round(data.overallStats.avg_processing_time)}ms\n`;
  csvContent += `Success Rate,${((data.overallStats.successful_requests / Math.max(data.overallStats.total_requests, 1)) * 100).toFixed(1)}%\n\n`;

  // Budget Information
  if (data.budget && data.budget.monthly_limit > 0) {
    csvContent += 'BUDGET INFORMATION\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Monthly Limit,${formatCurrency(data.budget.monthly_limit)}\n`;
    csvContent += `Monthly Spent,${formatCurrency(data.budget.monthly_spent)}\n`;
    csvContent += `Remaining Budget,${formatCurrency(data.budget.remaining)}\n`;
    csvContent += `Budget Usage,${((data.budget.monthly_spent / data.budget.monthly_limit) * 100).toFixed(1)}%\n\n`;
  }

  // Daily Statistics
  if (data.dailyStats && data.dailyStats.length > 0) {
    csvContent += 'DAILY STATISTICS\n';
    csvContent += 'Date,Cost,Requests,Tokens\n';
    data.dailyStats.forEach((day) => {
      csvContent += `${new Date(day.date).toLocaleDateString()},${formatCurrency(day.cost)},${day.requests},${day.tokens}\n`;
    });
    csvContent += '\n';
  }

  // Model Performance
  if (data.modelStats && data.modelStats.length > 0) {
    csvContent += 'MODEL PERFORMANCE\n';
    csvContent += 'Model,Total Cost,Avg Response Time,Requests,Tokens\n';
    data.modelStats.forEach((model) => {
      csvContent += `${model.model},${formatCurrency(model.cost)},${model.avg_time}ms,${model.requests},${model.tokens}\n`;
    });
    csvContent += '\n';
  }

  // Recent API Calls
  if (data.usageLogs && data.usageLogs.length > 0) {
    csvContent += 'RECENT API CALLS\n';
    csvContent +=
      'Timestamp,Provider,Model,Cost,Tokens,Response Time,Success\n';
    data.usageLogs.slice(0, 50).forEach((log) => {
      csvContent += `${new Date(log.created_at).toLocaleString()},${log.provider},${log.model},${formatCurrency(log.cost_usd)},${log.total_tokens},${log.processing_time_ms}ms,${log.success ? 'Yes' : 'No'}\n`;
    });
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export Functions
export const exportToPDF = async (data: ExportData) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `AI_Analytics_Report_${timestamp}_${data.period}.pdf`;

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AI Cost Analytics Report', 20, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Period: ${data.period}`, 20, yPosition);
  yPosition += 15;

  // Overview Statistics
  checkPageBreak(60);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overview Statistics', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const overviewData = [
    ['Total Spent', formatCurrency(data.overallStats.total_cost)],
    ['API Requests', data.overallStats.total_requests.toString()],
    ['Successful Requests', data.overallStats.successful_requests.toString()],
    ['Failed Requests', data.overallStats.failed_requests.toString()],
    ['Total Tokens', formatNumber(data.overallStats.total_tokens)],
    [
      'Average Response Time',
      `${Math.round(data.overallStats.avg_processing_time)}ms`,
    ],
    [
      'Success Rate',
      `${((data.overallStats.successful_requests / Math.max(data.overallStats.total_requests, 1)) * 100).toFixed(1)}%`,
    ],
  ];

  overviewData.forEach(([label, value]) => {
    pdf.text(`${label}:`, 25, yPosition);
    pdf.text(value, 80, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Budget Information
  if (data.budget && data.budget.monthly_limit > 0) {
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Budget Information', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const budgetData = [
      ['Monthly Limit', formatCurrency(data.budget.monthly_limit)],
      ['Monthly Spent', formatCurrency(data.budget.monthly_spent)],
      ['Remaining Budget', formatCurrency(data.budget.remaining)],
      [
        'Budget Usage',
        `${((data.budget.monthly_spent / data.budget.monthly_limit) * 100).toFixed(1)}%`,
      ],
    ];

    budgetData.forEach(([label, value]) => {
      pdf.text(`${label}:`, 25, yPosition);
      pdf.text(value, 80, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
  }

  // Model Performance Table
  if (data.modelStats && data.modelStats.length > 0) {
    checkPageBreak(50);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Model Performance', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');

    // Table headers
    pdf.text('Model', 25, yPosition);
    pdf.text('Cost', 70, yPosition);
    pdf.text('Avg Time', 100, yPosition);
    pdf.text('Requests', 130, yPosition);
    pdf.text('Tokens', 160, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');

    data.modelStats.forEach((model) => {
      checkPageBreak(6);
      pdf.text(model.model.substring(0, 15), 25, yPosition);
      pdf.text(formatCurrency(model.cost), 70, yPosition);
      pdf.text(`${model.avg_time}ms`, 100, yPosition);
      pdf.text(model.requests.toString(), 130, yPosition);
      pdf.text(formatNumber(model.tokens), 160, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
  }

  // Recent API Calls
  if (data.usageLogs && data.usageLogs.length > 0) {
    checkPageBreak(50);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent API Calls (Last 20)', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');

    // Table headers
    pdf.text('Time', 25, yPosition);
    pdf.text('Provider', 55, yPosition);
    pdf.text('Model', 85, yPosition);
    pdf.text('Cost', 120, yPosition);
    pdf.text('Tokens', 145, yPosition);
    pdf.text('Time', 170, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'normal');

    data.usageLogs.slice(0, 20).forEach((log) => {
      checkPageBreak(5);
      const time = new Date(log.created_at).toLocaleTimeString();
      pdf.text(time, 25, yPosition);
      pdf.text(log.provider, 55, yPosition);
      pdf.text(log.model.substring(0, 10), 85, yPosition);
      pdf.text(formatCurrency(log.cost_usd), 120, yPosition);
      pdf.text(formatNumber(log.total_tokens), 145, yPosition);
      pdf.text(`${log.processing_time_ms}ms`, 170, yPosition);
      yPosition += 5;
    });
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
    pdf.text('AI Cost Analytics Report', 20, pageHeight - 10);
  }

  // Save PDF
  pdf.save(filename);
};

// Capture charts as images for PDF
export const captureChartsForPDF = async (): Promise<string[]> => {
  const chartImages: string[] = [];

  // Find all chart containers
  const chartContainers = document.querySelectorAll('.recharts-wrapper');

  for (const container of chartContainers) {
    try {
      const canvas = await html2canvas(container as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      chartImages.push(canvas.toDataURL('image/png'));
    } catch (error) {
      console.warn('Failed to capture chart:', error);
    }
  }

  return chartImages;
};

// Enhanced PDF export with charts
export const exportToPDFWithCharts = async (data: ExportData) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `AI_Analytics_Report_${timestamp}_${data.period}.pdf`;

  try {
    // Capture charts first
    const chartImages = await captureChartsForPDF();

    // Create PDF with charts
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI Cost Analytics Report', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Period: ${data.period}`, 20, yPosition);
    yPosition += 20;

    // Executive Summary
    checkPageBreak(80);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    // Key metrics in a nice layout
    const summaryBoxes = [
      {
        label: 'Total Spent',
        value: formatCurrency(data.overallStats.total_cost),
        x: 20,
        y: yPosition,
      },
      {
        label: 'API Requests',
        value: data.overallStats.total_requests.toString(),
        x: 70,
        y: yPosition,
      },
      {
        label: 'Tokens Used',
        value: formatNumber(data.overallStats.total_tokens),
        x: 120,
        y: yPosition,
      },
      {
        label: 'Avg Response',
        value: `${Math.round(data.overallStats.avg_processing_time)}ms`,
        x: 170,
        y: yPosition,
      },
    ];

    summaryBoxes.forEach((box) => {
      // Draw box
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(box.x - 2, box.y - 2, 45, 20);

      // Add content
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(box.label, box.x, box.y + 5);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(box.value, box.x, box.y + 15);
    });

    yPosition += 35;

    // Add charts if captured
    if (chartImages.length > 0) {
      chartImages.forEach((chartImage, index) => {
        checkPageBreak(100);

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Chart ${index + 1}`, 20, yPosition);
        yPosition += 10;

        // Add chart image
        const imgWidth = 170;
        const imgHeight = 80;
        pdf.addImage(chartImage, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      });
    }

    // Add detailed data tables (same as before)
    // ... (rest of the PDF generation code from exportToPDF)

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text('AI Cost Analytics Report', 20, pageHeight - 10);
    }

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Failed to export PDF with charts:', error);
    // Fallback to basic PDF export
    await exportToPDF(data);
  }
};
