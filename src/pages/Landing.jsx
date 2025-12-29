import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  BarChart3, 
  Users, 
  Zap,
  Shield,
  TrendingUp,
  FileText,
  Globe,
  ArrowRight,
  Check,
  Building2,
  Briefcase
} from "lucide-react";

function LandingContent() {
  const { t } = useLanguage();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.filter({ active: true }),
  });

  const features = [
    {
      icon: Search,
      title: t("feature1Title"),
      description: t("feature1Desc"),
      color: "blue"
    },
    {
      icon: AlertTriangle,
      title: t("feature2Title"),
      description: t("feature2Desc"),
      color: "red"
    },
    {
      icon: BarChart3,
      title: t("feature3Title"),
      description: t("feature3Desc"),
      color: "purple"
    },
    {
      icon: FileText,
      title: t("feature4Title"),
      description: t("feature4Desc"),
      color: "green"
    },
    {
      icon: Clock,
      title: t("feature5Title"),
      description: t("feature5Desc"),
      color: "orange"
    },
    {
      icon: Users,
      title: t("feature6Title"),
      description: t("feature6Desc"),
      color: "indigo"
    }
  ];

  const useCases = [
    {
      icon: Building2,
      title: t("useCase1Title"),
      description: t("useCase1Desc"),
      benefits: [
        t("useCase1Benefit1"),
        t("useCase1Benefit2"),
        t("useCase1Benefit3"),
        t("useCase1Benefit4")
      ],
      cta: t("useCase1Cta")
    },
    {
      icon: Briefcase,
      title: t("useCase2Title"),
      description: t("useCase2Desc"),
      benefits: [
        t("useCase2Benefit1"),
        t("useCase2Benefit2"),
        t("useCase2Benefit3"),
        t("useCase2Benefit4")
      ],
      cta: t("useCase2Cta")
    }
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600"
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>{t("heroPreline")}</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              {t("heroTitle1")}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {t("heroTitle2")}
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
              {t("heroSubtitle")}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8">
                {t("heroCtaPrimary")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-8">
                {t("heroCtaSecondary")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            {t("featuresTitle")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("featuresSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[feature.color]}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              {t("useCasesTitle")}
            </h2>
            <p className="text-lg text-slate-600">
              {t("useCasesSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {useCases.map((useCase, idx) => (
              <Card key={idx} className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center">
                    <useCase.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{useCase.title}</h3>
                    <p className="text-slate-600">{useCase.description}</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {useCase.benefits.map((benefit, bidx) => (
                    <li key={bidx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-slate-900 hover:bg-slate-800">
                  {useCase.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            {t("pricingTitle")}
          </h2>
          <p className="text-lg text-slate-600">
            {t("pricingSubtitle")}
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const isPremium = product.plan_key === "professional" || product.plan_key === "enterprise";
              return (
                <Card 
                  key={product.id} 
                  className={`p-6 relative ${isPremium ? 'border-2 border-purple-300 shadow-lg' : ''}`}
                >
                  {isPremium && (
                    <Badge className="absolute top-4 right-4 bg-purple-100 text-purple-700">
                      {t("pricingPopular")}
                    </Badge>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-slate-900">${product.price}</span>
                      <span className="text-slate-500 ml-1">{t("pricingPerMonth")}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      {product.max_sites === -1 ? t("pricingUnlimited") : product.max_sites} {t("pricingSites")}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      {product.max_crawls_per_month === -1 ? t("pricingUnlimited") : product.max_crawls_per_month} {t("pricingCrawls")}
                    </p>
                    {product.features && product.features.length > 0 && product.features.map((feature, idx) => (
                      <p key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        {feature}
                      </p>
                    ))}
                  </div>

                  <Button
                    className={`w-full ${isPremium ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    {product.price === 0 ? t("pricingCtaFree") : t("pricingCtaPaid")}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            {t("ctaTitle")}
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            {t("ctaSubtitle")}
          </p>
          <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8">
            {t("ctaButton")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-slate-400 mt-4">
            {t("ctaNotice")}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-slate-900" />
              </div>
              <span className="text-lg font-semibold text-white">Fixlist</span>
            </div>
            <p className="text-sm">© 2025 Fixlist. {t("footerCopyright")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <LanguageProvider>
      <LandingContent />
    </LanguageProvider>
  );
}