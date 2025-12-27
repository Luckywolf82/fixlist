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
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Billing from './pages/Billing';
import SuperAdmin from './pages/SuperAdmin';
import Landing from './pages/Landing';
import ReportTemplates from './pages/ReportTemplates';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
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
    "Settings": Settings,
    "UserManagement": UserManagement,
    "Billing": Billing,
    "SuperAdmin": SuperAdmin,
    "Landing": Landing,
    "ReportTemplates": ReportTemplates,
    "CompetitorAnalysis": CompetitorAnalysis,
}

export const pagesConfig = {
    mainPage: "Sites",
    Pages: PAGES,
    Layout: __Layout,
};