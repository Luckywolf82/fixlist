import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, integration_type } = await req.json();

    if (!url || !integration_type) {
      return Response.json({ error: 'Missing url or integration_type' }, { status: 400 });
    }

    // Fetch the website content
    const websiteResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Visit this URL and extract API key information or setup instructions: ${url}
      
      I need you to:
      1. Find where to get an API key or access token
      2. Extract any API endpoint URLs if mentioned
      3. Find setup instructions or getting started guides
      4. Look for authentication method details
      
      Return the information in a structured format.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          api_key_location: {
            type: "string",
            description: "Where to find the API key (e.g., 'Dashboard > Settings > API Keys')"
          },
          api_key_url: {
            type: "string",
            description: "Direct URL to get API key if available"
          },
          instructions: {
            type: "string",
            description: "Brief setup instructions"
          },
          api_endpoint: {
            type: "string",
            description: "Base API endpoint URL if mentioned"
          },
          auth_method: {
            type: "string",
            description: "Authentication method (e.g., 'API Key in header', 'Bearer token')"
          },
          additional_info: {
            type: "string",
            description: "Any other relevant information"
          }
        },
        required: ["api_key_location", "instructions"]
      }
    });

    return Response.json({
      success: true,
      data: websiteResponse
    });

  } catch (error) {
    console.error('Extract integration info error:', error);
    return Response.json({ 
      error: error.message || 'Failed to extract integration info' 
    }, { status: 500 });
  }
});