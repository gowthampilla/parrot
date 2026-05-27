"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Code2, Target, Briefcase, Cpu, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";

// Pre-defined MCQ Options for the AI
const ROLES = [
  "AI / ML Engineer", "Fullstack Developer", "Frontend Developer", 
  "Backend Developer", "Product Designer", "Founder / CEO", "GTM / Sales"
];

const BUILDING_CATEGORIES = [
  "Agentic AI & RAG", "B2B SaaS / Enterprise", "Consumer Tech & Social", 
  "Fintech / Crypto", "DeepTech / Hardware", "Developer Tools & Infra"
];

const LOOKING_FOR = [
  "Technical Co-founder", "Business / GTM Co-founder", "Founding Engineers", 
  "Product Designers", "Pre-Seed Investors", "Beta Testers & Feedback"
];

const AVAILABLE_SKILLS = [
  "Next.js", "React", "TypeScript", "Node.js", "Python", 
  "LangChain", "Supabase", "PostgreSQL", "AWS", "Figma"
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  
  const [formData, setFormData] = useState({
    role: "",
    company: "",
    building: "",
    lookingFor: "",
    skills: [] as string[]
  });

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsPending(true);
    const result = await completeOnboarding(formData);
    
    if (result.success) {
      router.push("/discover");
    } else {
      console.error(result.error);
      setIsPending(false);
    }
  };

  // Reusable component for the MCQ cards
  const OptionCard = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`relative w-full p-4 rounded-xl text-left transition-all duration-200 border ${
        selected 
          ? 'bg-accent-indigo/10 border-accent-indigo shadow-glow-indigo' 
          : 'bg-surface border-white/5 hover:border-white/20 hover:bg-surface-raised'
      }`}
    >
      <span className={`text-sm font-medium ${selected ? 'text-accent-indigo' : 'text-foreground'}`}>
        {label}
      </span>
      {selected && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Check className="w-4 h-4 text-accent-indigo" />
        </div>
      )}
    </button>
  );

  return (
    <main className="flex flex-col min-h-screen px-6 pt-20 pb-12 overflow-hidden bg-background">
      
      {/* Progress Indicator */}
      <div className="w-full max-w-md mx-auto mb-12 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-accent-indigo shadow-glow-indigo' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col w-full max-w-md mx-auto relative">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: IDENTITY (MCQ) */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5 text-accent-indigo" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">What is your primary role?</h1>
                <p className="text-sm text-muted mt-2">Select the title that best describes you.</p>
              </div>
              <div className="space-y-3 mb-6">
                {ROLES.map(role => (
                  <OptionCard 
                    key={role} 
                    label={role} 
                    selected={formData.role === role} 
                    onClick={() => setFormData({...formData, role})} 
                  />
                ))}
              </div>
              {/* Optional Company Input */}
              <input 
                type="text" 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="Company / Startup Name (Optional)"
                className="w-full h-14 px-4 rounded-xl bg-surface/50 border border-white/5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent-indigo/50 focus:ring-1 focus:ring-accent-indigo/50 transition-all"
              />
            </motion.div>
          )}

          {/* STEP 2: BUILDING (MCQ) */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center mb-4">
                  <Code2 className="w-5 h-5 text-accent-indigo" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">What sector are you building in?</h1>
                <p className="text-sm text-muted mt-2">This helps the AI connect you with relevant ecosystems.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {BUILDING_CATEGORIES.map(category => (
                  <OptionCard 
                    key={category} 
                    label={category} 
                    selected={formData.building === category} 
                    onClick={() => setFormData({...formData, building: category})} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: LOOKING FOR (MCQ) */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5 text-accent-indigo" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Who do you need to meet?</h1>
                <p className="text-sm text-muted mt-2">Define the missing piece in your startup journey.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {LOOKING_FOR.map(need => (
                  <OptionCard 
                    key={need} 
                    label={need} 
                    selected={formData.lookingFor === need} 
                    onClick={() => setFormData({...formData, lookingFor: need})} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: SKILLS (Multi-Select MCQ) */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5 text-accent-indigo" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Select your technical arsenal.</h1>
                <p className="text-sm text-muted mt-2">Pick the tools and domains you command (select multiple).</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SKILLS.map(skill => {
                  const isSelected = formData.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected 
                          ? 'bg-accent-indigo border-accent-indigo text-white shadow-glow-indigo' 
                          : 'bg-surface border border-white/10 text-muted hover:text-white hover:border-white/20'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="w-full max-w-md mx-auto mt-auto pt-6 flex items-center justify-between z-10">
        {step > 1 ? (
          <button onClick={handleBack} className="p-3 rounded-xl border border-white/10 text-muted hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : <div />}

        {step < 4 ? (
          <button 
            onClick={handleNext} 
            disabled={
              (step === 1 && !formData.role) || 
              (step === 2 && !formData.building) || 
              (step === 3 && !formData.lookingFor)
            }
            className="h-12 px-6 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isPending || formData.skills.length === 0}
            className="h-12 px-6 rounded-xl bg-accent-indigo text-white font-semibold text-sm flex items-center gap-2 shadow-glow-indigo hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Profile"}
          </button>
        )}
      </div>

    </main>
  );
}