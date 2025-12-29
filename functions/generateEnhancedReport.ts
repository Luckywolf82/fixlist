import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { site_id, period_days = 30, template_id, language = 'en' } = await req.json();
    
    // Translation strings
    const translations = {
      en: {
        reportTitle: 'SEO Audit Report',
        period: 'Period',
        generated: 'Generated',
        preparedBy: 'Prepared by',
        executiveSummary: 'Executive Summary',
        competitiveBenchmarking: 'Competitive Benchmarking',
        yourSite: 'Your Site',
        competitors: 'Competitors',
        keyMetrics: 'Key Metrics',
        totalPages: 'Total Pages',
        openIssues: 'Open Issues',
        criticalIssues: 'Critical Issues',
        highPriority: 'High Priority',
        mediumPriority: 'Medium Priority',
        progressSinceLastAudit: 'Progress Since Last Audit',
        improvements: '✓ Improvements',
        areasNeedingAttention: '⚠ Areas Needing Attention',
        aiRecommendations: 'AI-Powered Recommendations',
        issueDetails: 'Issue Details',
        fix: 'Fix',
        url: 'URL',
        domainRating: 'Domain Rating',
        backlinks: 'Backlinks',
        keywords: 'Keywords'
      },
      no: {
        reportTitle: 'SEO-revisjon Rapport',
        period: 'Periode',
        generated: 'Generert',
        preparedBy: 'Utarbeidet av',
        executiveSummary: 'Sammendrag',
        competitiveBenchmarking: 'Konkurranseanalyse',
        yourSite: 'Ditt nettsted',
        competitors: 'Konkurrenter',
        keyMetrics: 'Nøkkelmetrikker',
        totalPages: 'Totale sider',
        openIssues: 'Åpne problemer',
        criticalIssues: 'Kritiske problemer',
        highPriority: 'Høy prioritet',
        mediumPriority: 'Middels prioritet',
        progressSinceLastAudit: 'Fremgang siden forrige revisjon',
        improvements: '✓ Forbedringer',
        areasNeedingAttention: '⚠ Områder som trenger oppmerksomhet',
        aiRecommendations: 'AI-drevne anbefalinger',
        issueDetails: 'Problemdetaljer',
        fix: 'Fiks',
        url: 'URL',
        domainRating: 'Domenerangering',
        backlinks: 'Backlinks',
        keywords: 'Søkeord'
      },
      sv: {
        reportTitle: 'SEO-revision Rapport',
        period: 'Period',
        generated: 'Genererad',
        preparedBy: 'Framställd av',
        executiveSummary: 'Sammanfattning',
        competitiveBenchmarking: 'Konkurrensanalys',
        yourSite: 'Din webbplats',
        competitors: 'Konkurrenter',
        keyMetrics: 'Nyckelmetrik',
        totalPages: 'Totalt antal sidor',
        openIssues: 'Öppna problem',
        criticalIssues: 'Kritiska problem',
        highPriority: 'Hög prioritet',
        mediumPriority: 'Medel prioritet',
        progressSinceLastAudit: 'Framsteg sedan senaste revision',
        improvements: '✓ Förbättringar',
        areasNeedingAttention: '⚠ Områden som behöver uppmärksamhet',
        aiRecommendations: 'AI-drivna rekommendationer',
        issueDetails: 'Problemdetaljer',
        fix: 'Åtgärda',
        url: 'URL',
        domainRating: 'Domänbetyg',
        backlinks: 'Backlinks',
        keywords: 'Sökord'
      },
      da: {
        reportTitle: 'SEO-revision Rapport',
        period: 'Periode',
        generated: 'Genereret',
        preparedBy: 'Udarbejdet af',
        executiveSummary: 'Sammendrag',
        competitiveBenchmarking: 'Konkurrenceanalyse',
        yourSite: 'Din hjemmeside',
        competitors: 'Konkurrenter',
        keyMetrics: 'Nøglemetrik',
        totalPages: 'Totale sider',
        openIssues: 'Åbne problemer',
        criticalIssues: 'Kritiske problemer',
        highPriority: 'Høj prioritet',
        mediumPriority: 'Mellem prioritet',
        progressSinceLastAudit: 'Fremskridt siden sidste revision',
        improvements: '✓ Forbedringer',
        areasNeedingAttention: '⚠ Områder der kræver opmærksomhed',
        aiRecommendations: 'AI-drevne anbefalinger',
        issueDetails: 'Problemdetaljer',
        fix: 'Ret',
        url: 'URL',
        domainRating: 'Domænevurdering',
        backlinks: 'Backlinks',
        keywords: 'Søgeord'
      },
      de: {
        reportTitle: 'SEO-Audit Bericht',
        period: 'Zeitraum',
        generated: 'Erstellt',
        preparedBy: 'Erstellt von',
        executiveSummary: 'Zusammenfassung',
        competitiveBenchmarking: 'Wettbewerbsanalyse',
        yourSite: 'Ihre Website',
        competitors: 'Wettbewerber',
        keyMetrics: 'Wichtige Metriken',
        totalPages: 'Gesamte Seiten',
        openIssues: 'Offene Probleme',
        criticalIssues: 'Kritische Probleme',
        highPriority: 'Hohe Priorität',
        mediumPriority: 'Mittlere Priorität',
        progressSinceLastAudit: 'Fortschritt seit letztem Audit',
        improvements: '✓ Verbesserungen',
        areasNeedingAttention: '⚠ Bereiche, die Aufmerksamkeit benötigen',
        aiRecommendations: 'KI-gestützte Empfehlungen',
        issueDetails: 'Problemdetails',
        fix: 'Beheben',
        url: 'URL',
        domainRating: 'Domain Rating',
        backlinks: 'Backlinks',
        keywords: 'Schlüsselwörter'
      },
      fr: {
        reportTitle: 'Rapport d\'audit SEO',
        period: 'Période',
        generated: 'Généré',
        preparedBy: 'Préparé par',
        executiveSummary: 'Résumé',
        competitiveBenchmarking: 'Analyse concurrentielle',
        yourSite: 'Votre site',
        competitors: 'Concurrents',
        keyMetrics: 'Métriques clés',
        totalPages: 'Pages totales',
        openIssues: 'Problèmes ouverts',
        criticalIssues: 'Problèmes critiques',
        highPriority: 'Haute priorité',
        mediumPriority: 'Priorité moyenne',
        progressSinceLastAudit: 'Progrès depuis le dernier audit',
        improvements: '✓ Améliorations',
        areasNeedingAttention: '⚠ Domaines nécessitant attention',
        aiRecommendations: 'Recommandations pilotées par l\'IA',
        issueDetails: 'Détails des problèmes',
        fix: 'Corriger',
        url: 'URL',
        domainRating: 'Domain Rating',
        backlinks: 'Backlinks',
        keywords: 'Mots-clés'
      },
      es: {
        reportTitle: 'Informe de Auditoría SEO',
        period: 'Período',
        generated: 'Generado',
        preparedBy: 'Preparado por',
        executiveSummary: 'Resumen ejecutivo',
        competitiveBenchmarking: 'Análisis competitivo',
        yourSite: 'Tu sitio',
        competitors: 'Competidores',
        keyMetrics: 'Métricas clave',
        totalPages: 'Páginas totales',
        openIssues: 'Problemas abiertos',
        criticalIssues: 'Problemas críticos',
        highPriority: 'Alta prioridad',
        mediumPriority: 'Prioridad media',
        progressSinceLastAudit: 'Progreso desde la última auditoría',
        improvements: '✓ Mejoras',
        areasNeedingAttention: '⚠ Áreas que necesitan atención',
        aiRecommendations: 'Recomendaciones impulsadas por IA',
        issueDetails: 'Detalles de problemas',
        fix: 'Corregir',
        url: 'URL',
        domainRating: 'Domain Rating',
        backlinks: 'Backlinks',
        keywords: 'Palabras clave'
      }
    };
    
    const t = translations[language] || translations.en;

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

    // Fetch competitor data
    const competitors = await base44.asServiceRole.entities.Competitor.filter({ site_id, enabled: true });
    const competitorMetrics = competitors
      .filter(c => c.metrics)
      .map(c => ({
        domain: c.domain,
        domain_rating: c.metrics.domain_rating,
        backlinks: c.metrics.backlinks,
        organic_keywords: c.metrics.organic_keywords,
      }));

    // Fetch own site Ahrefs data
    let siteAhrefsData = null;
    try {
      const ahrefsResponse = await base44.asServiceRole.functions.invoke('fetchAhrefsData', { domain: site.domain });
      if (ahrefsResponse.data.success) {
        siteAhrefsData = ahrefsResponse.data;
      }
    } catch (error) {
      console.error('Failed to fetch Ahrefs data:', error);
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
    const competitorContext = competitorMetrics.length > 0 ? `

Competitor Benchmarking (${competitorMetrics.length} competitors):
${siteAhrefsData ? `Your site:
- Domain Rating: ${siteAhrefsData.domainRating}
- Backlinks: ${siteAhrefsData.backlinks}
- Organic Keywords: ${siteAhrefsData.organicKeywords}` : ''}

Competitors average:
- Domain Rating: ${(competitorMetrics.reduce((sum, c) => sum + (c.domain_rating || 0), 0) / competitorMetrics.length).toFixed(1)}
- Backlinks: ${Math.round(competitorMetrics.reduce((sum, c) => sum + (c.backlinks || 0), 0) / competitorMetrics.length)}
- Organic Keywords: ${Math.round(competitorMetrics.reduce((sum, c) => sum + (c.organic_keywords || 0), 0) / competitorMetrics.length)}

Competitive gaps to address:
${competitorMetrics.map(c => `- ${c.domain}: DR ${c.domain_rating}, ${c.backlinks} backlinks, ${c.organic_keywords} keywords`).join('\n')}` : '';

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
${competitorContext}

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

    // Logo if available
    if (template?.logo_url) {
      try {
        const logoResponse = await fetch(template.logo_url);
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        doc.addImage(logoBase64, 'PNG', 20, yPos, 30, 15);
        yPos += 20;
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    }

    // Header
    doc.setFontSize(24);
    doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
    doc.text(t.reportTitle, 20, yPos);
    yPos += 8;

    doc.setFontSize(16);
    doc.text(site.domain, 20, yPos);
    yPos += 12;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t.period}: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`, 20, yPos);
    yPos += 5;
    doc.text(`${t.generated}: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 5;

    if (template?.company_name) {
      doc.text(`${t.preparedBy}: ${template.company_name}`, 20, yPos);
      yPos += 5;
    }

    yPos += 10;

    // Competitor Benchmarking
    if (competitorMetrics.length > 0 && siteAhrefsData) {
      doc.setFontSize(16);
      doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
      doc.text(t.competitiveBenchmarking, 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(0);

      // Your site metrics
      doc.setFont(undefined, 'bold');
      doc.text(`${t.yourSite}:`, 20, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');
      doc.text(`${t.domainRating}: ${siteAhrefsData.domainRating}  |  ${t.backlinks}: ${siteAhrefsData.backlinks.toLocaleString()}  |  ${t.keywords}: ${siteAhrefsData.organicKeywords.toLocaleString()}`, 20, yPos);
      yPos += 10;

      // Competitors
      doc.setFont(undefined, 'bold');
      doc.text(`${t.competitors}:`, 20, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');

      competitorMetrics.slice(0, 5).forEach((comp, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const drDiff = comp.domain_rating - siteAhrefsData.domainRating;
        const drColor = drDiff > 0 ? [220, 38, 38] : [0, 150, 0];
        
        doc.text(`${idx + 1}. ${comp.domain}`, 20, yPos);
        yPos += 5;
        doc.text(`   DR: ${comp.domain_rating}`, 25, yPos);
        doc.setTextColor(drColor[0], drColor[1], drColor[2]);
        doc.text(`(${drDiff > 0 ? '+' : ''}${drDiff})`, 50, yPos);
        doc.setTextColor(0);
        doc.text(`  |  Backlinks: ${comp.backlinks.toLocaleString()}  |  Keywords: ${comp.organic_keywords.toLocaleString()}`, 70, yPos);
        yPos += 6;
      });

      yPos += 10;
    }

    // AI Executive Summary
    if (template?.include_sections?.executive_summary !== false) {
      doc.setFontSize(16);
      doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
      doc.text(t.executiveSummary, 20, yPos);
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
    doc.text(t.keyMetrics, 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(0);
    const metrics = [
      `${t.totalPages}: ${pages.length}`,
      `${t.openIssues}: ${openIssues.length}`,
      `${t.criticalIssues}: ${criticalIssues.length}`,
      `${t.highPriority}: ${highIssues.length}`,
      `${t.mediumPriority}: ${mediumIssues.length}`,
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
      doc.text(t.progressSinceLastAudit, 20, yPos);
      yPos += 10;

      doc.setFontSize(10);

      if (comparisonData.improvements.length > 0) {
        doc.setTextColor(0, 150, 0);
        doc.setFont(undefined, 'bold');
        doc.text(`${t.improvements}:`, 20, yPos);
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
        doc.text(`${t.areasNeedingAttention}:`, 20, yPos);
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
      doc.text(t.aiRecommendations, 20, yPos);
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

    // Issue Details
    if (template?.include_sections?.issue_details !== false) {
      // Critical Issues
      if (criticalIssues.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        doc.text(t.criticalIssues, 20, yPos);
        yPos += 10;

        doc.setFontSize(9);
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
          const msgLines = doc.splitTextToSize(issue.message, 170);
          doc.text(msgLines, 25, yPos);
          yPos += msgLines.length * 4 + 2;

          doc.setTextColor(100);
          doc.text(`${t.url}: ${issue.url.substring(0, 70)}`, 25, yPos);
          yPos += 5;

          doc.setTextColor(0, 100, 0);
          const fixLines = doc.splitTextToSize(`${t.fix}: ${issue.how_to_fix}`, 170);
          doc.text(fixLines, 25, yPos);
          yPos += fixLines.length * 4 + 7;

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
        doc.text(t.highPriority, 20, yPos);
        yPos += 10;

        doc.setFontSize(9);
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
          const msgLines = doc.splitTextToSize(issue.message, 170);
          doc.text(msgLines, 25, yPos);
          yPos += msgLines.length * 4 + 2;

          doc.setTextColor(100);
          doc.text(`${t.url}: ${issue.url.substring(0, 70)}`, 25, yPos);
          yPos += 5;

          doc.setTextColor(0, 100, 0);
          const fixLines = doc.splitTextToSize(`${t.fix}: ${issue.how_to_fix}`, 170);
          doc.text(fixLines, 25, yPos);
          yPos += fixLines.length * 4 + 7;

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
        doc.text(t.mediumPriority, 20, yPos);
        yPos += 10;

        doc.setFontSize(9);
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
          const msgLines = doc.splitTextToSize(issue.message, 170);
          doc.text(msgLines, 25, yPos);
          yPos += msgLines.length * 4 + 2;

          doc.setTextColor(100);
          doc.text(`${t.url}: ${issue.url.substring(0, 70)}`, 25, yPos);
          yPos += 5;

          doc.setTextColor(0, 100, 0);
          const fixLines = doc.splitTextToSize(`${t.fix}: ${issue.how_to_fix}`, 170);
          doc.text(fixLines, 25, yPos);
          yPos += fixLines.length * 4 + 7;

          doc.setTextColor(0);
        });
        yPos += 5;
      }
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