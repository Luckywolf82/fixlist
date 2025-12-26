import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { site_id, period_days = 30 } = await req.json();

    const site = (await base44.asServiceRole.entities.Site.filter({ id: site_id }))[0];
    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period_days);

    // Get crawls in period
    const allCrawls = await base44.asServiceRole.entities.Crawl.filter({ site_id });
    const crawls = allCrawls.filter(c => {
      const crawlDate = new Date(c.started_at);
      return crawlDate >= periodStart && crawlDate <= periodEnd;
    });

    // Get latest crawl data
    const latestCrawl = crawls[0];
    let issues = [];
    let pages = [];
    
    if (latestCrawl) {
      issues = await base44.asServiceRole.entities.Issue.filter({ crawl_id: latestCrawl.id });
      pages = await base44.asServiceRole.entities.Page.filter({ crawl_id: latestCrawl.id });
    }

    const openIssues = issues.filter(i => i.status === 'open');
    const criticalIssues = openIssues.filter(i => i.severity === 'critical');
    const highIssues = openIssues.filter(i => i.severity === 'high');
    const mediumIssues = openIssues.filter(i => i.severity === 'medium');

    // Generate PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.text(`SEO Report: ${site.domain}`, 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Period: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`, 20, yPos);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos + 5);
    yPos += 20;

    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Executive Summary', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    const summaryData = [
      `Total Crawls: ${crawls.length}`,
      `Pages Crawled: ${pages.length}`,
      `Total Open Issues: ${openIssues.length}`,
      `  - Critical: ${criticalIssues.length}`,
      `  - High: ${highIssues.length}`,
      `  - Medium: ${mediumIssues.length}`,
    ];

    summaryData.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Critical Issues
    if (criticalIssues.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text('Critical Issues Requiring Immediate Attention', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(0);

      criticalIssues.slice(0, 10).forEach((issue, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont(undefined, 'bold');
        doc.text(`${idx + 1}. ${issue.type.replace(/_/g, ' ')}`, 20, yPos);
        yPos += 5;

        doc.setFont(undefined, 'normal');
        const messageLines = doc.splitTextToSize(issue.message, 170);
        doc.text(messageLines, 25, yPos);
        yPos += messageLines.length * 5 + 2;

        doc.setTextColor(100);
        doc.text(`URL: ${issue.url.substring(0, 80)}`, 25, yPos);
        yPos += 5;

        doc.setTextColor(0, 100, 0);
        const fixLines = doc.splitTextToSize(`Fix: ${issue.how_to_fix}`, 170);
        doc.text(fixLines, 25, yPos);
        yPos += fixLines.length * 5 + 8;

        doc.setTextColor(0);
      });
    }

    // Recommendations
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Recommendations', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    const recommendations = [];

    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical issues immediately to prevent SEO penalties.`);
    }
    if (highIssues.length > 5) {
      recommendations.push(`Focus on resolving high priority issues to improve site quality.`);
    }
    if (pages.length > 0) {
      const missingMeta = pages.filter(p => !p.meta_description).length;
      if (missingMeta > 0) {
        recommendations.push(`${missingMeta} pages are missing meta descriptions. Add unique descriptions for better CTR.`);
      }
    }
    if (crawls.length === 0) {
      recommendations.push('Schedule regular crawls to monitor site health and catch issues early.');
    } else if (crawls.length === 1) {
      recommendations.push('Run more crawls to establish trend data and track improvements over time.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Continue monitoring your site regularly to maintain SEO health.');
    }

    recommendations.forEach((rec, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 7 + 5;
    });

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Fixlist Report - Page ${i} of ${pageCount}`, 20, 287);
    }

    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', pdfBlob, `report-${site.domain}-${Date.now()}.pdf`);
    
    const uploadResponse = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfBlob });
    const pdfUrl = uploadResponse.file_url;

    // Save report record
    const report = await base44.asServiceRole.entities.Report.create({
      site_id,
      title: `${site.domain} - ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`,
      report_type: 'manual',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      pdf_url: pdfUrl,
      summary: {
        total_pages: pages.length,
        total_issues: openIssues.length,
        critical_issues: criticalIssues.length,
        high_issues: highIssues.length,
        medium_issues: mediumIssues.length,
      }
    });

    return Response.json({ 
      success: true,
      report_id: report.id,
      pdf_url: pdfUrl 
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});