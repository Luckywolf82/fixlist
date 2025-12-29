import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/usePermissions";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Globe, LayoutDashboard, Bug, FileText, Search, BarChart3, Settings, Users, CreditCard, Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function LayoutContent({ children, currentPageName }) {
  const { canAccessSettings, canManageUsers, canAccessSuperAdmin } = usePermissions();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: t("sites"), page: "Sites", icon: Globe, show: true },
    { name: t("analytics"), page: "Analytics", icon: BarChart3, show: true },
    { name: t("reports"), page: "Reports", icon: FileText, show: true },
    { name: t("templates"), page: "ReportTemplates", icon: Settings, show: canAccessSettings },
    { name: t("users"), page: "UserManagement", icon: Users, show: canManageUsers },
    { name: t("billing"), page: "Billing", icon: CreditCard, show: true },
    { name: t("settings"), page: "Settings", icon: Settings, show: canAccessSettings },
    { name: "SuperAdmin", page: "SuperAdmin", icon: Shield, show: canAccessSuperAdmin },
  ].filter(item => item.show);

  // Landing page has different header
  const isLandingPage = currentPageName === "Landing";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl(isLandingPage ? "Landing" : "Sites")} className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900 tracking-tight">Fixlist</span>
            </Link>
            
            {isLandingPage ? (
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  {t("login")}
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-4">
                  <LanguageSwitcher />
                  <nav className="flex items-center gap-1">
                    {navigation.map((item) => {
                      const isActive = currentPageName === item.page;
                      return (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            isActive 
                              ? "bg-slate-100 text-slate-900" 
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Mobile Menu Button */}
                <div className="lg:hidden flex items-center gap-3">
                  <LanguageSwitcher />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {!isLandingPage && mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-slate-100 text-slate-900" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className={isLandingPage ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8"}>
        {children}
      </main>
    </div>
  );
}

export default function Layout(props) {
  return (
    <LanguageProvider>
      <LayoutContent {...props} />
    </LanguageProvider>
  );
}