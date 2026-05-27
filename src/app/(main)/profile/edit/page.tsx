"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Save, Cpu } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";

const AVAILABLE_SKILLS = [
  "Next.js", "React", "TypeScript", "Node.js", "Python", 
  "LangChain", "Supabase", "PostgreSQL", "AWS", "Figma",
  "AI Agents", "RAG", "Go-to-Market", "B2B Sales", "Product Design"
];

export default function EditProfile() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    company: "",
    building: "",
    looking_for: "",
    skills: [] as string[],
    avatar_url: ""
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (data) {
        setFormData({
          name: data.name || "",
          role: data.role || "",
          company: data.company || "",
          building: data.building || "",
          looking_for: data.looking_for || "",
          skills: data.skills || [],
          avatar_url: data.avatar_url || ""
        });
      }
    }
    fetchProfile();
  }, [supabase]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

    if (uploadError) {
      alert(`Image Upload Error: ${uploadError.message}`); // SHOW THE ERROR
      console.error("Upload error details:", uploadError);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    }
    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Manual validation so it doesn't fail silently
    if (!formData.name || !formData.role || !formData.building || !formData.looking_for) {
      alert("Please fill out all the text fields before saving.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateProfile(formData);
        if (result.success) {
          router.push("/profile");
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (err: any) {
        alert(`Client Error: ${err.message}`);
      }
    });
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };



  return (
    <main className="flex flex-col min-h-screen bg-background pb-32">
      <header className="flex items-center justify-between p-6 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-surface text-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-semibold text-foreground">Edit Profile</span>
        <div className="w-9 h-9" />
      </header>

      <form onSubmit={handleSubmit} className="px-6 space-y-6">
        
        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative w-24 h-24 rounded-3xl bg-surface border border-white/10 flex items-center justify-center overflow-hidden mb-4 group cursor-pointer">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted">{formData.name ? formData.name.charAt(0) : "?"}</span>
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white" />}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
          </div>
          <span className="text-xs text-muted">Tap to upload picture</span>
        </div>

        {/* Text Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5 block">Full Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-surface border border-white/10 text-sm text-foreground focus:border-accent-indigo outline-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5 block">Role</label>
              <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-surface border border-white/10 text-sm text-foreground focus:border-accent-indigo outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5 block">Company</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-surface border border-white/10 text-sm text-foreground focus:border-accent-indigo outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5 block">Currently Building (Bio)</label>
            <textarea required value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} className="w-full h-24 p-4 rounded-xl bg-surface border border-white/10 text-sm text-foreground focus:border-accent-indigo outline-none resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5 block">Looking For</label>
            <textarea required value={formData.looking_for} onChange={e => setFormData({...formData, looking_for: e.target.value})} className="w-full h-24 p-4 rounded-xl bg-surface border border-white/10 text-sm text-foreground focus:border-accent-indigo outline-none resize-none" />
          </div>
        </div>

        {/* The New Skills Editor */}
        <div className="pt-4 border-t border-white/5">
          <label className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent-indigo" /> Manage Arsenal
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SKILLS.map(skill => {
              const isSelected = formData.skills.includes(skill);
              return (
                <button
                  type="button"
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
        </div>

        <button 
          type="submit" 
          disabled={isPending || isUploading}
          className="w-full h-14 rounded-2xl bg-accent-indigo text-white font-semibold text-base shadow-glow-indigo flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save & Re-Vectorize</>}
        </button>
      </form>
    </main>
  );
}