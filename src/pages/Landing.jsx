import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
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

export default function Landing() {
  const { t } = useLanguage();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.filter({ active: true }),
  });

  const features = [
    {
      icon: Search,
      title: "Automatisk Nettstedskanning",
      description: "Crawler alle sidene på nettstedet ditt og identifiserer SEO-problemer automatisk",
      color: "blue"
    },
    {
      icon: AlertTriangle,
      title: "Prioriterte Problemer",
      description: "AI-drevet analyse som rangerer problemer etter viktighet og påvirkning",
      color: "red"
    },
    {
      icon: BarChart3,
      title: "Performance Metrics",
      description: "Overvåk Core Web Vitals, sidetid, og andre viktige ytelsesmetrikker",
      color: "purple"
    },
    {
      icon: FileText,
      title: "Automatiske Rapporter",
      description: "Planlegg ukentlige eller månedlige PDF-rapporter til kunder",
      color: "green"
    },
    {
      icon: Clock,
      title: "Planlagte Crawls",
      description: "Automatisk overvåking av nettsted-endringer og nye problemer",
      color: "orange"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Administrer tilganger for teamet ditt med roller og tillatelser",
      color: "indigo"
    }
  ];

  const useCases = [
    {
      icon: Building2,
      title: "For Bedrifter",
      description: "Perfekt for bedrifter som vil ha full kontroll over sin SEO-helse",
      benefits: [
        "Identifiser og fiks SEO-problemer før de påvirker rangeringer",
        "Overvåk konkurransedyktige metrics som backlinks og domain rating",
        "Få AI-drevne anbefalinger for forbedringer",
        "Eksporter data for dypere analyse"
      ],
      cta: "Start Gratis Prøveperiode"
    },
    {
      icon: Briefcase,
      title: "For Byråer & Konsulenter",
      description: "Perfekt for de som leverer SEO-tjenester til flere kunder",
      benefits: [
        "White-label rapporter med din egen branding",
        "Håndter flere kunders nettsteder fra én konto",
        "Automatiser repeterende SEO-oppgaver",
        "Vis verdien av dine tjenester med detaljerte rapporter"
      ],
      cta: "Utforsk Enterprise"
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
              <span>AI-drevet SEO-analyse for moderne nettsteder</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Hold nettstedet ditt<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                SEO-optimalisert
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
              Automatisk skanning, AI-prioritering og omfattende rapporter. 
              Alt du trenger for å opprettholde og forbedre SEO-helsen til nettsidene dine.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8">
                Start Gratis Prøveperiode
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-8">
                Se Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Alt du trenger for SEO-overvåking
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Fra automatisk skanning til detaljerte rapporter - vi har alle verktøyene du trenger
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
              Perfekt for alle som arbeider med SEO
            </h2>
            <p className="text-lg text-slate-600">
              Uansett om du administrerer ditt eget nettsted eller leverer tjenester til kunder
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
            Velg planen som passer deg
          </h2>
          <p className="text-lg text-slate-600">
            Alle planer inkluderer 14 dagers gratis prøveperiode. Ingen kredittkort nødvendig.
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
                      Populær
                    </Badge>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-slate-900">${product.price}</span>
                      <span className="text-slate-500 ml-1">/måned</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      {product.max_sites === -1 ? 'Ubegrensede' : product.max_sites} nettsteder
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      {product.max_crawls_per_month === -1 ? 'Ubegrensede' : product.max_crawls_per_month} crawls/måned
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
                    {product.price === 0 ? "Kom i gang" : "Velg plan"}
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
            Klar til å optimalisere nettstedet ditt?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Bli med tusenvis av bedrifter og byråer som bruker Fixlist for å holde nettstedene sine SEO-optimaliserte.
          </p>
          <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8">
            Start Gratis Prøveperiode i dag
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-slate-400 mt-4">
            Ingen kredittkort nødvendig • 14 dagers gratis prøveperiode • Avbryt når som helst
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
            <p className="text-sm">© 2025 Fixlist. Alle rettigheter forbeholdt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}