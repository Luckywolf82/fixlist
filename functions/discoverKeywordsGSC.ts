import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getAccessToken() {
  const clientId = Deno.env.get('GSC_CLIENT_ID');
  const clientSecret = Deno.env.get('GSC_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GSC_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GSC credentials not configured. Please set them in SuperAdmin.');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh GSC access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { site_id } = await req.json();

    if (!site_id) {
      return Response.json({ error: 'Missing site_id' }, { status: 400 });
    }

    const sites = await base44.entities.Site.filter({ id: site_id });
    const site = sites[0];

    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Normalize site domain for GSC API
    let siteUrl = site.domain;
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      siteUrl = 'https://' + siteUrl;
    }
    // Remove trailing slash
    siteUrl = siteUrl.replace(/\/$/, '');

    // Query GSC API for keyword performance data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // Last 90 days

    const gscResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query', 'page'],
          rowLimit: 100,
          aggregationType: 'auto'
        })
      }
    );

    if (!gscResponse.ok) {
      const errorText = await gscResponse.text();
      throw new Error(`GSC API error: ${errorText}`);
    }

    const gscData = await gscResponse.json();

    // Transform GSC data into keyword format
    const keywords = (gscData.rows || []).map(row => ({
      keyword: row.keys[0], // query
      position: Math.round(row.position),
      search_volume: Math.round(row.impressions / 30), // Rough monthly estimate
      ranking_url: row.keys[1], // page URL
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr
    }));

    return Response.json({
      site_domain: site.domain,
      discovered_keywords: keywords,
      source: 'google_search_console'
    });

  } catch (error) {
    console.error('Error discovering keywords from GSC:', error);
    return Response.json({ 
      error: error.message,
      details: 'Make sure GSC API credentials are configured in SuperAdmin and the site is verified in Google Search Console'
    }, { status: 500 });
  }
});