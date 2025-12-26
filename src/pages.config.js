import Sites from './pages/Sites';
import SiteOverview from './pages/SiteOverview';
import Crawls from './pages/Crawls';
import Issues from './pages/Issues';
import Pages from './pages/Pages';
import PageDetail from './pages/PageDetail';
import Analytics from './pages/Analytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Sites": Sites,
    "SiteOverview": SiteOverview,
    "Crawls": Crawls,
    "Issues": Issues,
    "Pages": Pages,
    "PageDetail": PageDetail,
    "Analytics": Analytics,
}

export const pagesConfig = {
    mainPage: "Sites",
    Pages: PAGES,
    Layout: __Layout,
};