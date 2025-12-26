import Analytics from './pages/Analytics';
import CrawlReport from './pages/CrawlReport';
import Crawls from './pages/Crawls';
import HealthReport from './pages/HealthReport';
import Issues from './pages/Issues';
import PageDetail from './pages/PageDetail';
import Pages from './pages/Pages';
import Reports from './pages/Reports';
import SiteOverview from './pages/SiteOverview';
import Sites from './pages/Sites';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "CrawlReport": CrawlReport,
    "Crawls": Crawls,
    "HealthReport": HealthReport,
    "Issues": Issues,
    "PageDetail": PageDetail,
    "Pages": Pages,
    "Reports": Reports,
    "SiteOverview": SiteOverview,
    "Sites": Sites,
}

export const pagesConfig = {
    mainPage: "Sites",
    Pages: PAGES,
    Layout: __Layout,
};