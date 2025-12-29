import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Navigation
    sites: "Sites",
    analytics: "Analytics",
    reports: "Reports",
    templates: "Templates",
    users: "Users",
    billing: "Billing",
    settings: "Settings",
    login: "Log in",
    
    // Landing - Hero
    heroPreline: "AI-powered SEO analysis for modern websites",
    heroTitle1: "Keep your website",
    heroTitle2: "SEO-optimized",
    heroSubtitle: "Automatic scanning, AI prioritization, and comprehensive reports. Everything you need to maintain and improve your website's SEO health.",
    heroCtaPrimary: "Start Free Trial",
    heroCtaSecondary: "View Demo",
    
    // Landing - Features
    featuresTitle: "Everything you need for SEO monitoring",
    featuresSubtitle: "From automatic scanning to detailed reports - we have all the tools you need",
    
    feature1Title: "Automatic Site Crawling",
    feature1Desc: "Crawls all pages on your website and automatically identifies SEO issues",
    
    feature2Title: "Prioritized Issues",
    feature2Desc: "AI-driven analysis that ranks issues by importance and impact",
    
    feature3Title: "Performance Metrics",
    feature3Desc: "Monitor Core Web Vitals, page speed, and other important performance metrics",
    
    feature4Title: "Automated Reports",
    feature4Desc: "Schedule weekly or monthly PDF reports for clients",
    
    feature5Title: "Scheduled Crawls",
    feature5Desc: "Automatic monitoring of website changes and new issues",
    
    feature6Title: "Team Management",
    feature6Desc: "Manage access for your team with roles and permissions",
    
    // Landing - Use Cases
    useCasesTitle: "Perfect for everyone working with SEO",
    useCasesSubtitle: "Whether you manage your own website or deliver services to clients",
    
    useCase1Title: "For Businesses",
    useCase1Desc: "Perfect for companies that want full control over their SEO health",
    useCase1Benefit1: "Identify and fix SEO issues before they affect rankings",
    useCase1Benefit2: "Monitor competitive metrics like backlinks and domain rating",
    useCase1Benefit3: "Get AI-driven recommendations for improvements",
    useCase1Benefit4: "Export data for deeper analysis",
    useCase1Cta: "Start Free Trial",
    
    useCase2Title: "For Agencies & Consultants",
    useCase2Desc: "Perfect for those delivering SEO services to multiple clients",
    useCase2Benefit1: "White-label reports with your own branding",
    useCase2Benefit2: "Manage multiple client websites from one account",
    useCase2Benefit3: "Automate repetitive SEO tasks",
    useCase2Benefit4: "Show the value of your services with detailed reports",
    useCase2Cta: "Explore Enterprise",
    
    // Landing - Pricing
    pricingTitle: "Choose the plan that fits you",
    pricingSubtitle: "All plans include a 14-day free trial. No credit card required.",
    pricingPopular: "Popular",
    pricingPerMonth: "/month",
    pricingSites: "websites",
    pricingCrawls: "crawls/month",
    pricingUnlimited: "Unlimited",
    pricingCtaFree: "Get started",
    pricingCtaPaid: "Choose plan",
    
    // Landing - Final CTA
    ctaTitle: "Ready to optimize your website?",
    ctaSubtitle: "Join thousands of businesses and agencies using Fixlist to keep their websites SEO-optimized.",
    ctaButton: "Start Free Trial Today",
    ctaNotice: "No credit card required • 14-day free trial • Cancel anytime",
    
    // Landing - Footer
    footerCopyright: "All rights reserved.",
  },
  no: {
    // Navigation
    sites: "Nettsteder",
    analytics: "Analyse",
    reports: "Rapporter",
    templates: "Maler",
    users: "Brukere",
    billing: "Fakturering",
    settings: "Innstillinger",
    login: "Logg inn",
    
    // Landing - Hero
    heroPreline: "AI-drevet SEO-analyse for moderne nettsteder",
    heroTitle1: "Hold nettstedet ditt",
    heroTitle2: "SEO-optimalisert",
    heroSubtitle: "Automatisk skanning, AI-prioritering og omfattende rapporter. Alt du trenger for å opprettholde og forbedre SEO-helsen til nettsidene dine.",
    heroCtaPrimary: "Start Gratis Prøveperiode",
    heroCtaSecondary: "Se Demo",
    
    // Landing - Features
    featuresTitle: "Alt du trenger for SEO-overvåking",
    featuresSubtitle: "Fra automatisk skanning til detaljerte rapporter - vi har alle verktøyene du trenger",
    
    feature1Title: "Automatisk Nettstedskanning",
    feature1Desc: "Crawler alle sidene på nettstedet ditt og identifiserer SEO-problemer automatisk",
    
    feature2Title: "Prioriterte Problemer",
    feature2Desc: "AI-drevet analyse som rangerer problemer etter viktighet og påvirkning",
    
    feature3Title: "Performance Metrics",
    feature3Desc: "Overvåk Core Web Vitals, sidetid, og andre viktige ytelsesmetrikker",
    
    feature4Title: "Automatiske Rapporter",
    feature4Desc: "Planlegg ukentlige eller månedlige PDF-rapporter til kunder",
    
    feature5Title: "Planlagte Crawls",
    feature5Desc: "Automatisk overvåking av nettsted-endringer og nye problemer",
    
    feature6Title: "Team Management",
    feature6Desc: "Administrer tilganger for teamet ditt med roller og tillatelser",
    
    // Landing - Use Cases
    useCasesTitle: "Perfekt for alle som arbeider med SEO",
    useCasesSubtitle: "Uansett om du administrerer ditt eget nettsted eller leverer tjenester til kunder",
    
    useCase1Title: "For Bedrifter",
    useCase1Desc: "Perfekt for bedrifter som vil ha full kontroll over sin SEO-helse",
    useCase1Benefit1: "Identifiser og fiks SEO-problemer før de påvirker rangeringer",
    useCase1Benefit2: "Overvåk konkurransedyktige metrics som backlinks og domain rating",
    useCase1Benefit3: "Få AI-drevne anbefalinger for forbedringer",
    useCase1Benefit4: "Eksporter data for dypere analyse",
    useCase1Cta: "Start Gratis Prøveperiode",
    
    useCase2Title: "For Byråer & Konsulenter",
    useCase2Desc: "Perfekt for de som leverer SEO-tjenester til flere kunder",
    useCase2Benefit1: "White-label rapporter med din egen branding",
    useCase2Benefit2: "Håndter flere kunders nettsteder fra én konto",
    useCase2Benefit3: "Automatiser repeterende SEO-oppgaver",
    useCase2Benefit4: "Vis verdien av dine tjenester med detaljerte rapporter",
    useCase2Cta: "Utforsk Enterprise",
    
    // Landing - Pricing
    pricingTitle: "Velg planen som passer deg",
    pricingSubtitle: "Alle planer inkluderer 14 dagers gratis prøveperiode. Ingen kredittkort nødvendig.",
    pricingPopular: "Populær",
    pricingPerMonth: "/måned",
    pricingSites: "nettsteder",
    pricingCrawls: "crawls/måned",
    pricingUnlimited: "Ubegrensede",
    pricingCtaFree: "Kom i gang",
    pricingCtaPaid: "Velg plan",
    
    // Landing - Final CTA
    ctaTitle: "Klar til å optimalisere nettstedet ditt?",
    ctaSubtitle: "Bli med tusenvis av bedrifter og byråer som bruker Fixlist for å holde nettstedene sine SEO-optimaliserte.",
    ctaButton: "Start Gratis Prøveperiode i dag",
    ctaNotice: "Ingen kredittkort nødvendig • 14 dagers gratis prøveperiode • Avbryt når som helst",
    
    // Landing - Footer
    footerCopyright: "Alle rettigheter forbeholdt.",
  }
};

async function detectLanguageFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code;
    
    // Norwegian-speaking countries
    const norwegianCountries = ['NO', 'SJ'];
    return norwegianCountries.includes(countryCode) ? 'no' : 'en';
  } catch (error) {
    console.error('Failed to detect language:', error);
    return 'en'; // Default to English
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguage(savedLang);
      setLoading(false);
    } else {
      detectLanguageFromIP().then(detectedLang => {
        setLanguage(detectedLang);
        localStorage.setItem('language', detectedLang);
        setLoading(false);
      });
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}