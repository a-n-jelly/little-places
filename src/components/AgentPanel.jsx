import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Search, Sparkles } from 'lucide-react'
import { useAgentChat } from '../hooks/useAgentChat'
import { AGENT_SUGGESTIONS } from '../lib/agentSuggestions'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

function IllustrationPlaceholder() {
  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-sky to-accent/30 rounded-2xl" />
      <svg viewBox="0 0 400 100" className="absolute bottom-0 w-full" preserveAspectRatio="none">
        <path d="M0 80 Q80 55 160 70 Q240 85 320 60 Q370 45 400 65 L400 100 L0 100Z" fill="var(--sage)" fillOpacity="0.35" />
        <path d="M0 90 Q100 70 200 80 Q300 90 400 78 L400 100 L0 100Z" fill="var(--sage)" fillOpacity="0.5" />
      </svg>
      <svg viewBox="0 0 60 90" className="absolute bottom-4 right-16 h-20 opacity-20">
        <path d="M28 85V45L25 30H35L32 45V85H28Z" fill="var(--foreground)" />
        <path d="M18 35C18 28 22 22 30 22C38 22 42 28 42 35H18Z" fill="var(--foreground)" />
        <circle cx="30" cy="20" r="4" fill="var(--foreground)" />
      </svg>
      <svg viewBox="0 0 100 80" className="relative h-16 mb-1 opacity-40">
        <circle cx="28" cy="28" r="8" fill="var(--sage)" />
        <path d="M20 42C20 36 23 34 28 34C33 34 36 36 36 42V58H20V42Z" fill="var(--sage)" />
        <path d="M36 50H60L65 38C65 34 60 32 56 32H48" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="58" r="5" stroke="var(--foreground)" strokeWidth="2.5" fill="none" />
        <circle cx="60" cy="58" r="5" stroke="var(--foreground)" strokeWidth="2.5" fill="none" />
      </svg>
    </div>
  )
}

export default function AgentPanel({ onBrowse }) {
  const { query, setQuery, response, loading, error, handleSubmit } = useAgentChat()
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center px-6 py-10 text-center md:justify-center overflow-y-auto pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto"
      >
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

        <div className="relative group max-w-xl mx-auto mb-6 px-2">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-[3rem] blur-3xl opacity-100 transition-opacity duration-700" />
          <form
            onSubmit={handleSubmit}
            className="relative bg-card rounded-[2rem] p-1.5 shadow-2xl border-2 border-black/5 flex items-center gap-1 transition-[transform,box-shadow,border-color] duration-150 ease-out focus-within:scale-[1.02] focus-within:ring-8 focus-within:ring-primary/10 focus-within:border-primary/30"
          >
            <div className="pl-5 text-primary">
              <Search size={22} strokeWidth={3} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="A rainy day activity near Ballard..."
              className="flex-1 bg-transparent px-2 py-4 text-base md:text-lg outline-none placeholder:text-muted-foreground/50 font-medium text-foreground"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="bg-primary text-primary-foreground px-6 md:px-8 py-4 rounded-[1.5rem] font-black text-base shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,transform,box-shadow,opacity] duration-100 ease-out flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Ask</span>
                </>
              ) : (
                <>
                  <span>Ask</span>
                  <Sparkles size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-4 mx-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {response && (
          <div className="mb-6 mx-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-foreground leading-relaxed shadow-sm whitespace-pre-wrap text-left">
            {response}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <p className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Popular searches</p>
          {AGENT_SUGGESTIONS.map((s, idx) => (
            <motion.button
              key={s.label}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ scale: 1.05, transition: { type: 'tween', duration: 0.12, ease: 'easeOut' } }}
              whileTap={{ scale: 0.95, transition: { type: 'tween', duration: 0.08 } }}
              onClick={() => setQuery(s.label)}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm border border-white/50', s.color)}
            >
              <s.icon size={16} strokeWidth={2.5} />
              {s.label}
            </motion.button>
          ))}
        </div>

        <div>
          <button
            type="button"
            onClick={onBrowse}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-100 ease-out"
          >
            Browse the map →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
