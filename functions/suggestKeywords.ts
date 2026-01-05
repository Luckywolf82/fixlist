import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { site_id, niche_description } = await req.json();

    if (!site_id) {
      return Response.json({ error: 'Missing site_id' }, { status: 400 });
    }

    const sites = await base44.entities.Site.filter({ id: site_id });
    const site = sites[0];

    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    // Use AI to suggest relevant keywords
    const prompt = `Analyze the website ${site.domain}${niche_description ? ` which is about: ${niche_description}` : ''}.
    
Suggest 20 highly relevant keywords/search queries that this website should target and try to rank for.

For each suggested keyword:
- The keyword/search query
- Estimated monthly search volume
- Estimated difficulty (low/medium/high)
- Why this keyword is relevant for this site

Focus on keywords with good search volume but achievable competition. Return as JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                keyword: { type: "string" },
                search_volume: { type: "number" },
                difficulty: { type: "string" },
                relevance_reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      site_domain: site.domain,
      suggested_keywords: result.suggestions || []
    });

  } catch (error) {
    console.error('Error suggesting keywords:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});