import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import CrawlReport from './pages/CrawlReport';
import Crawls from './pages/Crawls';
import HealthReport from './pages/HealthReport';
import Issues from './pages/Issues';
import Landing from './pages/Landing';
import PageDetail from './pages/PageDetail';
import Pages from './pages/Pages';
import ReportTemplates from './pages/ReportTemplates';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SiteOverview from './pages/SiteOverview';
import Sites from './pages/Sites';
import SuperAdmin from './pages/SuperAdmin';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Billing": Billing,
    "CompetitorAnalysis": CompetitorAnalysis,
    "CrawlReport": CrawlReport,
    "Crawls": Crawls,
    "HealthReport": HealthReport,
    "Issues": Issues,
    "Landing": Landing,
    "PageDetail": PageDetail,
    "Pages": Pages,
    "ReportTemplates": ReportTemplates,
    "Reports": Reports,
    "Settings": Settings,
    "SiteOverview": SiteOverview,
    "Sites": Sites,
    "SuperAdmin": SuperAdmin,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Sites",
    Pages: PAGES,
    Layout: __Layout,
};