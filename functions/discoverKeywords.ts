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
      return Response.json({ error: 'Missing site_id' }, { status: 400 });
    }

    const sites = await base44.entities.Site.filter({ id: site_id });
    const site = sites[0];

    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    // Use AI to discover keywords the site is ranking for
    const prompt = `Analyze the website ${site.domain} and identify ACTUAL keywords it is currently ranking for on Google, based on real search data you can find.

IMPORTANT: Only provide keywords that you can verify the site actually ranks for. Do NOT speculate or invent data.

For each keyword identified:
- The exact keyword/search query that real users search for
- A realistic current ranking position (1-100) based on actual search results you find
- A realistic estimated monthly search volume (use typical ranges for similar queries)
- The specific URL on ${site.domain} that ranks for this keyword
- A brief relevance_reason explaining why this keyword is relevant (reference actual content/industry)

Focus on realistic, verifiable data. If the site is new or has limited visibility, return fewer keywords rather than speculative ones.

Return up to 20 keywords as JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: {
              type: "object",
              properties: {
                keyword: { type: "string" },
                position: { type: "number" },
                search_volume: { type: "number" },
                ranking_url: { type: "string" },
                relevance_reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      site_domain: site.domain,
      discovered_keywords: result.keywords || []
    });

  } catch (error) {
    console.error('Error discovering keywords:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});