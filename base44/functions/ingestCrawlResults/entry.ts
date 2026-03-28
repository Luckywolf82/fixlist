import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Ingest crawl results from an external crawler service.
 * 
 * Expected payload:
 * {
 *   "crawl_id": "string",
 *   "pages": [
 *     {
 *       "url": "string",
 *       "status_code": number,
 *       "title": "string",
 *       "meta_description": "string",
 *       "canonical": "string",
 *       "h1": "string",
 *       "h1_count": number,
 *       "word_count_estimate": number,
 *       "load_time_ms": number,
 *       "lcp": number | null,
 *       "cls": number | null,
 *       "inp": number | null,
 *       "images": [{"src": "string", "alt": "string" | null}],
 *       "outdatedElements": ["string"],
 *       "hasLang": boolean,
 *       "ogTitle": "string" | null,
 *       "ogDescription": "string" | null,
 *       "ogImage": "string" | null,
 *       "ogUrl": "string" | null,
 *       "twitterCard": "string" | null,
 *       "twitterTitle": "string" | null,
 *       "twitterDescription": "string" | null,
 *       "twitterImage": "string" | null,
 *       "hasStructuredData": boolean,
 *       "hasFavicon": boolean
 *     }
 *   ],
 *   "links": [
 *     {
 *       "from_url": "string",
 *       "to_url": "string",
 *       "type": "internal" | "external",
 *       "status_code": number
 *     }
 *   ],
 *   "issues": [
 *     {
 *       "type": "string",
 *       "severity": "critical" | "high" | "medium",
 *       "url": "string",
 *       "related_url": "string" | null,
 *       "message": "string",
 *       "how_to_fix": "string"
 *     }
 *   ]
 * }
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify the request is authenticated (optional: add API key validation)
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        const { crawl_id, pages, links, issues } = payload;

        if (!crawl_id) {
            return Response.json({ error: 'crawl_id is required' }, { status: 400 });
        }

        // Verify crawl exists
        const crawls = await base44.asServiceRole.entities.Crawl.filter({ id: crawl_id });
        if (crawls.length === 0) {
            return Response.json({ error: 'Crawl not found' }, { status: 404 });
        }

        let pagesCreated = 0;
        let linksCreated = 0;
        let issuesCreated = 0;

        // Insert pages
        if (pages && pages.length > 0) {
            const pagesToInsert = pages.map(page => ({
                crawl_id,
                url: page.url,
                status_code: page.status_code,
                title: page.title || '',
                meta_description: page.meta_description || '',
                canonical: page.canonical || '',
                h1: page.h1 || '',
                h1_count: page.h1_count || 0,
                word_count_estimate: page.word_count_estimate || 0,
                load_time_ms: page.load_time_ms || 0,
                lcp: page.lcp || null,
                cls: page.cls || null,
                inp: page.inp || null
            }));

            await base44.asServiceRole.entities.Page.bulkCreate(pagesToInsert);
            pagesCreated = pagesToInsert.length;
        }

        // Insert links in batches
        if (links && links.length > 0) {
            const linksToInsert = links.map(link => ({
                crawl_id,
                from_url: link.from_url,
                to_url: link.to_url,
                type: link.type,
                status_code: link.status_code || 0
            }));

            // Batch insert links (100 at a time)
            for (let i = 0; i < linksToInsert.length; i += 100) {
                const batch = linksToInsert.slice(i, i + 100);
                await base44.asServiceRole.entities.Link.bulkCreate(batch);
                linksCreated += batch.length;
            }
        }

        // Insert issues
        if (issues && issues.length > 0) {
            const issuesToInsert = issues.map(issue => ({
                crawl_id,
                type: issue.type,
                severity: issue.severity,
                url: issue.url,
                related_url: issue.related_url || null,
                message: issue.message,
                how_to_fix: issue.how_to_fix,
                status: 'open'
            }));

            await base44.asServiceRole.entities.Issue.bulkCreate(issuesToInsert);
            issuesCreated = issuesToInsert.length;
        }

        // Update crawl status
        await base44.asServiceRole.entities.Crawl.update(crawl_id, {
            status: 'done',
            finished_at: new Date().toISOString(),
            pages_crawled: pagesCreated
        });

        return Response.json({
            success: true,
            pages_created: pagesCreated,
            links_created: linksCreated,
            issues_created: issuesCreated
        });

    } catch (error) {
        console.error('Error ingesting crawl results:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});