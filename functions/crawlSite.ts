import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { parseHTML } from 'npm:linkedom@0.18.5';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { site_id } = await req.json();

        if (!site_id) {
            return Response.json({ error: 'site_id is required' }, { status: 400 });
        }

        // Get the site
        const sites = await base44.asServiceRole.entities.Site.filter({ id: site_id });
        const site = sites[0];

        if (!site) {
            return Response.json({ error: 'Site not found' }, { status: 404 });
        }

        // Create a new crawl
        const crawl = await base44.asServiceRole.entities.Crawl.create({
            site_id: site_id,
            status: 'running',
            started_at: new Date().toISOString(),
            pages_crawled: 0
        });

        // Start crawling in the background (don't await)
        crawlWebsite(base44.asServiceRole, site, crawl.id).catch(console.error);

        return Response.json({
            success: true,
            crawl_id: crawl.id,
            message: 'Crawl started'
        });

    } catch (error) {
        console.error('Error starting crawl:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function crawlWebsite(base44ServiceRole, site, crawlId) {
    const domain = site.domain;
    const baseUrl = `https://${domain}`;
    const visitedUrls = new Set();
    const urlsToVisit = [baseUrl];
    const maxPages = 50; // Limit for demo purposes
    let pagesCrawled = 0;

    try {
        while (urlsToVisit.length > 0 && pagesCrawled < maxPages) {
            const url = urlsToVisit.shift();
            
            if (visitedUrls.has(url)) continue;
            visitedUrls.add(url);

            try {
                // Fetch the page
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Fixlist-Crawler/1.0'
                    },
                    redirect: 'follow'
                });

                const html = await response.text();
                const { document } = parseHTML(html);

                // Extract SEO elements
                const title = document.querySelector('title')?.textContent?.trim() || '';
                const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
                const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
                const h1Elements = document.querySelectorAll('h1');
                const h1 = h1Elements[0]?.textContent?.trim() || '';
                const h1Count = h1Elements.length;
                
                // Estimate word count
                const bodyText = document.body?.textContent || '';
                const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;

                // Create page record
                await base44ServiceRole.entities.Page.create({
                    crawl_id: crawlId,
                    url: url,
                    status_code: response.status,
                    title: title,
                    meta_description: metaDesc,
                    canonical: canonical,
                    h1: h1,
                    h1_count: h1Count,
                    word_count_estimate: wordCount
                });

                pagesCrawled++;

                // Detect issues
                const issues = [];

                if (!title) {
                    issues.push({
                        type: 'missing_title',
                        severity: 'critical',
                        message: 'Missing page title',
                        how_to_fix: 'Add a <title> tag in the <head> section with a descriptive, unique title (50-60 characters recommended).'
                    });
                }

                if (title && title.length > 60) {
                    issues.push({
                        type: 'long_title',
                        severity: 'medium',
                        message: `Title too long (${title.length} characters)`,
                        how_to_fix: 'Shorten the title to 50-60 characters to avoid truncation in search results.'
                    });
                }

                if (!metaDesc) {
                    issues.push({
                        type: 'missing_meta_description',
                        severity: 'high',
                        message: 'Missing meta description',
                        how_to_fix: 'Add a <meta name="description" content="..."> tag with a compelling description (150-160 characters recommended).'
                    });
                }

                if (metaDesc && metaDesc.length > 160) {
                    issues.push({
                        type: 'long_meta_description',
                        severity: 'medium',
                        message: `Meta description too long (${metaDesc.length} characters)`,
                        how_to_fix: 'Shorten the meta description to 150-160 characters to avoid truncation in search results.'
                    });
                }

                if (h1Count === 0) {
                    issues.push({
                        type: 'missing_h1',
                        severity: 'high',
                        message: 'Missing H1 heading',
                        how_to_fix: 'Add one <h1> tag to the page with the main heading or topic of the page.'
                    });
                } else if (h1Count > 1) {
                    issues.push({
                        type: 'multiple_h1',
                        severity: 'medium',
                        message: `Multiple H1 tags found (${h1Count})`,
                        how_to_fix: 'Use only one <h1> tag per page. Convert additional H1s to <h2> or other heading levels.'
                    });
                }

                if (wordCount < 300) {
                    issues.push({
                        type: 'thin_content',
                        severity: 'medium',
                        message: `Low word count (${wordCount} words)`,
                        how_to_fix: 'Add more valuable content. Aim for at least 300-500 words to provide comprehensive information.'
                    });
                }

                if (response.status !== 200) {
                    issues.push({
                        type: 'non_200_status',
                        severity: 'high',
                        message: `Non-200 status code: ${response.status}`,
                        how_to_fix: 'Ensure the page returns a 200 OK status code. Fix server errors or redirect issues.'
                    });
                }

                // Save issues
                for (const issue of issues) {
                    await base44ServiceRole.entities.Issue.create({
                        crawl_id: crawlId,
                        type: issue.type,
                        severity: issue.severity,
                        url: url,
                        message: issue.message,
                        how_to_fix: issue.how_to_fix,
                        status: 'open'
                    });
                }

                // Find internal links to crawl
                const links = document.querySelectorAll('a[href]');
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (!href) continue;

                    let absoluteUrl;
                    try {
                        absoluteUrl = new URL(href, url).href;
                    } catch {
                        continue;
                    }

                    // Only crawl same domain
                    if (absoluteUrl.startsWith(baseUrl) && !visitedUrls.has(absoluteUrl) && !urlsToVisit.includes(absoluteUrl)) {
                        urlsToVisit.push(absoluteUrl);
                    }
                }

                // Update crawl progress
                await base44ServiceRole.entities.Crawl.update(crawlId, {
                    pages_crawled: pagesCrawled
                });

            } catch (error) {
                console.error(`Error crawling ${url}:`, error);
                
                // Still create a page record with error
                await base44ServiceRole.entities.Page.create({
                    crawl_id: crawlId,
                    url: url,
                    status_code: 0,
                    title: '',
                    meta_description: '',
                    canonical: '',
                    h1: '',
                    h1_count: 0,
                    word_count_estimate: 0
                });

                await base44ServiceRole.entities.Issue.create({
                    crawl_id: crawlId,
                    type: 'crawl_error',
                    severity: 'critical',
                    url: url,
                    message: `Failed to crawl page: ${error.message}`,
                    how_to_fix: 'Check if the page is accessible and loading properly. Verify there are no server errors or blocks.',
                    status: 'open'
                });

                pagesCrawled++;
            }
        }

        // Mark crawl as done
        await base44ServiceRole.entities.Crawl.update(crawlId, {
            status: 'done',
            finished_at: new Date().toISOString(),
            pages_crawled: pagesCrawled
        });

    } catch (error) {
        console.error('Crawl failed:', error);
        
        // Mark crawl as failed
        await base44ServiceRole.entities.Crawl.update(crawlId, {
            status: 'failed',
            finished_at: new Date().toISOString(),
            pages_crawled: pagesCrawled
        });
    }
}