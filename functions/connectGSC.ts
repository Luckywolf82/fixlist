import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return message to use the authorization button
        return Response.json({ 
            message: 'Please authorize Google Search Console through the Settings page',
            authUrl: null 
        });
    } catch (error) {
        console.error('Error connecting GSC:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});