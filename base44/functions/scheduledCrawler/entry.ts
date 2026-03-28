import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function should be called periodically (e.g., every hour by a cron job)
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        console.log(`Scheduler running at ${now.toISOString()}`);

        // Get all sites with scheduling enabled
        const allSites = await base44.asServiceRole.entities.Site.list();
        const scheduledSites = allSites.filter(site => site.schedule_enabled);
        
        console.log(`Found ${scheduledSites.length} sites with scheduling enabled`);

        const crawlsStarted = [];

        for (const site of scheduledSites) {
            const [scheduleHour, scheduleMinute] = site.schedule_time.split(':').map(Number);
            
            // Check if it's time to crawl (within 1 hour window)
            const isTimeMatch = currentHour === scheduleHour && currentMinute >= scheduleMinute && currentMinute < scheduleMinute + 60;
            
            // Check if next_crawl_at is set and if we're past it
            let shouldCrawl = false;
            
            if (site.next_crawl_at) {
                const nextCrawl = new Date(site.next_crawl_at);
                shouldCrawl = now >= nextCrawl;
            } else if (isTimeMatch) {
                shouldCrawl = true;
            }

            if (shouldCrawl) {
                console.log(`Starting crawl for ${site.domain}`);
                
                try {
                    // Start the crawl
                    await base44.asServiceRole.functions.invoke('crawlSite', { 
                        site_id: site.id,
                        render_js: false 
                    });

                    // Calculate next crawl time
                    const nextCrawl = new Date();
                    nextCrawl.setHours(scheduleHour, scheduleMinute, 0, 0);
                    
                    if (site.schedule_frequency === 'daily') {
                        nextCrawl.setDate(nextCrawl.getDate() + 1);
                    } else if (site.schedule_frequency === 'weekly') {
                        nextCrawl.setDate(nextCrawl.getDate() + 7);
                    } else if (site.schedule_frequency === 'monthly') {
                        nextCrawl.setMonth(nextCrawl.getMonth() + 1);
                    }

                    // Update next_crawl_at
                    await base44.asServiceRole.entities.Site.update(site.id, {
                        next_crawl_at: nextCrawl.toISOString()
                    });

                    crawlsStarted.push(site.domain);
                    console.log(`Crawl started for ${site.domain}, next crawl at ${nextCrawl.toISOString()}`);
                } catch (error) {
                    console.error(`Failed to start crawl for ${site.domain}:`, error);
                }
            }
        }

        return Response.json({ 
            success: true, 
            crawls_started: crawlsStarted.length,
            sites: crawlsStarted
        });

    } catch (error) {
        console.error('Scheduler error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});