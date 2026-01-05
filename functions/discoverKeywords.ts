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
    const prompt = `Analyze the website ${site.domain} and find what keywords it's currently ranking for on Google.
    
For each keyword found:
- The actual keyword/search query
- Estimated current ranking position (1-100)
- Estimated monthly search volume
- The URL on the site that ranks for this keyword

Return the top 20 most relevant keywords as JSON.`;

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
                ranking_url: { type: "string" }
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