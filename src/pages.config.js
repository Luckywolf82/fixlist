import Analytics from './pages/Analytics';
import Crawls from './pages/Crawls';
import Issues from './pages/Issues';
import PageDetail from './pages/PageDetail';
import Pages from './pages/Pages';
import Reports from './pages/Reports';
import SiteOverview from './pages/SiteOverview';
import Sites from './pages/Sites';
import CrawlReport from './pages/CrawlReport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Crawls": Crawls,
    "Issues": Issues,
    "PageDetail": PageDetail,
    "Pages": Pages,
    "Reports": Reports,
    "SiteOverview": SiteOverview,
    "Sites": Sites,
    "CrawlReport": CrawlReport,
}

export const pagesConfig = {
    mainPage: "Sites",
    Pages: PAGES,
    Layout: __Layout,
};