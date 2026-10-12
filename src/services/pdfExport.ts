import { jsPDF } from 'jspdf';
import { OutreachEntry, UserProfile, OutreachType, OutreachLevel } from '../types';

export interface PDFExportData {
  currentUser: UserProfile;
  filters: {
    dateFilter: string;
    councilFilter: string;
    levelFilter: string;
  };
  kpis: {
    totalSouls: number;
    totalOutreaches: number;
    totalLeadersEngaged: number;
    avgSoulsPerOutreach: string;
    uncontactedConvertsCount: number;
  };
  timelineData: { date: string; souls: number }[];
  typeMetrics: { name: string; souls: number; count: number }[];
  councilLeaderboard: { council: string; souls: number; leaders: number; count: number }[];
  levelBreakdown: Record<OutreachLevel, number>;
  filteredData: OutreachEntry[];
}

export function generateAnalyticsPDF(data: PDFExportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // Helper: Draw Header on Page
  const drawHeader = (pageNumber: number, totalPages: number) => {
    // Top banner background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 74, 'F');

    // Emerald accent strip
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 70, pageWidth, 4, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('EPHESIANS OUTREACH OPERATIONS', margin, 32);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'Ministry Harvest Analytics & Field Operations Executive Briefing',
      margin,
      47
    );

    // Date & Admin Info on right side
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`DATE: ${dateStr} ${timeStr}`, pageWidth - margin, 28, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(
      `ADMIN: ${data.currentUser.name} (${data.currentUser.role.toUpperCase()})`,
      pageWidth - margin,
      41,
      { align: 'right' }
    );

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`COUNCIL: ${data.currentUser.council || 'All Councils'}`, pageWidth - margin, 54, {
      align: 'right',
    });

    // Page footer
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(0, pageHeight - 30, pageWidth, pageHeight - 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      'Ephesians Field Ministry System • Confidential Administrative Report',
      margin,
      pageHeight - 12
    );
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 12, {
      align: 'right',
    });
  };

  // ==========================================
  // PAGE 1: Executive Summary & Visual Charts
  // ==========================================
  drawHeader(1, 2);

  let y = 92;

  // Active Filter Ribbon Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, y, contentWidth, 24, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('ACTIVE REPORT FILTERS:', margin + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const filterSummary = `Date Range: ${
    data.filters.dateFilter === '7days'
      ? 'Past 7 Days'
      : data.filters.dateFilter === '30days'
      ? 'Past 30 Days'
      : 'All Time'
  }   |   Council: ${data.filters.councilFilter === 'all' ? 'All (Ephesians 1-6)' : data.filters.councilFilter}   |   Tier: ${
    data.filters.levelFilter === 'all' ? 'All Organizational Levels' : data.filters.levelFilter
  }   |   Dataset: ${data.filteredData.length} records`;
  doc.text(filterSummary, margin + 125, y + 15);

  y += 34;

  // ------------------------------------------
  // 1. Executive KPI Summary Cards (5 columns)
  // ------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE KEY PERFORMANCE INDICATORS', margin, y + 8);
  y += 15;

  const cardWidth = (contentWidth - 4 * 8) / 5;
  const cardHeight = 52;
  const kpiCards = [
    {
      label: 'SOULS WON',
      value: data.kpis.totalSouls.toLocaleString(),
      subtext: 'Harvest total',
      bgColor: [236, 253, 245], // emerald-50
      borderColor: [16, 185, 129], // emerald-500
      textColor: [6, 95, 70],
    },
    {
      label: 'OPERATIONS',
      value: data.kpis.totalOutreaches.toString(),
      subtext: 'Field events logged',
      bgColor: [239, 246, 255], // blue-50
      borderColor: [59, 130, 246], // blue-500
      textColor: [30, 64, 175],
    },
    {
      label: 'LEADERS',
      value: data.kpis.totalLeadersEngaged.toString(),
      subtext: 'Member turnouts',
      bgColor: [250, 245, 255], // purple-50
      borderColor: [168, 85, 247], // purple-500
      textColor: [107, 33, 168],
    },
    {
      label: 'AVG YIELD',
      value: data.kpis.avgSoulsPerOutreach,
      subtext: 'Souls / operation',
      bgColor: [254, 252, 232], // yellow/amber-50
      borderColor: [245, 158, 11], // amber-500
      textColor: [146, 64, 14],
    },
    {
      label: 'FOLLOW-UP',
      value: data.kpis.uncontactedConvertsCount.toString(),
      subtext: 'Pending first call',
      bgColor: [255, 241, 242], // rose-50
      borderColor: [244, 63, 94], // rose-500
      textColor: [159, 18, 57],
    },
  ];

  kpiCards.forEach((card, i) => {
    const cardX = margin + i * (cardWidth + 8);
    doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
    doc.setDrawColor(card.borderColor[0], card.borderColor[1], card.borderColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 5, 5, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
    doc.text(card.label, cardX + 8, y + 14);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, cardX + 8, y + 33);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.subtext, cardX + 8, y + 44);
  });

  y += cardHeight + 20;

  // ------------------------------------------
  // 2. Chart: Timeline Harvest Momentum Trend
  // ------------------------------------------
  const chartBoxHeight = 160;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, chartBoxHeight, 6, 6, 'FD');

  // Chart Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('SOULS WON TIMELINE MOMENTUM', margin + 14, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Daily convert intake trend over consecutive outreach dates', margin + 14, y + 32);

  // Chart badge on right
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + contentWidth - 110, y + 10, 96, 18, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text(`${data.kpis.totalSouls} Total Souls Harvested`, margin + contentWidth - 105, y + 22);

  if (data.timelineData.length === 0) {
    // Empty state
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'No outreach records logged yet in the database. First entry will plot harvest bars here.',
      margin + contentWidth / 2,
      y + 85,
      { align: 'center' }
    );
  } else {
    // Render Bar Chart
    const chartAreaX = margin + 30;
    const chartAreaY = y + 48;
    const chartAreaW = contentWidth - 50;
    const chartAreaH = 88;
    const baselineY = chartAreaY + chartAreaH;

    // Baseline & Gridlines
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(chartAreaX, baselineY, chartAreaX + chartAreaW, baselineY);
    doc.line(chartAreaX, baselineY - chartAreaH * 0.5, chartAreaX + chartAreaW, baselineY - chartAreaH * 0.5);
    doc.line(chartAreaX, baselineY - chartAreaH, chartAreaX + chartAreaW, baselineY - chartAreaH);

    const maxSouls = Math.max(...data.timelineData.map((d) => d.souls), 10);

    // Axis labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(maxSouls.toString(), chartAreaX - 6, baselineY - chartAreaH + 3, { align: 'right' });
    doc.text(Math.round(maxSouls / 2).toString(), chartAreaX - 6, baselineY - chartAreaH * 0.5 + 3, {
      align: 'right',
    });
    doc.text('0', chartAreaX - 6, baselineY + 3, { align: 'right' });

    // Draw bars
    const items = data.timelineData.slice(-10); // show up to last 10 points
    const colWidth = chartAreaW / items.length;
    const barWidth = Math.min(28, colWidth * 0.65);

    items.forEach((item, index) => {
      const barHeight = Math.max(4, (item.souls / maxSouls) * chartAreaH);
      const barX = chartAreaX + index * colWidth + (colWidth - barWidth) / 2;
      const barY = baselineY - barHeight;

      // Bar fill (Emerald)
      doc.setFillColor(16, 185, 129);
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.5);
      doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'FD');

      // Value label on top of bar
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(6, 95, 70);
      doc.text(item.souls.toString(), barX + barWidth / 2, barY - 3, { align: 'center' });

      // Date label below baseline
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const shortDate = item.date.split('-').slice(1).join('/');
      doc.text(shortDate, barX + barWidth / 2, baselineY + 11, { align: 'center' });
    });
  }

  y += chartBoxHeight + 18;

  // ------------------------------------------
  // 3. Chart: Outreach Type Effectiveness
  // ------------------------------------------
  const typeBoxHeight = 180;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, typeBoxHeight, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('OUTREACH TYPE EFFECTIVENESS & YIELD', margin + 14, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Comparison of soul harvests and mobilization by evangelism format', margin + 14, y + 32);

  // Table header for type metrics
  const typeStartY = y + 46;
  const maxTypeSouls = Math.max(...data.typeMetrics.map((t) => t.souls), 1);

  data.typeMetrics.forEach((type, idx) => {
    const rowY = typeStartY + idx * 21;
    const barPct = type.souls > 0 ? (type.souls / maxTypeSouls) * 100 : 0;
    const trackWidth = 190;
    const barW = Math.max(type.souls > 0 ? 4 : 0, (barPct / 100) * trackWidth);

    // Type label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(type.name, margin + 14, rowY + 6);

    // Event count
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${type.count} event${type.count === 1 ? '' : 's'}`, margin + 180, rowY + 6);

    // Bar track
    const barX = margin + 240;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(barX, rowY - 1, trackWidth, 9, 3, 3, 'FD');

    // Bar fill
    if (barW > 0) {
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(barX, rowY - 1, barW, 9, 3, 3, 'F');
    }

    // Souls won value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${type.souls} souls`, margin + contentWidth - 14, rowY + 6, { align: 'right' });
  });

  // ==========================================
  // PAGE 2: Council Leaderboard & Operations
  // ==========================================
  doc.addPage();
  drawHeader(2, 2);

  let y2 = 92;

  // ------------------------------------------
  // 4. Council Performance Leaderboard (Ephesians 1 to 6)
  // ------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('COUNCIL PERFORMANCE LEADERBOARD (EPHESIANS 1 - 6)', margin, y2 + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Official ranking by soul count, mobilized leadership, and operational yield', margin, y2 + 20);

  y2 += 30;

  // Table dimensions
  const tableX = margin;
  const tableW = contentWidth;
  const headerHeight = 22;
  const rowHeight = 22;

  // Table Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(tableX, y2, tableW, headerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('RANK', tableX + 12, y2 + 14);
  doc.text('COUNCIL NAME', tableX + 50, y2 + 14);
  doc.text('FIELD EVENTS', tableX + 220, y2 + 14, { align: 'right' });
  doc.text('LEADERS PRESENT', tableX + 320, y2 + 14, { align: 'right' });
  doc.text('SOULS WON', tableX + 410, y2 + 14, { align: 'right' });
  doc.text('AVG YIELD / EVT', tableX + tableW - 12, y2 + 14, { align: 'right' });

  y2 += headerHeight;

  // Build complete list of councils (Ephesians 1 to 6)
  const defaultEphesians = [
    'Ephesians 1',
    'Ephesians 2',
    'Ephesians 3',
    'Ephesians 4',
    'Ephesians 5',
    'Ephesians 6',
  ];
  const combinedMap = new Map<string, { council: string; souls: number; leaders: number; count: number }>();

  // Ensure all Ephesians 1-6 exist in ranking
  defaultEphesians.forEach((c) => {
    combinedMap.set(c, { council: c, souls: 0, leaders: 0, count: 0 });
  });

  data.councilLeaderboard.forEach((item) => {
    combinedMap.set(item.council, item);
  });

  const sortedCouncils = Array.from(combinedMap.values()).sort((a, b) => b.souls - a.souls);

  sortedCouncils.forEach((row, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(tableX, y2, tableW, rowHeight, 'F');

    // Row border bottom
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(tableX, y2 + rowHeight, tableX + tableW, y2 + rowHeight);

    // Rank badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (index === 0 && row.souls > 0) {
      doc.setTextColor(217, 119, 6); // amber gold
      doc.text(`#${index + 1} ★`, tableX + 12, y2 + 14);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text(`#${index + 1}`, tableX + 12, y2 + 14);
    }

    // Council name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row.council, tableX + 50, y2 + 14);

    // Events
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(row.count.toString(), tableX + 220, y2 + 14, { align: 'right' });

    // Leaders
    doc.text(row.leaders.toString(), tableX + 320, y2 + 14, { align: 'right' });

    // Souls
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(row.souls > 0 ? 5 : 100, row.souls > 0 ? 150 : 116, row.souls > 0 ? 105 : 139);
    doc.text(row.souls.toString(), tableX + 410, y2 + 14, { align: 'right' });

    // Avg Souls
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const avg = row.count > 0 ? (row.souls / row.count).toFixed(1) : '0.0';
    doc.text(avg, tableX + tableW - 12, y2 + 14, { align: 'right' });

    y2 += rowHeight;
  });

  // Table summary footer row
  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, y2, tableW, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL / OVERALL HARVEST', tableX + 12, y2 + 14);
  doc.text(data.kpis.totalOutreaches.toString(), tableX + 220, y2 + 14, { align: 'right' });
  doc.text(data.kpis.totalLeadersEngaged.toString(), tableX + 320, y2 + 14, { align: 'right' });
  doc.setTextColor(6, 95, 70);
  doc.text(data.kpis.totalSouls.toString(), tableX + 410, y2 + 14, { align: 'right' });
  doc.setTextColor(15, 23, 42);
  doc.text(data.kpis.avgSoulsPerOutreach, tableX + tableW - 12, y2 + 14, { align: 'right' });

  y2 += rowHeight + 24;

  // ------------------------------------------
  // 5. Outreach Organizational Tier Breakdown
  // ------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ORGANIZATIONAL TIER DISTRIBUTION', margin, y2 + 8);
  y2 += 18;

  const tiers: { level: OutreachLevel; color: number[] }[] = [
    { level: 'Bacentas', color: [245, 158, 11] }, // amber
    { level: 'Governorships', color: [59, 130, 246] }, // blue
    { level: 'Overseership', color: [16, 185, 129] }, // emerald
  ];

  const tierBoxW = (contentWidth - 2 * 12) / 3;
  tiers.forEach((tier, i) => {
    const tierX = margin + i * (tierBoxW + 12);
    const souls = data.levelBreakdown[tier.level] || 0;
    const pct = data.kpis.totalSouls > 0 ? Math.round((souls / data.kpis.totalSouls) * 100) : 0;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(tierX, y2, tierBoxW, 58, 5, 5, 'FD');

    // Colored top pill
    doc.setFillColor(tier.color[0], tier.color[1], tier.color[2]);
    doc.rect(tierX, y2, tierBoxW, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(tier.level, tierX + 10, y2 + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${souls} souls`, tierX + 10, y2 + 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${pct}% of total harvest`, tierX + 10, y2 + 48);
  });

  y2 += 80;

  // ------------------------------------------
  // 6. Sign-off & Verification Block
  // ------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, y2, contentWidth, 80, 5, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL ADMINISTRATIVE VALIDATION & REVIEW', margin + 14, y2 + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'I hereby certify that the ministry metrics and outreach operations contained in this report represent the authentic field records.',
    margin + 14,
    y2 + 30
  );

  // Signature lines
  const sigLineY = y2 + 62;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);

  // Overseer signature
  doc.line(margin + 14, sigLineY, margin + 200, sigLineY);
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Lead Overseer: ${data.currentUser.name}`, margin + 14, sigLineY + 11);

  // Date line
  doc.line(margin + 240, sigLineY, margin + 350, sigLineY);
  doc.text(`Validation Date: ${new Date().toISOString().split('T')[0]}`, margin + 240, sigLineY + 11);

  // Stamp indicator
  doc.line(margin + 390, sigLineY, margin + contentWidth - 14, sigLineY);
  doc.text('Official Ministry Stamp / Seal', margin + 390, sigLineY + 11);

  // Trigger browser download
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `ephesians_ministry_analytics_${cleanDate}.pdf`;
  doc.save(filename);
}

export function exportMinistryReportPDF(params: {
  currentUser: UserProfile;
  outreaches: OutreachEntry[];
  councilFilter?: string;
  levelFilter?: string;
}): void {
  const { currentUser, outreaches, councilFilter = 'all', levelFilter = 'all' } = params;
  let filtered = [...outreaches];
  if (councilFilter !== 'all') {
    filtered = filtered.filter((o) => o.councilName === councilFilter);
  }
  if (levelFilter !== 'all') {
    filtered = filtered.filter((o) => o.outreachLevel === levelFilter);
  }

  const totalSouls = filtered.reduce((acc, curr) => acc + curr.soulsWonCount, 0);
  const totalOutreaches = filtered.length;
  const totalLeadersEngaged = filtered.reduce((acc, curr) => acc + curr.leadersPresentCount, 0);
  const avgSoulsPerOutreach = totalOutreaches > 0 ? (totalSouls / totalOutreaches).toFixed(1) : '0.0';
  const allConverts = filtered.flatMap((o) => o.converts || []);
  const uncontactedConvertsCount = allConverts.filter((c) => c.followUpStatus === 'Uncontacted').length;

  const timelineMap: Record<string, number> = {};
  filtered.forEach((o) => {
    timelineMap[o.date] = (timelineMap[o.date] || 0) + o.soulsWonCount;
  });
  const timelineData = Object.entries(timelineMap)
    .map(([date, souls]) => ({ date, souls }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  const typeMap: Record<string, { souls: number; count: number }> = {};
  filtered.forEach((o) => {
    if (!typeMap[o.outreachType]) typeMap[o.outreachType] = { souls: 0, count: 0 };
    typeMap[o.outreachType].souls += o.soulsWonCount;
    typeMap[o.outreachType].count += 1;
  });
  const typeMetrics = Object.entries(typeMap).map(([name, val]) => ({ name, souls: val.souls, count: val.count }));

  const councilMap: Record<string, { souls: number; leaders: number; count: number }> = {};
  filtered.forEach((o) => {
    if (!councilMap[o.councilName]) councilMap[o.councilName] = { souls: 0, leaders: 0, count: 0 };
    councilMap[o.councilName].souls += o.soulsWonCount;
    councilMap[o.councilName].leaders += o.leadersPresentCount;
    councilMap[o.councilName].count += 1;
  });
  const councilLeaderboard = Object.entries(councilMap).map(([council, val]) => ({
    council,
    souls: val.souls,
    leaders: val.leaders,
    count: val.count,
  }));

  const levelBreakdown: Record<OutreachLevel, number> = {
    Bacentas: filtered.filter((o) => o.outreachLevel === 'Bacentas').length,
    Governorships: filtered.filter((o) => o.outreachLevel === 'Governorships').length,
    Councils: filtered.filter((o) => o.outreachLevel === 'Councils').length,
    Overseership: filtered.filter((o) => o.outreachLevel === 'Overseership').length,
  };

  generateAnalyticsPDF({
    currentUser,
    filters: {
      dateFilter: 'all',
      councilFilter,
      levelFilter,
    },
    kpis: {
      totalSouls,
      totalOutreaches,
      totalLeadersEngaged,
      avgSoulsPerOutreach,
      uncontactedConvertsCount,
    },
    timelineData,
    typeMetrics,
    councilLeaderboard,
    levelBreakdown,
    filteredData: filtered,
  });
}
