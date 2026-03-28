import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all organizations
        const organizations = await base44.asServiceRole.entities.Organization.list();

        const now = new Date();
        let resetCount = 0;

        for (const org of organizations) {
            const lastReset = org.last_reset_date ? new Date(org.last_reset_date) : new Date(org.created_date);
            
            // Check if it's been more than a month since last reset
            const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);
            
            if (daysSinceReset >= 30) {
                await base44.asServiceRole.entities.Organization.update(org.id, {
                    crawls_this_month: 0,
                    last_reset_date: now.toISOString(),
                });
                resetCount++;
            }
        }

        return Response.json({
            success: true,
            message: `Reset crawl counts for ${resetCount} organizations`,
            resetCount,
        });
    } catch (error) {
        console.error('Monthly reset error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});