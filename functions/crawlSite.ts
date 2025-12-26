import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { parseHTML } from 'npm:linkedom@0.18.5';
import { chromium } from 'npm:playwright@1.48.0';

const USER_AGENT = 'FixlistBot/1.0';

let _browser = null;

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { site_id, render_js } = await req.json();

        if (!site_id) {
            return Response.json({ error: 'site_id is required' }, { status: 400 });
        }

        const sites = await base44.asServiceRole.entities.Site.filter({ id: site_id });
        const site = sites[0];

        if (!site) {
            return Response.json({ error: 'Site not found' }, { status: 404 });
        }

        const crawl = await base44.asServiceRole.entities.Crawl.create({
            site_id: site_id,
            status: 'running',
            started_at: new Date().toISOString(),
            pages_crawled: 0
        });

        crawlWebsite(base44.asServiceRole, site, crawl.id, !!render_js).catch(console.error);

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

// ============ URL Normalization ============
function normalizeUrl(raw) {
    try {
        const u = new URL(raw);
        u.hash = '';
        u.hostname = u.hostname.toLowerCase();
        
        if (u.pathname !== '/' && u.pathname.endsWith('/')) {
            u.pathname = u.pathname.slice(0, -1);
        }
        
        return u.toString();
    } catch {
        return null;
    }
}

function isSameOrigin(url, domain) {
    try {
        const u = new URL(url);
        const d = new URL(domain);
        return u.hostname === d.hostname;
    } catch {
        return false;
    }
}

function toAbsoluteUrl(href, baseUrl) {
    const trimmed = href.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') || trimmed.startsWith('javascript:')) return null;

    try {
        const abs = new URL(trimmed, baseUrl).toString();
        return normalizeUrl(abs);
    } catch {
        return null;
    }
}

// ============ Robots.txt Support ============
async function loadRobots(domain) {
    const robotsUrl = normalizeUrl(new URL('/robots.txt', domain).toString());
    if (!robotsUrl) return { allowed: () => true };

    try {
        const response = await fetch(robotsUrl, {
            headers: { 'User-Agent': USER_AGENT },
            redirect: 'follow'
        });

        if (response.status >= 400) return { allowed: () => true };

        const txt = await response.text();
        const rules = parseRobotsTxt(txt);

        return {
            allowed: (url) => isAllowedByRobots(url, domain, rules)
        };
    } catch {
        return { allowed: () => true };
    }
}

function parseRobotsTxt(txt) {
    const lines = txt.split('\n').map(l => l.trim());
    let inStar = false;
    const disallow = [];

    for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const [kRaw, vRaw] = line.split(':');
        const k = (kRaw || '').trim().toLowerCase();
        const v = (vRaw || '').trim();

        if (k === 'user-agent') {
            inStar = v === '*';
            continue;
        }
        if (inStar && k === 'disallow' && v) {
            disallow.push(v);
        }
    }
    return { disallow };
}

function isAllowedByRobots(url, domain, rules) {
    try {
        const u = new URL(url);
        const d = new URL(domain);
        if (u.hostname !== d.hostname) return true;

        const path = u.pathname || '/';
        for (const dis of rules.disallow) {
            if (dis === '/') return false;
            if (dis && path.startsWith(dis)) return false;
        }
        return true;
    } catch {
        return true;
    }
}

// ============ HTML Parsing ============
function parseHtml(url, html) {
    const { document } = parseHTML(html);

    const title = document.querySelector('title')?.textContent?.trim() || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
    const h1Elements = document.querySelectorAll('h1');
    const h1 = h1Elements[0]?.textContent?.trim() || '';
    const h1Count = h1Elements.length;

    const bodyText = document.body?.textContent || '';
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;

    const hrefs = [];
    document.querySelectorAll('a[href]').forEach(el => {
        const href = el.getAttribute('href');
        if (!href) return;
        const abs = toAbsoluteUrl(href, url);
        if (abs) hrefs.push(abs);
    });

    // Parse images
    const images = [];
    document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt');
        images.push({ src, alt });
    });

    // Check for outdated HTML elements
    const outdatedElements = [];
    const deprecatedTags = ['font', 'center', 'marquee', 'blink', 'big', 'strike', 'tt'];
    for (const tag of deprecatedTags) {
        if (document.querySelector(tag)) {
            outdatedElements.push(tag);
        }
    }

    // Check for lang attribute on html element
    const htmlEl = document.querySelector('html');
    const hasLang = htmlEl ? htmlEl.hasAttribute('lang') : false;

    return { title, metaDesc, canonical, h1, h1Count, wordCount, hrefs, images, outdatedElements, hasLang };
}

// ============ SEO Rules ============
function checkPageIssues(page) {
    const issues = [];

    if (!page.title) {
        issues.push({
            type: 'missing_title',
            severity: 'critical',
            message: 'Siden mangler <title>-tag',
            how_to_fix: 'Legg til en unik og beskrivende <title> for siden (anbefalt 20-60 tegn).'
        });
    } else {
        const len = page.title.length;
        if (len < 20 || len > 60) {
            issues.push({
                type: 'title_length',
                severity: 'medium',
                message: `Title-lengde er ${len} tegn (anbefalt 20-60)`,
                how_to_fix: 'Juster title til anbefalt lengde for bedre visning i søkeresultater.'
            });
        }
    }

    if (!page.h1) {
        issues.push({
            type: 'missing_h1',
            severity: 'critical',
            message: 'Siden mangler <h1>',
            how_to_fix: 'Legg til én tydelig hovedoverskrift (<h1>) som beskriver sidens tema.'
        });
    } else if (page.h1_count > 1) {
        issues.push({
            type: 'multiple_h1',
            severity: 'medium',
            message: `Siden har ${page.h1_count} stk <h1>`,
            how_to_fix: 'Bruk kun én <h1> per side. Flytt øvrige overskrifter til <h2> eller <h3>.'
        });
    }

    if (!page.meta_description) {
        issues.push({
            type: 'missing_meta_description',
            severity: 'high',
            message: 'Siden mangler meta description',
            how_to_fix: 'Legg til en beskrivelse (70-160 tegn) som oppsummerer sidens innhold.'
        });
    } else {
        const len = page.meta_description.length;
        if (len < 70 || len > 160) {
            issues.push({
                type: 'meta_description_length',
                severity: 'medium',
                message: `Meta description er ${len} tegn (anbefalt 70-160)`,
                how_to_fix: 'Juster lengden for optimal visning i søkeresultater.'
            });
        }
    }

    if (page.canonical && page.canonical !== page.url) {
        issues.push({
            type: 'canonical_mismatch',
            severity: 'high',
            message: 'Canonical peker til en annen URL',
            related_url: page.canonical,
            how_to_fix: 'Sjekk at canonical-URL er korrekt og peker til riktig side.'
        });
    }

    if (page.word_count_estimate < 300) {
        issues.push({
            type: 'thin_content',
            severity: 'medium',
            message: `Lavt ordantall (${page.word_count_estimate} ord)`,
            how_to_fix: 'Legg til mer verdifullt innhold. Mål for minst 300-500 ord.'
        });
    }

    if (page.status_code !== 200) {
        issues.push({
            type: 'non_200_status',
            severity: 'high',
            message: `HTTP status ${page.status_code}`,
            how_to_fix: 'Sørg for at siden returnerer 200 OK. Fiks serverfeil eller redirect-problemer.'
        });
    }

    // Check for missing alt text on images
    if (page.images) {
        const missingAlt = page.images.filter(img => img.alt === null || img.alt.trim() === '');
        if (missingAlt.length > 0) {
            issues.push({
                type: 'missing_image_alt',
                severity: 'high',
                message: `${missingAlt.length} bilde(r) mangler alt-tekst`,
                how_to_fix: 'Legg til beskrivende alt-tekst på alle bilder for bedre tilgjengelighet og SEO. Alt-tekst skal beskrive bildets innhold og hensikt.'
            });
        }
    }

    // Check for outdated HTML elements
    if (page.outdatedElements && page.outdatedElements.length > 0) {
        issues.push({
            type: 'outdated_html',
            severity: 'medium',
            message: `Bruker utdaterte HTML-elementer: ${page.outdatedElements.join(', ')}`,
            how_to_fix: `Erstatt utdaterte elementer med moderne CSS/HTML5. F.eks.: <font> → CSS styling, <center> → text-align eller flexbox, <strike> → <del> eller <s>.`
        });
    }

    // Check for WCAG - missing lang attribute
    if (page.hasLang === false) {
        issues.push({
            type: 'missing_lang_attribute',
            severity: 'high',
            message: 'HTML-elementet mangler lang-attributt (WCAG 3.1.1)',
            how_to_fix: 'Legg til lang="nb" (eller relevant språkkode) på <html>-taggen. Dette er kritisk for skjermlesere og tilgjengelighet.'
        });
    }

    // Check for readability - very long pages
    if (page.word_count_estimate > 3000) {
        issues.push({
            type: 'excessive_content',
            severity: 'medium',
            message: `Svært høyt ordantall (${page.word_count_estimate} ord) kan påvirke lesbarhet`,
            how_to_fix: 'Vurder å dele innholdet opp i flere undersider, bruke innholdsfortegnelse, eller gruppere i seksjoner med navigasjon for bedre brukeropplevelse.'
        });
    }

    return issues;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ Playwright Browser Management ============
async function getBrowser() {
    if (_browser) return _browser;
    _browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    return _browser;
}

async function fetchHtmlRendered(url, userAgent, opts = {}) {
    const timeoutMs = opts.timeoutMs || 20000;
    const waitUntil = opts.waitUntil || 'domcontentloaded';
    const extraWaitMs = opts.extraWaitMs || 800;
    const blockResources = opts.blockResources !== false;

    const browser = await getBrowser();
    const context = await browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 720 }
    });

    let page = null;
    try {
        page = await context.newPage();

        if (blockResources) {
            await page.route('**/*', (route) => {
                const type = route.request().resourceType();
                if (type === 'image' || type === 'font' || type === 'media') {
                    return route.abort();
                }
                return route.continue();
            });
        }

        let mainStatus = 0;
        page.on('response', (resp) => {
            if (resp.url() === page?.url()) {
                mainStatus = resp.status();
            }
        });

        const resp = await page.goto(url, { waitUntil, timeout: timeoutMs });
        const statusCode = resp?.status() || mainStatus || 0;

        if (extraWaitMs > 0) {
            await page.waitForTimeout(extraWaitMs);
        }

        const finalUrl = page.url();
        const html = await page.content();
        
        await context.close();
        return { statusCode, finalUrl, html, timedOut: false };
    } catch (e) {
        await context.close();
        const finalUrl = page?.url?.() || url;
        const msg = String(e?.message || e);
        const timedOut = msg.toLowerCase().includes('timeout');
        return { statusCode: 0, finalUrl, html: null, timedOut };
    }
}

async function closeRenderer() {
    if (_browser) {
        await _browser.close();
        _browser = null;
    }
}

// ============ Main Crawler ============
async function crawlWebsite(base44ServiceRole, site, crawlId, renderJs = false) {
    const domain = `https://${site.domain}`;
    const maxPages = 50;
    const useJs = renderJs;
    let pagesCrawled = 0;

    const queue = [];
    const seen = new Set();
    const pages = [];
    const links = [];

    const seed = normalizeUrl(domain);
    if (!seed) throw new Error('Invalid domain');

    queue.push(seed);
    seen.add(seed);

    const robots = await loadRobots(domain);

    try {
        while (queue.length > 0 && pagesCrawled < maxPages) {
            const url = queue.shift();

            if (!robots.allowed(url)) {
                console.log(`Skipped by robots.txt: ${url}`);
                continue;
            }

            await sleep(200); // Polite crawling

            let statusCode = 0;
            let html = null;
            let finalUrl = url;
            let loadTimeMs = 0;
            const fetchStart = Date.now();

            try {
                console.log(`Fetching page: ${url}, useJs: ${useJs}`);
                if (useJs) {
                    const result = await fetchHtmlRendered(url, USER_AGENT, {
                        timeoutMs: 20000,
                        waitUntil: 'domcontentloaded',
                        extraWaitMs: 800,
                        blockResources: true
                    });
                    statusCode = result.statusCode;
                    html = result.html;
                    finalUrl = result.finalUrl;
                    console.log(`JS Render result - Status: ${statusCode}, HTML length: ${html?.length || 0}`);
                    
                    if (result.timedOut) {
                        console.log(`Timeout rendering ${url}`);
                    }
                } else {
                    const response = await fetch(url, {
                        headers: { 'User-Agent': USER_AGENT },
                        redirect: 'follow'
                    });

                    statusCode = response.status;
                    const contentType = response.headers.get('content-type') || '';
                    console.log(`Fetch result - Status: ${statusCode}, Content-Type: ${contentType}`);
                    
                    if (contentType.includes('text/html')) {
                        html = await response.text();
                        console.log(`HTML received, length: ${html.length}`);
                    } else {
                        console.log(`Skipping non-HTML content`);
                    }
                }
                
                loadTimeMs = Date.now() - fetchStart;
            } catch (error) {
                console.error(`Fetch error for ${url}:`, error.message);
                loadTimeMs = Date.now() - fetchStart;
            }

            // Handle redirects from JS rendering
            if (finalUrl !== url && !seen.has(finalUrl)) {
                const normalized = normalizeUrl(finalUrl);
                if (normalized && normalized !== url) {
                    url = normalized;
                    seen.add(normalized);
                }
            }

            let page = {
                crawl_id: crawlId,
                url,
                status_code: statusCode,
                title: '',
                meta_description: '',
                canonical: '',
                h1: '',
                h1_count: 0,
                word_count_estimate: 0,
                load_time_ms: loadTimeMs
            };

            if (html) {
                console.log(`Parsing HTML for ${url}`);
                const parsed = parseHtml(url, html);
                page.title = parsed.title;
                page.meta_description = parsed.metaDesc;
                page.canonical = parsed.canonical;
                page.h1 = parsed.h1;
                page.h1_count = parsed.h1Count;
                page.word_count_estimate = parsed.wordCount;
                page.images = parsed.images;
                page.outdatedElements = parsed.outdatedElements;
                page.hasLang = parsed.hasLang;
                console.log(`Parsed - Title: "${page.title}", H1: "${page.h1}", Words: ${page.word_count_estimate}`);

                // Collect links
                for (const toUrl of parsed.hrefs) {
                    const type = isSameOrigin(toUrl, domain) ? 'internal' : 'external';
                    links.push({
                        crawl_id: crawlId,
                        from_url: url,
                        to_url: toUrl,
                        type,
                        status_code: 0
                    });

                    if (type === 'internal' && !seen.has(toUrl)) {
                        seen.add(toUrl);
                        queue.push(toUrl);
                    }
                }

                // Page-level issues
                const pageIssues = checkPageIssues(page);
                console.log(`Page: ${page.url} - Found ${pageIssues.length} issues`);
                for (const issue of pageIssues) {
                    console.log(`  - ${issue.severity.toUpperCase()}: ${issue.type} - ${issue.message}`);
                    try {
                        await base44ServiceRole.entities.Issue.create({
                            crawl_id: crawlId,
                            type: issue.type,
                            severity: issue.severity,
                            url: page.url,
                            related_url: issue.related_url || null,
                            message: issue.message,
                            how_to_fix: issue.how_to_fix,
                            status: 'open'
                        });
                        console.log(`  ✓ Issue created successfully`);
                    } catch (err) {
                        console.error(`  ✗ Failed to create issue:`, err.message);
                    }
                }
            } else {
                console.log(`No HTML for ${url} - skipping issue checks`);
            }

            await base44ServiceRole.entities.Page.create(page);
            pages.push(page);
            pagesCrawled++;

            // Batch insert links
            if (links.length >= 100) {
                await base44ServiceRole.entities.Link.bulkCreate(links.splice(0, 100));
            }

            await base44ServiceRole.entities.Crawl.update(crawlId, {
                pages_crawled: pagesCrawled
            });
        }

        // Final link flush
        if (links.length > 0) {
            await base44ServiceRole.entities.Link.bulkCreate(links);
        }

        // ============ Global Rules ============
        console.log(`Crawl complete. Total pages: ${pages.length}. Starting global checks...`);
        
        // Duplicate titles
        const titleMap = new Map();
        for (const p of pages) {
            if (!p.title) continue;
            const key = p.title.trim();
            if (!titleMap.has(key)) titleMap.set(key, []);
            titleMap.get(key).push(p.url);
        }
        console.log(`Duplicate title check: Found ${titleMap.size} unique titles`);
        for (const [title, urls] of titleMap.entries()) {
            if (urls.length > 1) {
                console.log(`Duplicate title: "${title}" appears ${urls.length} times`);
                for (const u of urls) {
                    await base44ServiceRole.entities.Issue.create({
                        crawl_id: crawlId,
                        type: 'duplicate_title',
                        severity: 'high',
                        url: u,
                        message: `Flere sider deler samme title: "${title.slice(0, 60)}"`,
                        how_to_fix: 'Gi hver side en unik title som beskriver sidens unike innhold.',
                        status: 'open'
                    });
                }
            }
        }

        // Duplicate H1
        const h1Map = new Map();
        for (const p of pages) {
            if (!p.h1) continue;
            const key = p.h1.trim();
            if (!h1Map.has(key)) h1Map.set(key, []);
            h1Map.get(key).push(p.url);
        }
        console.log(`Duplicate H1 check: Found ${h1Map.size} unique H1s`);
        for (const [h1, urls] of h1Map.entries()) {
            if (urls.length > 1) {
                console.log(`Duplicate H1: "${h1}" appears ${urls.length} times`);
                for (const u of urls) {
                    await base44ServiceRole.entities.Issue.create({
                        crawl_id: crawlId,
                        type: 'duplicate_h1',
                        severity: 'high',
                        url: u,
                        message: `Flere sider deler samme H1: "${h1.slice(0, 60)}"`,
                        how_to_fix: 'Gi hver side en unik H1 som reflekterer sidens tema.',
                        status: 'open'
                    });
                }
            }
        }

        // Orphan pages detection (pages with no inbound internal links)
        const allLinks = await base44ServiceRole.entities.Link.filter({ crawl_id: crawlId });
        const internalLinks = allLinks.filter(l => l.type === 'internal');
        const inboundCount = new Map();
        
        for (const link of internalLinks) {
            inboundCount.set(link.to_url, (inboundCount.get(link.to_url) || 0) + 1);
        }
        
        console.log(`Orphan page check: Checking ${pages.length} pages for orphans`);
        for (const p of pages) {
            const count = inboundCount.get(p.url) || 0;
            if (count === 0 && p.url !== seed) { // Exclude homepage from orphan check
                console.log(`Orphan page found: ${p.url}`);
                await base44ServiceRole.entities.Issue.create({
                    crawl_id: crawlId,
                    type: 'orphan_page',
                    severity: 'high',
                    url: p.url,
                    message: 'Siden har ingen interne lenker inn (orphan page)',
                    how_to_fix: 'Legg inn minst én relevant internlenke til siden fra en passende side.',
                    status: 'open'
                });
            }
        }

        // Check for broken internal links
        const crawledUrls = new Set(pages.map(p => p.url));
        console.log(`Broken link check: Checking ${internalLinks.length} internal links`);

        for (const link of internalLinks) {
            if (!crawledUrls.has(link.to_url)) {
                // Link points to uncrawled internal URL - check it
                try {
                    await sleep(200);
                    const response = await fetch(link.to_url, {
                        method: 'HEAD',
                        headers: { 'User-Agent': USER_AGENT },
                        redirect: 'manual'
                    });

                    if (response.status === 404) {
                        console.log(`Broken link found: ${link.from_url} -> ${link.to_url}`);
                        await base44ServiceRole.entities.Issue.create({
                            crawl_id: crawlId,
                            type: 'broken_internal_link',
                            severity: 'critical',
                            url: link.from_url,
                            related_url: link.to_url,
                            message: 'Intern lenke peker til 404 (finnes ikke)',
                            how_to_fix: 'Oppdater lenken til korrekt URL eller fjern lenken.',
                            status: 'open'
                        });
                    }
                } catch (error) {
                    console.error(`Error checking link ${link.to_url}:`, error.message);
                }
            }
        }

        console.log(`Crawl finished successfully. Pages crawled: ${pagesCrawled}`);
        await base44ServiceRole.entities.Crawl.update(crawlId, {
            status: 'done',
            finished_at: new Date().toISOString(),
            pages_crawled: pagesCrawled
        });

    } catch (error) {
        console.error('Crawl failed:', error);
        await base44ServiceRole.entities.Crawl.update(crawlId, {
            status: 'failed',
            finished_at: new Date().toISOString(),
            pages_crawled: pagesCrawled
        });
    } finally {
        // Clean up browser if JS rendering was used
        if (useJs) {
            await closeRenderer();
        }
    }
}