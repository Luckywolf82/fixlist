import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has GSC access token
        let connected = false;
        try {
            const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesearchconsole');
            connected = !!accessToken;
        } catch (error) {
            connected = false;
        }

        return Response.json({ connected });
    } catch (error) {
        console.error('Error checking GSC connection:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});