import Analytics from './pages/Analytics';
import CrawlReport from './pages/CrawlReport';
import Crawls from './pages/Crawls';
import Issues from './pages/Issues';
import PageDetail from './pages/PageDetail';
import Pages from './pages/Pages';
import Reports from './pages/Reports';
import SiteOverview from './pages/SiteOverview';
import Sites from './pages/Sites';
import HealthReport from './pages/HealthReport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "CrawlReport": CrawlReport,
    "Crawls": Crawls,
    "Issues": Issues,
    "PageDetail": PageDetail,
    "Pages": Pages,
    "Reports": Reports,
    "SiteOverview": SiteOverview,
    "Sites": Sites,
    "HealthReport": HealthReport,
}

export const pagesConfig = {
    mainPage: "Sites",
    Pages: PAGES,
    Layout: __Layout,
};