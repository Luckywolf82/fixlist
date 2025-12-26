import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { domain, start_date, end_date } = await req.json();

        if (!domain) {
            return Response.json({ error: 'domain is required' }, { status: 400 });
        }

        // Get GSC access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesearchconsole');

        if (!accessToken) {
            return Response.json({ error: 'Google Search Console not connected' }, { status: 401 });
        }

        const siteUrl = `sc-domain:${domain}`;
        
        // Fetch search analytics data
        const response = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startDate: start_date,
                    endDate: end_date,
                    dimensions: ['query'],
                    rowLimit: 25000
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('GSC API error:', error);
            return Response.json({ error: 'Failed to fetch GSC data', details: error }, { status: response.status });
        }

        const data = await response.json();

        // Calculate totals
        const totalClicks = data.rows?.reduce((sum, row) => sum + row.clicks, 0) || 0;
        const totalImpressions = data.rows?.reduce((sum, row) => sum + row.impressions, 0) || 0;
        const avgPosition = data.rows?.reduce((sum, row) => sum + row.position, 0) / (data.rows?.length || 1) || 0;
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        // Get top queries
        const topQueries = data.rows?.sort((a, b) => b.clicks - a.clicks).slice(0, 10) || [];

        return Response.json({
            success: true,
            totals: {
                clicks: totalClicks,
                impressions: totalImpressions,
                avgPosition: avgPosition.toFixed(1),
                avgCTR: avgCTR.toFixed(2)
            },
            topQueries: topQueries.map(row => ({
                query: row.keys[0],
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: row.ctr.toFixed(2),
                position: row.position.toFixed(1)
            }))
        });
    } catch (error) {
        console.error('Error fetching GSC data:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});