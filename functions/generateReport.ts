import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    console.log('Starting report generation...');
    const base44 = createClientFromRequest(req);

    const { site_id, period_days = 30 } = await req.json();
    console.log('Generating report for site_id:', site_id, 'period_days:', period_days);

    console.log('Fetching site...');
    const site = (await base44.asServiceRole.entities.Site.filter({ id: site_id }))[0];
    if (!site) {
      console.error('Site not found:', site_id);
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }
    console.log('Site found:', site.domain);

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period_days);

    // Get crawls in period
    console.log('Fetching crawls...');
    const allCrawls = await base44.asServiceRole.entities.Crawl.filter({ site_id });
    console.log('Total crawls found:', allCrawls.length);
    const crawls = allCrawls.filter(c => {
      const crawlDate = new Date(c.started_at);
      return crawlDate >= periodStart && crawlDate <= periodEnd;
    });
    console.log('Crawls in period:', crawls.length);

    // Get latest crawl data
    const latestCrawl = crawls[0];
    const previousCrawl = crawls[1];
    let issues = [];
    let pages = [];
    let previousIssues = [];
    let previousPages = [];
    
    if (latestCrawl) {
      console.log('Fetching issues and pages for latest crawl...');
      issues = await base44.asServiceRole.entities.Issue.filter({ crawl_id: latestCrawl.id });
      pages = await base44.asServiceRole.entities.Page.filter({ crawl_id: latestCrawl.id });
      console.log('Issues found:', issues.length, 'Pages found:', pages.length);
    } else {
      console.log('No crawls found in period');
    }

    if (previousCrawl) {
      console.log('Fetching previous crawl data for comparison...');
      previousIssues = await base44.asServiceRole.entities.Issue.filter({ crawl_id: previousCrawl.id });
      previousPages = await base44.asServiceRole.entities.Page.filter({ crawl_id: previousCrawl.id });
      console.log('Previous issues:', previousIssues.length, 'Previous pages:', previousPages.length);
    }

    // Fetch Ahrefs data if API key is configured
    let ahrefsData = null;
    const users = await base44.asServiceRole.entities.User.filter({ id: created_by });
    const user = users[0];
    
    if (user?.ahrefs_api_key) {
      console.log('Fetching Ahrefs data...');
      try {
        const ahrefsResponse = await base44.asServiceRole.functions.invoke('fetchAhrefsData', { domain: site.domain });
        ahrefsData = ahrefsResponse.data;
        console.log('Ahrefs data fetched:', ahrefsData);
      } catch (error) {
        console.error('Failed to fetch Ahrefs data:', error);
      }
    }

    const openIssues = issues.filter(i => i.status === 'open');
    const criticalIssues = openIssues.filter(i => i.severity === 'critical');
    const highIssues = openIssues.filter(i => i.severity === 'high');
    const mediumIssues = openIssues.filter(i => i.severity === 'medium');

    const previousOpenIssues = previousIssues.filter(i => i.status === 'open');
    const previousCriticalIssues = previousOpenIssues.filter(i => i.severity === 'critical');
    const previousHighIssues = previousOpenIssues.filter(i => i.severity === 'high');
    const previousMediumIssues = previousOpenIssues.filter(i => i.severity === 'medium');

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

    // Trend Comparison
    if (previousCrawl) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Trend Comparison', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      const criticalChange = criticalIssues.length - previousCriticalIssues.length;
      const highChange = highIssues.length - previousHighIssues.length;
      const mediumChange = mediumIssues.length - previousMediumIssues.length;
      const pageChange = pages.length - previousPages.length;

      const trends = [
        `Pages Crawled: ${previousPages.length} → ${pages.length} (${pageChange >= 0 ? '+' : ''}${pageChange})`,
        `Critical Issues: ${previousCriticalIssues.length} → ${criticalIssues.length} (${criticalChange >= 0 ? '+' : ''}${criticalChange})`,
        `High Priority: ${previousHighIssues.length} → ${highIssues.length} (${highChange >= 0 ? '+' : ''}${highChange})`,
        `Medium Priority: ${previousMediumIssues.length} → ${mediumIssues.length} (${mediumChange >= 0 ? '+' : ''}${mediumChange})`,
      ];

      trends.forEach(trend => {
        const isImprovement = trend.includes('(-');
        doc.setTextColor(isImprovement ? 0 : (trend.includes('(+') ? 180 : 100));
        doc.text(trend, 20, yPos);
        yPos += 7;
      });

      doc.setTextColor(0);
      yPos += 10;

      // Analysis
      doc.setFontSize(11);
      if (criticalChange < 0) {
        doc.setTextColor(0, 150, 0);
        doc.text(`✓ Great progress! Critical issues reduced by ${Math.abs(criticalChange)}.`, 20, yPos);
      } else if (criticalChange > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`⚠ Warning: Critical issues increased by ${criticalChange}.`, 20, yPos);
      } else {
        doc.setTextColor(100);
        doc.text('→ No change in critical issues.', 20, yPos);
      }
      yPos += 10;
      doc.setTextColor(0);
    }

    // Critical Issues
    if (criticalIssues.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text('Critical Issues Requiring Immediate Attention', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(0);

      criticalIssues.forEach((issue, idx) => {
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

      yPos += 5;
    }

    // High Priority Issues
    if (highIssues.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(245, 158, 11);
      doc.text('High Priority Issues', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(0);

      highIssues.forEach((issue, idx) => {
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

      yPos += 5;
    }

    // Medium Priority Issues
    if (mediumIssues.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('Medium Priority Issues', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(0);

      mediumIssues.forEach((issue, idx) => {
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

      yPos += 5;
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

    // Critical issues recommendations
    if (criticalIssues.length > 0) {
      recommendations.push(`URGENT: Address ${criticalIssues.length} critical issues immediately to prevent SEO penalties.`);
      
      const criticalTypes = {};
      criticalIssues.forEach(i => {
        criticalTypes[i.type] = (criticalTypes[i.type] || 0) + 1;
      });
      
      Object.entries(criticalTypes).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([type, count]) => {
        if (type === 'missing_title') {
          recommendations.push(`Fix ${count} pages missing <title> tags. Each page needs a unique, descriptive title (20-60 characters).`);
        } else if (type === 'missing_h1') {
          recommendations.push(`Add <h1> headings to ${count} pages. Every page should have exactly one clear H1.`);
        } else if (type === 'broken_internal_link') {
          recommendations.push(`Fix ${count} broken internal links that lead to 404 errors. Update or remove these links.`);
        } else if (type === 'lcp_poor') {
          recommendations.push(`${count} pages have poor Largest Contentful Paint (>4s). Optimize images and server response time.`);
        } else if (type === 'cls_poor') {
          recommendations.push(`${count} pages have poor Cumulative Layout Shift (>0.25). Set image dimensions and avoid dynamic content shifts.`);
        }
      });
    }

    // High priority recommendations
    if (highIssues.length > 0) {
      const highTypes = {};
      highIssues.forEach(i => {
        highTypes[i.type] = (highTypes[i.type] || 0) + 1;
      });
      
      Object.entries(highTypes).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([type, count]) => {
        if (type === 'missing_meta_description') {
          recommendations.push(`Add meta descriptions to ${count} pages (70-160 characters each) to improve click-through rates.`);
        } else if (type === 'missing_image_alt') {
          recommendations.push(`Add alt text to images on ${count} pages for better accessibility and SEO.`);
        } else if (type === 'orphan_page') {
          recommendations.push(`${count} orphan pages have no internal links. Add relevant internal links from other pages.`);
        } else if (type === 'missing_lang_attribute') {
          recommendations.push(`Add lang attribute to HTML element on ${count} pages for WCAG compliance and accessibility.`);
        }
      });
    }

    // Trend-based recommendations
    if (previousCrawl) {
      const criticalChange = criticalIssues.length - previousCriticalIssues.length;
      if (criticalChange > 0) {
        recommendations.push(`Investigate why critical issues increased by ${criticalChange} since last crawl. Review recent changes.`);
      }
    }

    // General best practices
    if (pages.length > 0) {
      const missingMeta = pages.filter(p => !p.meta_description).length;
      const thinContent = pages.filter(p => p.word_count_estimate < 300).length;
      
      if (thinContent > pages.length * 0.3) {
        recommendations.push(`${thinContent} pages have thin content (<300 words). Add more valuable content to improve rankings.`);
      }
    }

    if (crawls.length === 1) {
      recommendations.push('Run crawls regularly (weekly or bi-weekly) to establish trend data and track improvements over time.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent! Your site has no major issues. Continue monitoring regularly to maintain SEO health.');
      recommendations.push('Consider running crawls weekly to catch new issues early.');
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

    console.log('Generating PDF...');
    const pdfBytes = doc.output('arraybuffer');
    
    console.log('Uploading PDF...');
    const fileName = `report-${site.domain}-${Date.now()}.pdf`;
    const pdfFile = new File([pdfBytes], fileName, { type: 'application/pdf' });
    
    const uploadResponse = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });
    const pdfUrl = uploadResponse.file_url;
    console.log('PDF uploaded:', pdfUrl);

    // Save report record
    console.log('Saving report record...');
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
    console.log('Report created successfully:', report.id);

    return Response.json({ 
      success: true,
      report_id: report.id,
      pdf_url: pdfUrl 
    });

  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return Response.json({ 
      error: error.message || 'Unknown error',
      details: error.toString()
    }, { status: 500 });
  }
});