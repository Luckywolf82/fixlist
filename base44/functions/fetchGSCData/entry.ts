import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        const { domain, start_date, end_date } = await req.json();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!domain) {
            return Response.json({ error: 'domain is required' }, { status: 400 });
        }

        // Try to get GSC access token
        let accessToken = null;
        try {
            accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesearchconsole');
        } catch (error) {
            // GSC not connected, return null data
            return Response.json({ 
                success: false,
                connected: false,
                message: 'Google Search Console not connected'
            });
        }

        if (!accessToken) {
            return Response.json({ 
                success: false,
                connected: false,
                message: 'Google Search Console not connected'
            });
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
                    dimensions: ['date'],
                    rowLimit: 1000
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('GSC API error:', error);
            return Response.json({ 
                success: false,
                connected: true,
                error: 'Failed to fetch GSC data', 
                details: error 
            }, { status: response.status });
        }

        const data = await response.json();

        // Fetch top queries
        const queriesResponse = await fetch(
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
                    rowLimit: 25
                })
            }
        );

        let topQueries = [];
        if (queriesResponse.ok) {
            const queriesData = await queriesResponse.json();
            topQueries = queriesData.rows?.sort((a, b) => b.clicks - a.clicks).slice(0, 10).map(row => ({
                query: row.keys[0],
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: (row.ctr * 100).toFixed(2),
                position: row.position.toFixed(1)
            })) || [];
        }

        // Calculate totals
        const totalClicks = data.rows?.reduce((sum, row) => sum + row.clicks, 0) || 0;
        const totalImpressions = data.rows?.reduce((sum, row) => sum + row.impressions, 0) || 0;
        const avgPosition = data.rows?.reduce((sum, row) => sum + row.position, 0) / (data.rows?.length || 1) || 0;
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        // Format daily data
        const dailyData = data.rows?.map(row => ({
            date: row.keys[0],
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: (row.ctr * 100).toFixed(2),
            position: row.position.toFixed(1)
        })) || [];

        return Response.json({
            success: true,
            connected: true,
            totals: {
                clicks: totalClicks,
                impressions: totalImpressions,
                avgPosition: avgPosition.toFixed(1),
                avgCTR: avgCTR.toFixed(2)
            },
            dailyData,
            topQueries
        });
    } catch (error) {
        console.error('Error fetching GSC data:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});