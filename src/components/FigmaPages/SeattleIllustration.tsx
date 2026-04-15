import React from 'react';
import { motion } from 'motion/react';

export function SeattleIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-1">
      <svg 
        viewBox="0 0 400 140" 
        className="w-full h-full max-w-full" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Far Background: Abstract Space Needle - Darker for visibility */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          <path d="M80 110L82.5 50H85.5L88 110H80Z" fill="#2D3436" fillOpacity="0.15" />
          <circle cx="84" cy="46" r="7" fill="#F9E4A0" fillOpacity="0.8" />
        </motion.g>

        {/* Midground: Rolling Hill - Thicker line */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d="M0 120C100 110 200 130 400 115"
          stroke="#2D3436"
          strokeWidth="2"
          strokeOpacity="0.2"
          strokeLinecap="round"
        />

        {/* Destination: A stylized Little Place - Darker outlines */}
        <motion.g
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Small House/Cafe Shape */}
          <path d="M310 115V95C310 93 311 92 313 92H332C334 92 335 93 335 95V115" stroke="#2D3436" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
          <path d="M307 95L322.5 82L338 95" stroke="#2D3436" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
          
          {/* The Location Pin - Solid Primary Color */}
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M318 75C318 68 323 62 330 62C337 62 342 68 342 75C342 85 330 98 330 98C330 98 318 85 318 75Z" fill="#F28B6E" />
            <circle cx="330" cy="75" r="3" fill="white" />
          </motion.g>
        </motion.g>

        {/* The Journey: Connecting Dash Line - Darker for visibility */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
          d="M100 120C140 120 180 95 280 100"
          stroke="#2D3436"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeOpacity="0.3"
          strokeLinecap="round"
        />

        {/* The Explorer: Parent & Stroller - High contrast */}
        <motion.g
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          {/* Parent Silhouette - Solid Sage */}
          <circle cx="70" cy="100" r="6" fill="#A8C5A0" />
          <path d="M63 112C63 108 66 106 70 106C74 106 77 108 77 112V125H63V112Z" fill="#A8C5A0" />
          
          {/* Stroller - Darker outline */}
          <motion.g
            animate={{ rotate: [-0.3, 0.3, -0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M77 118H95L100 108C100 104 95 102 91 102H85" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
            <circle cx="83" cy="125" r="4" stroke="#2D3436" strokeWidth="2" strokeOpacity="0.4" />
            <circle cx="97" cy="125" r="4" stroke="#2D3436" strokeWidth="2" strokeOpacity="0.4" />
          </motion.g>
        </motion.g>

        {/* Atmospheric Detail: Clouds - More visible */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 2, delay: 1.5 }}
        >
          <path d="M240 35C240 31 243 29 246 29C249 29 251 31 251 35C251 38 253 40 256 40C259 40 261 38 261 35C261 31 264 29 267 29C270 29 273 31 273 35C273 39 270 41 267 41H246C243 41 240 39 240 35Z" fill="#636E72" fillOpacity="0.3" />
          <motion.line 
            animate={{ y: [0, 5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            x1="250" y1="45" x2="250" y2="50" stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round" 
          />
        </motion.g>

        {/* Ground Line - Thicker */}
        <path d="M20 128H380" stroke="#2D3436" strokeWidth="1.5" strokeOpacity="0.2" />
      </svg>
    </div>
  );
}
