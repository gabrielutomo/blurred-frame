"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Download, RefreshCw, X, Clapperboard, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

type FilterType = "normal" | "grayscale" | "sepia" | "polaroid" | "cyber" | "noir" | "dizzy" | "alien" | "glitch" | "xray" | "quad" | "vhs";
type FrameTheme = "classic" | "dark" | "film" | "neon" | "gradient" | "lany" | "perunggu" | "bruno" | "brat";

const FILTERS: { id: FilterType; name: string }[] = [
  { id: "normal", name: "Normal" },
  { id: "grayscale", name: "Classic B&W" },
  { id: "sepia", name: "Sepia 1990" },
  { id: "polaroid", name: "Polaroid" },
  { id: "cyber", name: "Cyber Glow" },
  { id: "noir", name: "Film Noir" },
  { id: "dizzy", name: "3D Specs" },
  { id: "alien", name: "Alien Base" },
  { id: "glitch", name: "Glitch Art" },
  { id: "xray", name: "X-Ray Eyes" },
  { id: "quad", name: "Quad Mirror" },
  { id: "vhs", name: "VHS Tape" }
];

const FRAMES: { id: FrameTheme; name: string }[] = [
  { id: "classic", name: "Classic" },
  { id: "dark", name: "Matte Black" },
  { id: "film", name: "Retro Film" },
  { id: "neon", name: "Cyberpunk" },
  { id: "gradient", name: "Holographic" },
  { id: "lany", name: "LANY Style" },
  { id: "perunggu", name: "Perunggu" },
  { id: "bruno", name: "Bruno Mars" },
  { id: "brat", name: "BRAT Green" },
];

// Sub-component for Quad Mirror Live Preview
const QuadPreview = ({ stream }: { stream: MediaStream }) => {
    const v1 = useRef<HTMLVideoElement>(null);
    const v2 = useRef<HTMLVideoElement>(null);
    const v3 = useRef<HTMLVideoElement>(null);
    const v4 = useRef<HTMLVideoElement>(null);
  
    useEffect(() => {
      if (stream) {
        if(v1.current) v1.current.srcObject = stream;
        if(v2.current) v2.current.srcObject = stream;
        if(v3.current) v3.current.srcObject = stream;
        if(v4.current) v4.current.srcObject = stream;
      }
    }, [stream]);
  
    return (
      <div className="absolute inset-0 w-full h-full grid grid-cols-2 grid-rows-2 filter-normal">
        {/* Top Left: Mirror normal */}
        <div className="w-full h-full overflow-hidden flex items-end justify-end">
           <video ref={v1} autoPlay playsInline muted className="w-[200%] h-[200%] max-w-none object-cover -scale-x-100" />
        </div>
        {/* Top Right: unmirrored */}
        <div className="w-full h-full overflow-hidden flex items-end justify-start">
           <video ref={v2} autoPlay playsInline muted className="w-[200%] h-[200%] max-w-none object-cover" />
        </div>
        {/* Bottom Left: flipped vertically */}
        <div className="w-full h-full overflow-hidden flex items-start justify-end">
           <video ref={v3} autoPlay playsInline muted className="w-[200%] h-[200%] max-w-none object-cover -scale-x-100 -scale-y-100" />
        </div>
        {/* Bottom Right: flipped horizontally and vertically */}
        <div className="w-full h-full overflow-hidden flex items-start justify-start">
           <video ref={v4} autoPlay playsInline muted className="w-[200%] h-[200%] max-w-none object-cover scale-x-100 -scale-y-100" />
        </div>
      </div>
    );
};

export default function Photobooth() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("normal");
  const [activeFrame, setActiveFrame] = useState<FrameTheme>("classic");
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
      });
      setStream(mediaStream);
      setErrorMsg("");
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMsg("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const captureFrame = () => {
    try {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const size = Math.min(video.videoWidth, video.videoHeight);
            
            // Prevent attempting to draw a 0x0 canvas
            if (size === 0) return null;

            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            
            if (ctx) {
                const startX = (video.videoWidth - size) / 2;
                const startY = (video.videoHeight - size) / 2;

                if (activeFilter === "quad") {
                    const half = size / 2;
                    const subSize = size / 2;
                    const sXCenter = startX + subSize / 2;
                    const sYCenter = startY + subSize / 2;
          
                    ctx.save(); ctx.translate(half, 0); ctx.scale(-1, 1);
                    ctx.drawImage(video, sXCenter, sYCenter, subSize, subSize, 0, 0, half, half); ctx.restore();
          
                    ctx.save(); ctx.translate(half, 0);
                    ctx.drawImage(video, sXCenter, sYCenter, subSize, subSize, 0, 0, half, half); ctx.restore();
          
                    ctx.save(); ctx.translate(half, size); ctx.scale(-1, -1);
                    ctx.drawImage(video, sXCenter, sYCenter, subSize, subSize, 0, 0, half, half); ctx.restore();
          
                    ctx.save(); ctx.translate(half, size); ctx.scale(1, -1);
                    ctx.drawImage(video, sXCenter, sYCenter, subSize, subSize, 0, 0, half, half); ctx.restore();
                } else {
                    ctx.translate(size, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
                }
                
                return canvas.toDataURL("image/png");
            }
        }
    } catch(err) {
        console.error("Failed to capture frame: ", err);
    }
    return null;
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const startPhotoboothSession = async () => {
    if (photos.length >= 4) setPhotos([]);
    setIsCapturing(true);

    let currentPhotos: string[] = [];

    try {
        for (let i = 0; i < 4; i++) {
            // 3 second countdown
            for (let c = 3; c > 0; c--) {
                setCountdown(c);
                await sleep(1000);
            }
            setCountdown(null);
            
            // Allow UI to clear timer before snap
            await sleep(50); 

            // Capture photo
            const photoData = captureFrame();
            if (photoData) {
                currentPhotos.push(photoData);
                setPhotos([...currentPhotos]);
            }

            if (i < 3) {
                await sleep(500);
            }
        }
    } catch (err) {
        console.error("Session error:", err);
    } finally {
        setIsCapturing(false);
    }
  };

  const downloadPhotostrip = async () => {
    if (!stripRef.current) return;
    try {
      const canvas = await html2canvas(stripRef.current, {
        scale: 3, 
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `blured-frame-${activeFrame}-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  // Styles mapper for the Photostrip Frame (Using Pure Tailwind for max reliability)
  const getFrameStyles = (theme: FrameTheme) => {
    switch(theme) {
      case "classic":
        return "bg-white text-black shadow-[0_20px_60px_rgba(0,0,0,0.4)]";
      case "dark":
        return "bg-[#111] text-white shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[#222]";
      case "film":
        return "bg-[#050505] text-amber-500 px-6 border-x-[16px] border-[#222] border-dotted shadow-[0_20px_60px_rgba(0,0,0,0.8)]";
      case "neon":
        return "bg-[#090014] text-fuchsia-400 border-2 border-fuchsia-500 shadow-[0_0_40px_rgba(217,70,239,0.3)]";
      case "gradient":
        return "bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_20px_60px_rgba(236,72,153,0.3)]";
      case "lany":
        return "bg-pink-100 text-pink-900 border-4 border-white shadow-[0_20px_60px_rgba(244,114,182,0.3)]";
      case "perunggu":
        return "bg-amber-900 text-amber-100 font-serif border-[8px] border-amber-950 shadow-[0_15px_50px_rgba(120,53,15,0.5)]";
      case "bruno":
        return "bg-yellow-400 text-black border-4 border-double border-yellow-700 shadow-[0_20px_60px_rgba(250,204,21,0.5)] font-mono";
      case "brat":
        return "bg-[#8ace00] text-black font-sans border-4 border-black shadow-[0_20px_60px_rgba(138,206,0,0.5)] tracking-tighter";
    }
  };

  const getPhotoSlotStyles = (theme: FrameTheme) => {
    switch(theme) {
      case "classic": return "bg-gray-100";
      case "dark": return "bg-[#222] border border-[#333]";
      case "film": return "bg-black border-2 border-[#111] rounded-sm";
      case "neon": return "bg-black border border-fuchsia-500 border-dashed rounded-lg";
      case "gradient": return "bg-white/20 backdrop-blur-sm border border-white/40 rounded-xl";
      case "lany": return "bg-pink-50 border-4 border-pink-200 rounded-md";
      case "perunggu": return "bg-amber-950 border-[3px] border-amber-800";
      case "bruno": return "bg-black border-4 border-yellow-700 rounded-sm";
      case "brat": return "bg-[#ffffff] border-[6px] border-black shadow-[4px_4px_0_0_#000]";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-center p-4">
      {/* LEFT: CAMERA & CONTROLS */}
      <div className="flex-1 w-full max-w-3xl flex flex-col gap-6">
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden glass-dark border border-white/10 shadow-2xl flex items-center justify-center bg-[#050505]">
          {!stream ? (
            <div className="text-center p-6 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <Camera className="w-10 h-10 text-cyan-400/80" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Ready to smile?</h3>
              <p className="text-white/60 mb-8 max-w-xs text-sm">Allow camera access to start your photobooth session.</p>
              <button 
                onClick={startCamera}
                className="bg-white text-black px-8 py-3.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                Start Camera
              </button>
              {errorMsg && <p className="text-red-400 mt-4 text-sm font-medium">{errorMsg}</p>}
            </div>
          ) : (
            <>
              {/* PRIMARY VIDEO INSTANCE */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover -scale-x-100 filter-${activeFilter} ${activeFilter === 'quad' ? 'opacity-0' : 'opacity-100'}`}
              />
              {/* QUAD PREVIEW COMPONENT */}
              {activeFilter === "quad" && <QuadPreview stream={stream} />}

              <AnimatePresence>
                {countdown !== null && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    key={countdown}
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                  >
                    <span className="text-[140px] font-black text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
                      {countdown}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!isCapturing && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                    <button 
                      onClick={startPhotoboothSession}
                      className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.6)]"
                    >
                      <Camera className="w-7 h-7" />
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="w-12 h-12 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                      title="Stop Camera"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* CONTROLS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filter Controls */}
            <div className="glass rounded-2xl p-5 border border-white/10">
                <h4 className="text-white/90 font-semibold mb-4 flex items-center gap-2 text-sm tracking-wide">
                    <Clapperboard className="w-4 h-4 text-cyan-400" /> 
                    Visual Filters
                </h4>
                <div className="grid grid-cols-4 gap-2">
                    {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                        activeFilter === f.id 
                            ? "bg-white/10 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
                            : "border border-transparent hover:bg-white/5"
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-full overflow-hidden filter-${f.id} bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop')] bg-cover bg-center border border-white/20`} />
                        <span className="text-[8px] font-bold text-white/70 text-center uppercase tracking-widest">{f.name}</span>
                    </button>
                    ))}
                </div>
            </div>

            {/* Frame Controls */}
            <div className="glass rounded-2xl p-5 border border-white/10">
                <h4 className="text-white/90 font-semibold mb-4 flex items-center gap-2 text-sm tracking-wide">
                    <LayoutTemplate className="w-4 h-4 text-fuchsia-400" /> 
                    Frame Skin
                </h4>
                <div className="grid grid-cols-3 gap-2">
                    {FRAMES.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFrame(f.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all h-[76px] ${
                        activeFrame === f.id 
                            ? "bg-white/10 border border-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.2)]" 
                            : "border border-white/10 hover:bg-white/5"
                        }`}
                    >
                        <span className={`text-[10px] font-black text-center uppercase tracking-wider ${activeFrame === f.id ? "text-fuchsia-400" : "text-white/70"}`}>
                            {f.name}
                        </span>
                    </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT: PHOTOSTRIP PREVIEW */}
      <div className="w-[320px] flex-shrink-0 flex flex-col items-center gap-6">
        <motion.div 
          ref={stripRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full p-4 pb-16 flex flex-col gap-3 rotate-1 transition-all duration-300 ${getFrameStyles(activeFrame)}`}
        >
           {/* Header */}
           <div className="font-mono text-[10px] flex justify-between px-1 opacity-70 tracking-tight font-bold mb-1">
             <span>{new Date().toLocaleDateString()}</span>
             <span>BLURED FRAME</span>
           </div>

           {/* Photo slots */}
           {[0, 1, 2, 3].map((index) => (
             <div 
                key={index} 
                className={`w-full aspect-square overflow-hidden flex items-center justify-center ${getPhotoSlotStyles(activeFrame)}`}
             >
               {photos[index] ? (
                 <img 
                    src={photos[index]} 
                    alt={`Shot ${index + 1}`} 
                    className={`w-full h-full object-cover ${activeFilter === 'quad' ? '' : `filter-${activeFilter}`}`}
                 />
               ) : (
                 <span className="opacity-20 flex items-center justify-center">
                    <Camera className="w-8 h-8" />
                 </span>
               )}
             </div>
           ))}
           
           {/* Logo / branding at bottom */}
           <div className={`absolute bottom-3 left-0 w-full text-center flex flex-col items-center`}>
              <p className="font-sans font-black tracking-tighter text-[26px]">BLURED FRAME</p>
           </div>
        </motion.div>

        {/* Controls: Always visual so user knows where they are */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 w-full mb-10"
        >
           <button 
              onClick={downloadPhotostrip}
              disabled={photos.length === 0}
              className={`flex-1 font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg ${photos.length === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed opacity-80' : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'}`}
           >
             <Download className="w-5 h-5" /> Download Strip
           </button>
           <button 
              onClick={() => setPhotos([])}
              disabled={photos.length === 0 || isCapturing}
              className={`w-14 flex-shrink-0 rounded-xl flex justify-center items-center transition-colors backdrop-blur-md ${photos.length === 0 ? 'bg-white/5 border border-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'}`}
              title="Retake"
           >
             <RefreshCw className="w-5 h-5" />
           </button>
        </motion.div>
      </div>
    </div>
  );
}
