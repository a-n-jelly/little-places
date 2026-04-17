import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  MapPin, 
  Link, 
  Search, 
  X, 
  TreePine, 
  Coffee, 
  Landmark, 
  Gamepad2,
  Baby,
  ToyBrick,
  BookOpen,
  Bike,
  Accessibility,
  EarOff,
  Moon,
  ChevronRight,
  Check,
  Smartphone,
  Monitor,
  Info
} from 'lucide-react';
import { Drawer } from 'vaul';

const CATEGORIES = [
  { id: 'parks', label: 'Parks', icon: TreePine },
  { id: 'cafes', label: 'Cafes', icon: Coffee },
  { id: 'museums', label: 'Museums', icon: Landmark },
  { id: 'playgrounds', label: 'Playgrounds', icon: Gamepad2 },
];

const AGES = [
  { id: 'baby', label: 'Baby' },
  { id: 'toddler', label: 'Toddler' },
  { id: 'preschool', label: 'Preschool' },
  { id: 'bigkids', label: 'Big Kids' },
  { id: 'tweens', label: 'Tweens' },
];

const ACCESSIBILITY = [
  { id: 'wheelchair', label: 'Wheelchair', icon: Accessibility },
  { id: 'sensory', label: 'Sensory Friendly', icon: EarOff },
  { id: 'quiet', label: 'Quiet Space', icon: Moon },
  { id: 'changing', label: 'Changing Places', icon: Baby },
];

export function AddPlace() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    category: '',
    ages: [] as string[],
    child_friendly_features: [] as string[],
    description: '',
    url: '',
  });

  const [isPopulating, setIsPopulating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleAge = (id: string) => {
    setFormData(prev => ({
      ...prev,
      ages: prev.ages.includes(id) 
        ? prev.ages.filter(a => a !== id) 
        : [...prev.ages, id]
    }));
  };

  const toggleAccessibility = (id: string) => {
    setFormData(prev => ({
      ...prev,
      child_friendly_features: prev.child_friendly_features.includes(id) 
        ? prev.child_friendly_features.filter(a => a !== id) 
        : [...prev.child_friendly_features, id]
    }));
  };

  const handleSmartPopulate = (value: string) => {
    if (!value) return;
    setIsPopulating(true);
    // Mock auto-population
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        name: value.includes('http') ? 'Discovery Park' : value,
        address: '3801 Discovery Park Blvd, Seattle, WA 98199',
        category: 'parks',
        ages: ['baby', 'toddler', 'preschool'],
        child_friendly_features: ['wheelchair', 'sensory'],
        description: 'A beautiful natural park with amazing views of the Sound. Perfect for families!',
      }));
      setIsPopulating(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsOpen(false);
    }, 3000);
  };

  const FormContent = () => (
    <div className="px-5 pb-10 pt-8 max-w-2xl mx-auto relative">
      {/* Blueprint Grid Lines for design alignment */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
           style={{ 
             backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }} />
      
      <header className="mb-8 text-center relative z-10">
        <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-6 md:hidden" />
        <h2 className="text-2xl font-bold text-foreground mb-2 px-4 leading-tight">
          Add a great spot
        </h2>
        <p className="text-sm text-muted-foreground font-medium italic">For our parent community</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Smart Search / URL */}
        <section className="bg-sage/5 p-4 rounded-2xl border border-sage/10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage/40" size={18} />
            <input 
              type="text" 
              placeholder="Paste URL or type name to auto-fill..."
              className="w-full bg-white border border-black/5 focus:border-sage/30 rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none transition-[color,background-color,border-color,box-shadow] duration-100 ease-out shadow-sm"
              onBlur={(e) => handleSmartPopulate(e.target.value)}
            />
            {isPopulating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-sage/20 border-t-sage rounded-full"
                />
              </div>
            )}
          </div>
        </section>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Place Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Discovery Park"
              className="w-full bg-off-white border border-black/5 focus:border-coral/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition-[color,background-color,border-color,box-shadow] duration-100 ease-out"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={14} />
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Location"
                className="w-full bg-off-white border border-black/5 focus:border-coral/30 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold outline-none transition-[color,background-color,border-color,box-shadow] duration-100 ease-out"
              />
            </div>
          </div>
        </div>

        {/* Category & Ages Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat.id})}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-[color,background-color,border-color,box-shadow] duration-100 ease-out text-xs font-bold",
                    formData.category === cat.id 
                      ? "bg-sage border-sage text-white shadow-sm" 
                      : "bg-white border-black/5 text-muted-foreground hover:border-sage/20"
                  )}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Ages</label>
            <div className="flex flex-wrap gap-1.5">
              {AGES.map((age) => (
                <button
                  key={age.id}
                  type="button"
                  onClick={() => toggleAge(age.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-[color,background-color,border-color,box-shadow] duration-100 ease-out border",
                    formData.ages.includes(age.id)
                      ? "bg-yellow border-yellow text-foreground"
                      : "bg-white border-black/5 text-muted-foreground hover:border-yellow/20"
                  )}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accessibility Grid */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Accessibility</label>
          <div className="grid grid-cols-2 gap-2">
            {ACCESSIBILITY.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => toggleAccessibility(acc.id)}
                className={cn(
                  "flex items-center gap-2.5 p-2 rounded-xl border transition-[color,background-color,border-color,box-shadow] duration-100 ease-out text-left",
                  formData.child_friendly_features.includes(acc.id)
                    ? "bg-sage/5 border-sage text-sage font-bold"
                    : "bg-white border-black/5 text-muted-foreground hover:border-sage/10"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                  formData.child_friendly_features.includes(acc.id) ? "bg-sage text-white" : "bg-off-white"
                )}>
                  <acc.icon size={14} />
                </div>
                <span className="text-[10px] font-bold leading-tight">{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description Row */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Notes</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={2}
            placeholder="What makes it special?"
            className="w-full bg-off-white border border-black/5 focus:border-coral/30 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-[color,background-color,border-color,box-shadow] duration-100 ease-out resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button 
            type="submit"
            disabled={!formData.name || isSubmitted}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-[color,background-color,border-color,box-shadow,transform] duration-100 ease-out flex items-center justify-center gap-2 relative overflow-hidden",
              isSubmitted 
                ? "bg-green-500 text-white" 
                : "bg-coral text-white shadow-coral/20 hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50"
            )}
          >
            {isSubmitted ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check size={18} strokeWidth={3} />
                Success!
              </motion.div>
            ) : (
              <>
                Save Place
                <PlusCircle size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-off-white p-6 md:p-12 pb-32">
      {/* Design Showcase Header */}
      <div className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="inline-block px-4 py-1.5 bg-coral/10 text-coral rounded-full text-xs font-black uppercase tracking-widest mb-4">Design Preview</span>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Add a Place</h1>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-black/5 text-sm font-bold text-muted-foreground">
             <Smartphone size={16} /> Mobile View
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-black/5 text-sm font-bold text-muted-foreground">
             <Monitor size={16} /> Desktop View
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-16 items-start justify-center">
        
        {/* MOBILE VIEW (Interactive Bottom Sheet) */}
        <div className="w-full max-w-[400px] flex flex-col items-center gap-8 mx-auto xl:mx-0">
          <div className="relative w-full aspect-[9/19.5] bg-slate-900 rounded-[3.5rem] p-3 shadow-2xl border-[8px] border-slate-800 overflow-hidden ring-[12px] ring-black/5">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Mobile Content Screen */}
            <div className="w-full h-full bg-off-white rounded-[2.5rem] overflow-hidden relative">
              <div className="p-8 pt-16">
                <div className="w-16 h-16 bg-coral rounded-2xl mb-8 flex items-center justify-center shadow-lg shadow-coral/20">
                  <PlusCircle size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-foreground mb-4">Contribute to the community</h3>
                <p className="text-muted-foreground font-medium mb-12">Help Seattle parents find their next favorite "little place".</p>
                
                <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
                  <Drawer.Trigger asChild>
                    <button className="w-full bg-coral text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-coral/30 flex items-center justify-center gap-3 active:scale-95 transition-[color,background-color,transform,box-shadow] duration-100 ease-out">
                      Add a Place
                      <ChevronRight size={20} strokeWidth={3} />
                    </button>
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                    <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] h-[92%] mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none">
                      <Drawer.Title className="sr-only">Add a New Place</Drawer.Title>
                      <Drawer.Description className="sr-only">Contribute a child-friendly spot to the Seattle community.</Drawer.Description>
                      <div className="flex-1 overflow-y-auto rounded-t-[3rem] scrollbar-hide">
                        <FormContent />
                      </div>
                    </Drawer.Content>
                  </Drawer.Portal>
                </Drawer.Root>
              </div>

              {/* Fake Mobile App Bar */}
              <div className="absolute bottom-4 left-4 right-4 h-16 bg-white rounded-2xl shadow-lg border border-black/5 flex items-center justify-around px-4">
                 <div className="w-8 h-8 rounded-full bg-sage/20" />
                 <div className="w-8 h-8 rounded-full bg-coral" />
                 <div className="w-8 h-8 rounded-full bg-sage/20" />
              </div>
            </div>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-white px-6 py-2 rounded-full shadow-sm">Interactive Mobile Demo</span>
        </div>

        {/* DESKTOP VIEW (Layout Integration) */}
        <div className="flex-1 w-full bg-white rounded-[3rem] shadow-2xl border border-black/5 overflow-hidden flex flex-col min-h-[900px]">
          <div className="h-20 border-b border-black/5 flex items-center justify-between px-10">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-coral rounded-xl flex items-center justify-center">
                 <PlusCircle size={18} className="text-white" />
               </div>
               <span className="font-black text-lg">Little Places</span>
             </div>
             <div className="flex gap-6 items-center">
               <div className="w-32 h-2 bg-black/5 rounded-full" />
               <div className="w-20 h-2 bg-black/5 rounded-full" />
               <div className="w-10 h-10 rounded-full bg-sage/10 border-2 border-white shadow-sm" />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-off-white/50 scrollbar-hide">
             <div className="max-w-3xl mx-auto py-16">
                <div className="bg-white rounded-[4rem] shadow-sm border border-black/5 overflow-hidden">
                   <FormContent />
                </div>
             </div>
          </div>
          <div className="p-6 text-center border-t border-black/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white">
            Desktop Form Layout
          </div>
        </div>

      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
