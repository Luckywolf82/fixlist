import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { usePermissions } from "@/components/usePermissions";
import { Globe, LayoutDashboard, Bug, FileText, Search, BarChart3, Settings, Users } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const { canAccessSettings, canManageUsers } = usePermissions();
  
  const navigation = [
    { name: "Sites", page: "Sites", icon: Globe, show: true },
    { name: "Analytics", page: "Analytics", icon: BarChart3, show: true },
    { name: "Reports", page: "Reports", icon: FileText, show: true },
    { name: "Users", page: "UserManagement", icon: Users, show: canManageUsers },
    { name: "Settings", page: "Settings", icon: Settings, show: canAccessSettings },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Sites")} className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900 tracking-tight">Fixlist</span>
            </Link>
            
            <nav className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}