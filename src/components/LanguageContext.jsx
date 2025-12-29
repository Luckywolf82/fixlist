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
    
    // Landing
    heroTitle: "Technical SEO Audit Tool",
    heroSubtitle: "Discover and fix technical SEO issues on your website. Automated crawling, intelligent reporting, and actionable insights.",
    getStarted: "Get Started",
    viewDemo: "View Demo",
    
    // Features
    featuresTitle: "Everything you need for technical SEO",
    feature1Title: "Automated Crawling",
    feature1Desc: "Schedule automatic crawls and get notified of new issues",
    feature2Title: "Smart Reports",
    feature2Desc: "AI-powered insights and prioritized recommendations",
    feature3Title: "Competitor Analysis",
    feature3Desc: "Benchmark your site against competitors",
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
    
    // Landing
    heroTitle: "Teknisk SEO Verktøy",
    heroSubtitle: "Oppdag og fiks tekniske SEO-problemer på nettstedet ditt. Automatisk crawling, intelligente rapporter og konkrete anbefalinger.",
    getStarted: "Kom i gang",
    viewDemo: "Se demo",
    
    // Features
    featuresTitle: "Alt du trenger for teknisk SEO",
    feature1Title: "Automatisk Crawling",
    feature1Desc: "Planlegg automatiske crawls og få varsler om nye problemer",
    feature2Title: "Smarte Rapporter",
    feature2Desc: "AI-drevne innsikter og prioriterte anbefalinger",
    feature3Title: "Konkurranseanalyse",
    feature3Desc: "Sammenlign nettstedet ditt med konkurrentene",
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