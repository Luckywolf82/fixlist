import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        const { domain } = await req.json();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!domain) {
            return Response.json({ error: 'domain is required' }, { status: 400 });
        }

        const apiKey = user.ahrefs_api_key;
        if (!apiKey) {
            return Response.json({ error: 'Ahrefs API key not configured' }, { status: 401 });
        }

        // Fetch domain overview
        const overviewResponse = await fetch(
            `https://api.ahrefs.com/v3/site-explorer/domain-rating?target=${encodeURIComponent(domain)}&token=${apiKey}`
        );

        if (!overviewResponse.ok) {
            const error = await overviewResponse.text();
            console.error('Ahrefs API error:', error);
            return Response.json({ error: 'Failed to fetch Ahrefs data', details: error }, { status: overviewResponse.status });
        }

        const overviewData = await overviewResponse.json();

        // Fetch backlinks overview
        const backlinksResponse = await fetch(
            `https://api.ahrefs.com/v3/site-explorer/metrics-extended?target=${encodeURIComponent(domain)}&token=${apiKey}`
        );

        let backlinksData = null;
        if (backlinksResponse.ok) {
            backlinksData = await backlinksResponse.json();
        }

        // Fetch top pages
        const topPagesResponse = await fetch(
            `https://api.ahrefs.com/v3/site-explorer/top-pages?target=${encodeURIComponent(domain)}&token=${apiKey}&limit=10`
        );

        let topPages = [];
        if (topPagesResponse.ok) {
            const topPagesData = await topPagesResponse.json();
            topPages = topPagesData.pages || [];
        }

        return Response.json({
            success: true,
            domainRating: overviewData.domain_rating || 0,
            referringDomains: backlinksData?.referring_domains || 0,
            backlinks: backlinksData?.backlinks || 0,
            organicKeywords: backlinksData?.organic_keywords || 0,
            organicTraffic: backlinksData?.organic_traffic || 0,
            topPages: topPages.slice(0, 5).map(page => ({
                url: page.url,
                traffic: page.traffic || 0,
                keywords: page.keywords || 0
            }))
        });
    } catch (error) {
        console.error('Error fetching Ahrefs data:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});