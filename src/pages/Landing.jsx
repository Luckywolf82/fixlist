import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  CheckCircle, 
  Zap,
  FileText,
  Globe,
  ArrowRight,
  Users,
  Target,
  Heart,
  Calendar,
  Smartphone,
  Brain,
  ExternalLink
} from "lucide-react";

function LandingContent() {
  const solutions = [
    {
      name: "Fixlist",
      icon: Search,
      description: "AI-drevet SEO-analyse for moderne nettsteder",
      features: ["Automatisk skanning", "AI-prioritering", "Omfattende rapporter"],
      color: "blue",
      url: "https://fixlist.app"
    },
    {
      name: "Fangst",
      icon: Target,
      description: "Smartere jakt- og fangstregistrering",
      features: ["Digital registrering", "Statistikk", "Samarbeidsfunksjoner"],
      color: "green",
      url: "#"
    },
    {
      name: "NFCking",
      icon: Smartphone,
      description: "NFC-baserte løsninger for effektiv datautveksling",
      features: ["Enkel deling", "Sikker overføring", "Skalerbar teknologi"],
      color: "purple",
      url: "#"
    },
    {
      name: "SammenFolk",
      icon: Heart,
      description: "Plattform for meningsfulle forbindelser",
      features: ["Nettverksbygging", "Hendelser", "Fellesskap"],
      color: "red",
      url: "#"
    },
    {
      name: "CampManager",
      icon: Calendar,
      description: "Komplett administrasjonsverktøy for leirer og arrangementer",
      features: ["Påmeldingssystem", "Økonomi", "Deltakeroversikt"],
      color: "orange",
      url: "#"
    },
    {
      name: "ADHD Kartlegging",
      icon: Brain,
      description: "Digitalt verktøy for ADHD-kartlegging og oppfølging",
      features: ["Systematisk kartlegging", "Progresjonssporing", "Rapportgenerering"],
      color: "indigo",
      url: "#"
    }
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200"
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Innovativ teknologi for morgendagens løsninger</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight mb-6 px-2">
              Velkommen til<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Techwaagen
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 px-4">
              Vi bygger digitale verktøy som løser reelle utfordringer. Fra SEO-analyse til ADHD-kartlegging - våre løsninger hjelper bedrifter og organisasjoner med å jobbe smartere.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto whitespace-nowrap">
                Utforsk våre løsninger
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto whitespace-nowrap">
                Kontakt oss
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Hva vi gjør
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Techwaagen utvikler skreddersydde digitale løsninger som forenkler komplekse prosesser. Vi kombinerer moderne teknologi med brukeropplevelse for å skape verktøy som faktisk fungerer.
          </p>
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Våre Løsninger
            </h2>
            <p className="text-lg text-slate-600">
              Utforsk vårt portefølje av innovative produkter
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution, idx) => (
              <Card key={idx} className="p-6 hover:shadow-xl transition-all hover:-translate-y-1 group">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 border-2 ${colorClasses[solution.color]}`}>
                  <solution.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                  {solution.name}
                  {solution.url !== "#" && (
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  )}
                </h3>
                <p className="text-slate-600 mb-4">{solution.description}</p>
                <ul className="space-y-2">
                  {solution.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {solution.url !== "#" && (
                  <a href={solution.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                    <Button variant="outline" className="w-full group-hover:bg-slate-900 group-hover:text-white">
                      Besøk
                    </Button>
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Hvorfor Techwaagen?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Vi kombinerer teknisk ekspertise med praktisk forståelse av dine behov
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Brukerfokus</h3>
            <p className="text-slate-600">
              Vi setter brukeropplevelsen i sentrum av alt vi bygger
            </p>
          </Card>
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Moderne teknologi</h3>
            <p className="text-slate-600">
              Vi bruker de nyeste verktøyene og teknologiene
            </p>
          </Card>
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Målrettet utvikling</h3>
            <p className="text-slate-600">
              Hver løsning er utviklet for å løse spesifikke utfordringer
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 sm:py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
            Klar til å komme i gang?
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-10">
            La oss hjelpe deg med å finne den rette løsningen for dine behov
          </p>
          <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto whitespace-nowrap">
            Kontakt oss i dag
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-slate-400 mt-4">
            Ingen forpliktelser • Rask respons • Skreddersydde løsninger
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-slate-900" />
              </div>
              <span className="text-lg font-semibold text-white">Techwaagen</span>
            </div>
            <p className="text-sm">© 2025 Techwaagen. Alle rettigheter forbeholdt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return <LandingContent />;
}