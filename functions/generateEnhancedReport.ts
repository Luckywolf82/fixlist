import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { site_id, period_days = 30, template_id } = await req.json();

    const site = (await base44.asServiceRole.entities.Site.filter({ id: site_id }))[0];
    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    // Fetch template if provided
    let template = null;
    if (template_id) {
      template = (await base44.asServiceRole.entities.ReportTemplate.filter({ id: template_id }))[0];
    } else {
      // Get default template for organization
      const templates = await base44.asServiceRole.entities.ReportTemplate.filter({ 
        organization_id: site.organization_id,
        is_default: true 
      });
      template = templates[0];
    }

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period_days);

    // Get crawls
    const allCrawls = await base44.asServiceRole.entities.Crawl.filter({ site_id }, "-started_at");
    const crawls = allCrawls.filter(c => {
      const crawlDate = new Date(c.started_at);
      return crawlDate >= periodStart && crawlDate <= periodEnd;
    });

    const latestCrawl = crawls[0];
    const previousCrawl = crawls[1];
    
    let issues = [];
    let pages = [];
    let previousIssues = [];
    let previousPages = [];
    
    if (latestCrawl) {
      issues = await base44.asServiceRole.entities.Issue.filter({ crawl_id: latestCrawl.id });
      pages = await base44.asServiceRole.entities.Page.filter({ crawl_id: latestCrawl.id });
    }

    if (previousCrawl) {
      previousIssues = await base44.asServiceRole.entities.Issue.filter({ crawl_id: previousCrawl.id });
      previousPages = await base44.asServiceRole.entities.Page.filter({ crawl_id: previousCrawl.id });
    }

    const openIssues = issues.filter(i => i.status === 'open');
    const criticalIssues = openIssues.filter(i => i.severity === 'critical');
    const highIssues = openIssues.filter(i => i.severity === 'high');
    const mediumIssues = openIssues.filter(i => i.severity === 'medium');

    const previousOpenIssues = previousIssues.filter(i => i.status === 'open');
    const previousCriticalIssues = previousOpenIssues.filter(i => i.severity === 'critical');
    const previousHighIssues = previousOpenIssues.filter(i => i.severity === 'high');
    const previousMediumIssues = previousOpenIssues.filter(i => i.severity === 'medium');

    // Generate AI Summary and Recommendations
    const aiPrompt = `Analyze this SEO audit data and provide:
1. A concise executive summary (3-4 sentences) highlighting the most important findings
2. Top 5 actionable recommendations prioritized by impact

Site: ${site.domain}
Pages crawled: ${pages.length}
Open issues: ${openIssues.length}
- Critical: ${criticalIssues.length}
- High: ${highIssues.length}
- Medium: ${mediumIssues.length}

${previousCrawl ? `Comparison with previous crawl:
- Critical issues: ${previousCriticalIssues.length} → ${criticalIssues.length}
- High issues: ${previousHighIssues.length} → ${highIssues.length}
- Pages: ${previousPages.length} → ${pages.length}` : ''}

Top issue types:
${Object.entries(openIssues.reduce((acc, i) => {
  acc[i.type] = (acc[i.type] || 0) + 1;
  return acc;
}, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Respond in JSON format: {"summary": "...", "recommendations": ["rec1", "rec2", ...]}`;

    let aiSummary = '';
    let aiRecommendations = [];

    try {
      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });
      aiSummary = aiResponse.summary;
      aiRecommendations = aiResponse.recommendations || [];
    } catch (error) {
      console.error('AI generation failed:', error);
      aiSummary = `Analyzed ${pages.length} pages and found ${openIssues.length} issues requiring attention.`;
      aiRecommendations = ["Review and fix critical issues first", "Monitor regularly for new issues"];
    }

    // Calculate improvements/regressions
    const comparisonData = previousCrawl ? {
      previous_report_id: previousCrawl.id,
      improvements: [],
      regressions: []
    } : null;

    if (comparisonData) {
      const criticalChange = criticalIssues.length - previousCriticalIssues.length;
      const highChange = highIssues.length - previousHighIssues.length;
      const pageChange = pages.length - previousPages.length;

      if (criticalChange < 0) {
        comparisonData.improvements.push({
          metric: "Critical Issues",
          before: previousCriticalIssues.length,
          after: criticalIssues.length,
          change: criticalChange
        });
      } else if (criticalChange > 0) {
        comparisonData.regressions.push({
          metric: "Critical Issues",
          before: previousCriticalIssues.length,
          after: criticalIssues.length,
          change: criticalChange
        });
      }

      if (highChange < 0) {
        comparisonData.improvements.push({
          metric: "High Priority Issues",
          before: previousHighIssues.length,
          after: highIssues.length,
          change: highChange
        });
      } else if (highChange > 0) {
        comparisonData.regressions.push({
          metric: "High Priority Issues",
          before: previousHighIssues.length,
          after: highIssues.length,
          change: highChange
        });
      }

      if (pageChange > 0) {
        comparisonData.improvements.push({
          metric: "Pages Crawled",
          before: previousPages.length,
          after: pages.length,
          change: pageChange
        });
      }
    }

    // Generate PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Custom branding if template exists
    const primaryColor = template?.primary_color || '#1e293b';
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 30, g: 41, b: 59 };
    };
    const brandColor = hexToRgb(primaryColor);

    // Header
    doc.setFontSize(24);
    doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
    doc.text(`SEO Audit Report`, 20, yPos);
    yPos += 8;

    doc.setFontSize(16);
    doc.text(site.domain, 20, yPos);
    yPos += 12;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`, 20, yPos);
    yPos += 5;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 5;

    if (template?.company_name) {
      doc.text(`Prepared by: ${template.company_name}`, 20, yPos);
      yPos += 5;
    }

    yPos += 10;

    // AI Executive Summary
    if (template?.include_sections?.executive_summary !== false) {
      doc.setFontSize(16);
      doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
      doc.text('Executive Summary', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setTextColor(0);
      const summaryLines = doc.splitTextToSize(aiSummary, 170);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 7 + 10;
    }

    // Key Metrics
    doc.setFontSize(14);
    doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
    doc.text('Key Metrics', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(0);
    const metrics = [
      `Total Pages: ${pages.length}`,
      `Open Issues: ${openIssues.length}`,
      `Critical Issues: ${criticalIssues.length}`,
      `High Priority: ${highIssues.length}`,
      `Medium Priority: ${mediumIssues.length}`,
    ];

    metrics.forEach(metric => {
      doc.text(metric, 20, yPos);
      yPos += 7;
    });
    yPos += 10;

    // Trend Comparison
    if (previousCrawl && template?.include_sections?.trend_comparison !== false && comparisonData) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
      doc.text('Progress Since Last Audit', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);

      if (comparisonData.improvements.length > 0) {
        doc.setTextColor(0, 150, 0);
        doc.setFont(undefined, 'bold');
        doc.text('✓ Improvements:', 20, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');

        comparisonData.improvements.forEach(imp => {
          doc.text(`  ${imp.metric}: ${imp.before} → ${imp.after} (${imp.change})`, 20, yPos);
          yPos += 6;
        });
        yPos += 5;
      }

      if (comparisonData.regressions.length > 0) {
        doc.setTextColor(220, 38, 38);
        doc.setFont(undefined, 'bold');
        doc.text('⚠ Areas Needing Attention:', 20, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');

        comparisonData.regressions.forEach(reg => {
          doc.text(`  ${reg.metric}: ${reg.before} → ${reg.after} (+${reg.change})`, 20, yPos);
          yPos += 6;
        });
        yPos += 5;
      }

      doc.setTextColor(0);
      yPos += 5;
    }

    // AI Recommendations
    if (template?.include_sections?.recommendations !== false && aiRecommendations.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
      doc.text('AI-Powered Recommendations', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(0);

      aiRecommendations.forEach((rec, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 7 + 5;
      });

      yPos += 10;
    }

    // Issue Details (condensed)
    if (template?.include_sections?.issue_details !== false && criticalIssues.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text('Critical Issues', 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
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
        const msgLines = doc.splitTextToSize(issue.message, 170);
        doc.text(msgLines, 25, yPos);
        yPos += msgLines.length * 4 + 7;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = template?.footer_text || `SEO Audit Report - ${site.domain}`;
      doc.text(footerText, 20, 287);
      doc.text(`Page ${i} of ${pageCount}`, 170, 287);
    }

    const pdfBytes = doc.output('arraybuffer');
    const fileName = `report-${site.domain}-${Date.now()}.pdf`;
    const pdfFile = new File([pdfBytes], fileName, { type: 'application/pdf' });
    
    const uploadResponse = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });
    const pdfUrl = uploadResponse.file_url;

    // Save report
    const report = await base44.asServiceRole.entities.Report.create({
      site_id,
      title: `${site.domain} - ${periodStart.toLocaleDateString()}`,
      report_type: 'manual',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      pdf_url: pdfUrl,
      ai_summary: aiSummary,
      ai_recommendations: aiRecommendations,
      comparison_data: comparisonData,
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
      pdf_url: pdfUrl,
      ai_summary: aiSummary,
      ai_recommendations: aiRecommendations,
      comparison_data: comparisonData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});