import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { site_id } = await req.json();

        if (!site_id) {
            return Response.json({ error: 'site_id is required' }, { status: 400 });
        }

        // Get site info
        const site = (await base44.asServiceRole.entities.Site.filter({ id: site_id }))[0];
        if (!site) {
            return Response.json({ error: 'Site not found' }, { status: 404 });
        }

        // Get latest 2 crawls for trend analysis
        const crawls = await base44.asServiceRole.entities.Crawl.filter({ site_id }, "-started_at", 2);
        
        if (crawls.length === 0) {
            return Response.json({ error: 'No crawls found for this site' }, { status: 404 });
        }

        const latestCrawl = crawls[0];
        const previousCrawl = crawls[1];

        // Get issues from latest crawl
        const issues = await base44.asServiceRole.entities.Issue.filter({ 
            crawl_id: latestCrawl.id,
            status: 'open'
        });

        if (issues.length === 0) {
            return Response.json({ 
                success: true,
                prioritized_issues: [],
                summary: 'No open issues found. Your site is in excellent shape!',
                recommendations: []
            });
        }

        // Get previous issues for trend analysis
        let previousIssues = [];
        if (previousCrawl) {
            previousIssues = await base44.asServiceRole.entities.Issue.filter({ 
                crawl_id: previousCrawl.id,
                status: 'open'
            });
        }

        // Group issues by type and severity
        const issueGroups = {};
        issues.forEach(issue => {
            const key = `${issue.type}_${issue.severity}`;
            if (!issueGroups[key]) {
                issueGroups[key] = {
                    type: issue.type,
                    severity: issue.severity,
                    count: 0,
                    examples: []
                };
            }
            issueGroups[key].count++;
            if (issueGroups[key].examples.length < 3) {
                issueGroups[key].examples.push({
                    url: issue.url,
                    message: issue.message,
                    how_to_fix: issue.how_to_fix
                });
            }
        });

        // Calculate trends
        const trends = {};
        if (previousIssues.length > 0) {
            Object.keys(issueGroups).forEach(key => {
                const currentCount = issueGroups[key].count;
                const previousCount = previousIssues.filter(i => 
                    `${i.type}_${i.severity}` === key
                ).length;
                trends[key] = currentCount - previousCount;
            });
        }

        // Prepare data for AI analysis
        const analysisData = Object.values(issueGroups).map(group => ({
            type: group.type,
            severity: group.severity,
            count: group.count,
            trend: trends[`${group.type}_${group.severity}`] || 0,
            examples: group.examples
        }));

        // Use AI to prioritize issues
        const prompt = `You are an SEO expert analyzing website issues. 
        
Site: ${site.domain}
Total open issues: ${issues.length}
${previousCrawl ? `Previous crawl had ${previousIssues.length} open issues` : 'No previous crawl data'}

Issue breakdown:
${JSON.stringify(analysisData, null, 2)}

Analyze these issues and provide:
1. A prioritized list of issue types to fix (top 5-7 priorities)
2. For each priority, explain WHY it's important and the SEO impact
3. An overall strategy summary
4. Quick wins (easy fixes with good impact)

Consider:
- Critical issues should generally be highest priority
- Issues trending upward need attention
- Some high-count medium issues may be more important than low-count critical issues
- Core Web Vitals issues (LCP, CLS, INP) are very important for Google rankings
- Technical SEO issues (missing titles, h1s) hurt rankings significantly
- Broken links damage user experience and crawlability
- Accessibility issues (missing alt text, lang attribute) affect rankings and compliance

Focus on actionable priorities that will have the biggest SEO impact.`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    priorities: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                issue_type: { type: "string" },
                                severity: { type: "string" },
                                priority_rank: { type: "number" },
                                reason: { type: "string" },
                                seo_impact: { type: "string" },
                                affected_count: { type: "number" },
                                estimated_effort: { type: "string" }
                            }
                        }
                    },
                    strategy_summary: { type: "string" },
                    quick_wins: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                issue_type: { type: "string" },
                                why_quick_win: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            prioritized_issues: aiResponse.priorities,
            summary: aiResponse.strategy_summary,
            quick_wins: aiResponse.quick_wins,
            total_issues: issues.length,
            trend: previousCrawl ? issues.length - previousIssues.length : null
        });

    } catch (error) {
        console.error('Error prioritizing issues:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});