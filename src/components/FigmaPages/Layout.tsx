import React from 'react';
import { NavLink, Outlet } from 'react-router';
import { Sparkles, Map, PlusCircle, Home as HomeIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Minimal Brand Icon - a little house with a heart
const BrandIcon = ({ className = "w-10 h-10" }) => (
  <div className={cn("bg-coral rounded-2xl flex items-center justify-center shadow-md shadow-coral/20", className)}>
    <HomeIcon className="text-white w-5 h-5" strokeWidth={2.5} />
  </div>
);

export function Layout() {
  return (
    <div className="min-h-screen bg-off-white flex flex-col font-sans text-foreground">
      {/* Desktop Navigation */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white sticky top-0 z-50 border-b border-black/5">
        <NavLink to="/" className="flex items-center gap-3">
          <BrandIcon />
          <span className="font-bold text-xl tracking-tight text-foreground">Little Places</span>
        </NavLink>
        
        <nav className="flex items-center gap-8">
          <NavLink to="/" className={({ isActive }) => cn("font-medium transition-colors hover:text-coral", isActive ? "text-coral font-bold" : "text-muted-foreground")}>Ask AI</NavLink>
          <NavLink to="/explore" className={({ isActive }) => cn("font-medium transition-colors hover:text-coral", isActive ? "text-coral font-bold" : "text-muted-foreground")}>Explore</NavLink>
          <NavLink to="/add" className="bg-sage text-white px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2">
            <PlusCircle size={20} />
            Add Place
          </NavLink>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-black/5 px-10 pb-8 pt-4 flex justify-between items-center z-50 shadow-lg">
        <NavLink to="/" className={({ isActive }) => cn("flex flex-col items-center gap-1 transition-all", isActive ? "text-coral scale-110" : "text-muted-foreground")}>
          {({ isActive: iconActive }) => (
            <>
              <Sparkles size={24} strokeWidth={iconActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wide">Ask</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/add" className="relative -top-10 bg-coral text-white p-4 rounded-full shadow-xl shadow-coral/30 flex items-center justify-center transform active:scale-90 ring-4 ring-white">
          <PlusCircle size={28} />
        </NavLink>

        <NavLink to="/explore" className={({ isActive }) => cn("flex flex-col items-center gap-1 transition-all", isActive ? "text-sage scale-110" : "text-muted-foreground")}>
          {({ isActive: iconActive }) => (
            <>
              <Map size={24} strokeWidth={iconActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wide">Explore</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
