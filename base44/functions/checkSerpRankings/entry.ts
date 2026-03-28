import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyword_id, keyword, site_domain, target_url } = await req.json();

    if (!keyword || !site_domain) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Use Google search via LLM with web context
    const searchPrompt = `Search for: "${keyword}" and return the top 100 search results. 
For each result, provide: position number, URL, and title.
Format as JSON array: [{"position": 1, "url": "https://example.com", "title": "Example Title", "snippet": "Description"}]`;

    const searchResults = await base44.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                position: { type: "number" },
                url: { type: "string" },
                title: { type: "string" },
                snippet: { type: "string" }
              }
            }
          }
        }
      }
    });

    const results = searchResults.results || [];
    
    // Find position for the site domain
    let position = null;
    let foundUrl = null;
    let snippet = null;

    for (const result of results) {
      const resultUrl = result.url.toLowerCase();
      const domain = site_domain.toLowerCase();
      
      // Check if result matches the site domain
      if (resultUrl.includes(domain)) {
        // If target_url is specified, check for exact match
        if (target_url && resultUrl.includes(target_url.toLowerCase())) {
          position = result.position;
          foundUrl = result.url;
          snippet = result.snippet;
          break;
        } else if (!target_url) {
          // If no target URL, take first result from domain
          position = result.position;
          foundUrl = result.url;
          snippet = result.snippet;
          break;
        }
      }
    }

    // Update keyword record if keyword_id provided
    if (keyword_id) {
      const keywords = await base44.asServiceRole.entities.Keyword.filter({ id: keyword_id });
      const keywordRecord = keywords[0];

      if (keywordRecord) {
        // Update keyword with new position
        await base44.asServiceRole.entities.Keyword.update(keyword_id, {
          previous_position: keywordRecord.current_position,
          current_position: position,
          best_position: position && (!keywordRecord.best_position || position < keywordRecord.best_position) 
            ? position 
            : keywordRecord.best_position,
          last_checked: new Date().toISOString()
        });

        // Save history
        await base44.asServiceRole.entities.KeywordHistory.create({
          keyword_id: keyword_id,
          position: position,
          url_found: foundUrl,
          snippet: snippet,
          checked_at: new Date().toISOString()
        });
      }
    }

    return Response.json({
      keyword,
      position,
      url: foundUrl,
      snippet,
      total_results: results.length,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking SERP:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});