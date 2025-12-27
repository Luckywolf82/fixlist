import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  Globe, 
  Play, 
  BarChart3, 
  Check,
  ArrowRight,
  Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function OnboardingWizard({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(user?.onboarding_step || 0);
  const [domain, setDomain] = useState("");
  const [isVisible, setIsVisible] = useState(!user?.onboarding_completed);
  const queryClient = useQueryClient();

  const steps = [
    {
      id: 0,
      title: "Velkommen til Fixlist!",
      description: "La oss sette opp din første nettside for SEO-overvåking",
      icon: Sparkles,
      action: null,
    },
    {
      id: 1,
      title: "Legg til ditt første nettsted",
      description: "Skriv inn domenet til nettstedet du vil overvåke",
      icon: Globe,
      action: "addSite",
    },
    {
      id: 2,
      title: "Start din første crawl",
      description: "Crawl nettstedet for å finne SEO-problemer og forbedringer",
      icon: Play,
      action: "startCrawl",
    },
    {
      id: 3,
      title: "Forstå dine metrikker",
      description: "Lær hvordan du tolker resultatene og prioriterer forbedringer",
      icon: BarChart3,
      action: "learnMetrics",
    },
  ];

  const updateOnboardingMutation = useMutation({
    mutationFn: async (data) => {
      return base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const addSiteMutation = useMutation({
    mutationFn: async (siteDomain) => {
      const cleanDomain = siteDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      return base44.entities.Site.create({ domain: cleanDomain });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Nettsted lagt til!");
      handleNext();
    },
    onError: () => {
      toast.error("Kunne ikke legge til nettsted");
    },
  });

  const handleNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    updateOnboardingMutation.mutate({ onboarding_step: nextStep });
  };

  const handleSkip = () => {
    updateOnboardingMutation.mutate({ 
      onboarding_completed: true,
      onboarding_step: steps.length 
    });
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleComplete = () => {
    updateOnboardingMutation.mutate({ 
      onboarding_completed: true,
      onboarding_step: steps.length 
    });
    setIsVisible(false);
    toast.success("Onboarding fullført! 🎉");
    if (onComplete) onComplete();
  };

  const handleAction = () => {
    const step = steps[currentStep];
    
    if (step.action === "addSite") {
      if (!domain.trim()) {
        toast.error("Vennligst skriv inn et domene");
        return;
      }
      addSiteMutation.mutate(domain);
    } else if (step.action === "startCrawl") {
      toast.success("Gå til Sites-siden og klikk 'Crawl Now' på nettstedet ditt!");
      handleNext();
    } else if (step.action === "learnMetrics") {
      handleComplete();
    } else {
      handleNext();
    }
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const StepIcon = currentStepData.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="p-8 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={handleSkip}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  Steg {currentStep + 1} av {steps.length}
                </span>
                <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps indicators */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      idx < currentStep
                        ? "bg-green-500 text-white"
                        : idx === currentStep
                        ? "bg-slate-900 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {idx < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        idx < currentStep ? "bg-green-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <StepIcon className="w-8 h-8 text-slate-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                {currentStepData.title}
              </h2>
              <p className="text-slate-600 text-lg">
                {currentStepData.description}
              </p>
            </div>

            {/* Step-specific content */}
            <div className="mb-8">
              {currentStepData.action === "addSite" && (
                <div className="space-y-4">
                  <Input
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    className="text-center text-lg"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tips:</strong> Skriv bare domenet, ikke hele URL-en. F.eks: "minside.no" i stedet for "https://www.minside.no"
                    </p>
                  </div>
                </div>
              )}

              {currentStepData.action === "startCrawl" && (
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-slate-900 text-white mt-1">1</Badge>
                    <div>
                      <p className="font-medium text-slate-900">Gå til Sites-siden</p>
                      <p className="text-sm text-slate-600">Finn nettstedet du nettopp la til</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-slate-900 text-white mt-1">2</Badge>
                    <div>
                      <p className="font-medium text-slate-900">Klikk "Crawl Now"</p>
                      <p className="text-sm text-slate-600">Starte crawl tar vanligvis 1-3 minutter</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-slate-900 text-white mt-1">3</Badge>
                    <div>
                      <p className="font-medium text-slate-900">Se resultater</p>
                      <p className="text-sm text-slate-600">Crawlen identifiserer SEO-problemer automatisk</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.action === "learnMetrics" && (
                <div className="space-y-4">
                  <Card className="p-4 border-l-4 border-red-500">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-sm">!</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Kritiske problemer</p>
                        <p className="text-sm text-slate-600">Må fikses umiddelbart - påvirker SEO negativt</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-l-4 border-yellow-500">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-yellow-600 font-bold text-sm">!</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Høy prioritet</p>
                        <p className="text-sm text-slate-600">Viktige forbedringer som bør fikses snart</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">i</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Medium prioritet</p>
                        <p className="text-sm text-slate-600">Forbedringer som øker kvaliteten over tid</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                Hopp over
              </Button>
              <Button
                onClick={handleAction}
                disabled={currentStepData.action === "addSite" && !domain.trim()}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {currentStep === steps.length - 1 ? (
                  "Fullfør"
                ) : (
                  <>
                    {currentStepData.action === "addSite" ? "Legg til" : "Neste"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}