import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, CloudRain, Sun, Accessibility, MapPin, Star } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Rainy day toddler', icon: CloudRain, color: 'bg-sage text-white' },
  { label: 'Free this weekend', icon: Sun, color: 'bg-yellow text-foreground' },
  { label: 'Sensory friendly', icon: Accessibility, color: 'bg-coral text-white' },
];

const FEATURED = [
  { name: 'Discovery Park', tag: 'Best for: All ages', emoji: '🌿' },
  { name: 'Children\'s Museum', tag: 'Best for: Toddlers', emoji: '🎨' },
  { name: 'Golden Gardens', tag: 'Best for: Summer', emoji: '🏖️' },
];

// Decorative placeholder — replace this component with your Figma import
function IllustrationPlaceholder() {
  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EAF4F8] to-[#F9E4A0]/30 rounded-2xl" />

      {/* Rolling hills */}
      <svg viewBox="0 0 400 100" className="absolute bottom-0 w-full" preserveAspectRatio="none">
        <path d="M0 80 Q80 55 160 70 Q240 85 320 60 Q370 45 400 65 L400 100 L0 100Z" fill="#A8C5A0" fillOpacity="0.35" />
        <path d="M0 90 Q100 70 200 80 Q300 90 400 78 L400 100 L0 100Z" fill="#A8C5A0" fillOpacity="0.5" />
      </svg>

      {/* Space Needle silhouette */}
      <svg viewBox="0 0 60 90" className="absolute bottom-4 right-16 h-20 opacity-20">
        <path d="M28 85V45L25 30H35L32 45V85H28Z" fill="#2D3436" />
        <path d="M18 35C18 28 22 22 30 22C38 22 42 28 42 35H18Z" fill="#2D3436" />
        <circle cx="30" cy="20" r="4" fill="#2D3436" />
      </svg>

      {/* Parent + stroller silhouette */}
      <svg viewBox="0 0 100 80" className="relative h-16 mb-1 opacity-40">
        {/* Parent */}
        <circle cx="28" cy="28" r="8" fill="#A8C5A0" />
        <path d="M20 42C20 36 23 34 28 34C33 34 36 36 36 42V58H20V42Z" fill="#A8C5A0" />
        {/* Stroller */}
        <path d="M36 50H60L65 38C65 34 60 32 56 32H48" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="58" r="5" stroke="#2D3436" strokeWidth="2.5" fill="none" />
        <circle cx="60" cy="58" r="5" stroke="#2D3436" strokeWidth="2.5" fill="none" />
      </svg>

      {/* Dashed path */}
      <svg viewBox="0 0 400 40" className="absolute bottom-6 left-0 w-full opacity-20">
        <path d="M60 25 Q180 10 300 20" stroke="#2D3436" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round" fill="none" />
        {/* Pin */}
        <path d="M290 5C290 1 293 -2 297 -2C301 -2 304 1 304 5C304 11 297 18 297 18C297 18 290 11 290 5Z" fill="#F28B6E" />
        <circle cx="297" cy="5" r="2.5" fill="white" />
      </svg>
    </div>
  );
}

export function Home() {
  const [query, setQuery] = useState('');

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center px-6 py-10 text-center md:justify-center overflow-y-auto pb-32">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto"
      >
        {/* Illustration area — swap SeattleIllustration here once ready */}
        <div className="flex justify-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="w-full max-w-sm h-28 md:h-36 rounded-2xl overflow-hidden relative"
          >
            <IllustrationPlaceholder />
          </motion.div>
        </div>

        <header className="mb-8 px-4">
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-4">
            Where should we go?
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Discover the best Seattle spots for kids, curated by parents who've been there.
          </p>
        </header>

        {/* AI Input Search - Primary Focus */}
        <div className="relative group max-w-xl mx-auto mb-10 px-2">
          <div className="absolute -inset-4 bg-gradient-to-r from-coral/20 via-yellow/20 to-sage/20 rounded-[3rem] blur-3xl opacity-100 transition-opacity duration-700" />
          
          <div className="relative bg-white rounded-[2rem] p-1.5 shadow-2xl border-2 border-black/5 flex items-center gap-1 transition-all focus-within:scale-[1.02] focus-within:ring-8 focus-within:ring-coral/10 focus-within:border-coral/30">
            <div className="pl-5 text-coral">
              <Search size={22} strokeWidth={3} />
            </div>
            <input 
              type="text"
              placeholder="A rainy day activity near Ballard..."
              className="flex-1 bg-transparent px-2 py-4 text-base md:text-lg outline-none placeholder:text-muted-foreground/50 font-medium text-foreground"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="bg-coral text-white px-6 md:px-8 py-4 rounded-[1.5rem] font-black text-base shadow-lg shadow-coral/30 hover:bg-coral/90 active:scale-95 transition-all flex items-center gap-2">
              <span>Go</span>
              <Sparkles size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <p className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Popular searches</p>
          {SUGGESTIONS.map((s, idx) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuery(s.label)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm border border-white/50 ${s.color}`}
            >
              <s.icon size={16} strokeWidth={2.5} />
              {s.label}
            </motion.button>
          ))}
        </div>

        {/* Featured Spots Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-left"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 text-center">Community favorites</p>
          <div className="grid grid-cols-3 gap-3">
            {FEATURED.map((place, i) => (
              <motion.div
                key={place.name}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 cursor-pointer text-center"
              >
                <div className="text-2xl mb-1">{place.emoji}</div>
                <p className="text-xs font-bold text-foreground truncate">{place.name}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{place.tag}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}