"use client";

import Photobooth from "@/components/Photobooth";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#030014] selection:bg-cyan-500/30">
      
      {/* 1. Interactive Cursor Glow (Follows Mouse) */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_50%)]"
        animate={{
          x: mousePosition.x - 400,
          y: mousePosition.y - 400,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.8 }}
      />

      {/* 2. Vibrant Animated Aurora Backgrounds */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Large Indigo Orb */}
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ willChange: "transform" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-600/5 to-transparent blur-[80px]" 
        />
        
        {/* Large Fuchsia Orb */}
        <motion.div 
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ willChange: "transform" }}
          className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-600/20 via-pink-500/5 to-transparent blur-[90px]" 
        />
        
        {/* Floating Cyan Orb */}
        <motion.div 
          animate={{ 
            y: [0, -100, 0],
            x: [0, 50, 0],
            scale: [1, 1.2, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: "transform" }}
          className="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-400/20 via-blue-400/5 to-transparent blur-[70px]" 
        />
        
        {/* 3. Static Grid Overlay for performance instead of animated mix-blend */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHBhdGggZD0iTTAgMGg4MHY4MEgwVjB6bTQwIDQwaDQwdjQwSDQwdi00MHptLTQwIDBoNDB2NDBIMHYtNDB6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-10 pointer-events-none" />
      </div>

      <main className="relative z-10 flex flex-col min-h-screen py-12 px-4 sm:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto flex flex-col items-center text-center mb-12 mt-4"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/20 text-white/90 text-xs sm:text-sm font-medium mb-6 backdrop-blur-xl shadow-[0_0_30px_rgba(56,189,248,0.2)]"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="tracking-wide">Interactive Aurora Experience</span>
          </motion.div>
          
          <h1 className="text-5xl sm:text-7xl font-sans font-black tracking-tighter text-white mb-6 drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] leading-tight">
            Capture Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-sm">Vibe.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-white/70 max-w-xl font-medium leading-relaxed drop-shadow-md">
            Welcome to <b className="text-white">Blured Frame</b>. Step into the virtual photobooth, apply stunning aesthetics, snap your moment, and export the perfect photostrip directly from your browser.
          </p>
        </motion.div>

        {/* Photobooth Application */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex-grow w-full"
        >
          <Photobooth />
        </motion.div>

        {/* Footer Copyright */}
        <footer className="mt-auto pt-16 pb-4 text-center">
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest hover:text-white/80 transition-colors cursor-default drop-shadow-md">
            &copy; {new Date().getFullYear()} Gabriel Adetya Utomo. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
