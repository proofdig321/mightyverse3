'use client';

import React, { useState, useRef, useEffect } from 'react';

interface HolographicPlayerProps {
  title: string;
  artist: string;
  duration: number;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function HolographicPlayer({ 
  title, 
  artist, 
  duration, 
  onPlay,
  onPause 
}: HolographicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [holographicIntensity, setHolographicIntensity] = useState(0.7);
  const animationRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, duration]);

  const togglePlay = () => {
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);
    
    if (newPlayState) {
      onPlay?.();
    } else {
      onPause?.();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mv-card mv-holographic relative overflow-hidden">
      {/* 2.5D Holographic Viewport */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
        {/* Background Layer */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/30"
          style={{
            transform: `translateZ(${holographicIntensity * -20}px)`,
            filter: `blur(${holographicIntensity * 2}px)`
          }}
        />
        
        {/* Main Holographic Element */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translateZ(${holographicIntensity * 10}px) rotateY(${isPlaying ? currentTime * 2 : 0}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          <div 
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-green-400 to-blue-400 shadow-2xl"
            style={{
              boxShadow: `0 0 ${holographicIntensity * 50}px rgba(212, 175, 55, 0.6)`,
              animation: isPlaying ? 'spin 4s linear infinite, pulse 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite'
            }}
          >
            <div className="absolute inset-4 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">◈</span>
            </div>
            
            {/* Holographic Rings */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border-2 border-yellow-400/30"
                style={{
                  inset: `-${(i + 1) * 20}px`,
                  animation: `ping ${2 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={togglePlay}>
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-2xl">
              {isPlaying ? '⏸' : '▶'}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="absolute top-4 left-4 flex space-x-2">
          <div className="bg-black/70 px-2 py-1 rounded text-xs text-green-400">2.5D</div>
          <div className="bg-black/70 px-2 py-1 rounded text-xs text-yellow-400">HOLOGRAPHIC</div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-green-400 flex items-center justify-center text-xl font-bold text-black flex-shrink-0">
              ◈
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mv-heading-sm truncate">{title}</h3>
              <p className="mv-text-accent text-sm truncate">by {artist}</p>
            </div>
          </div>
          <div className="text-sm mv-text-muted text-center sm:text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Progress */}
        <div 
          className="h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-green-400 text-black text-xl font-bold hover:scale-110 transition-transform mv-touch-target"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors mv-touch-target">⏮</button>
            <button className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors mv-touch-target">⏭</button>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs mv-text-muted">2.5D</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={holographicIntensity}
                onChange={(e) => setHolographicIntensity(parseFloat(e.target.value))}
                className="w-16 sm:w-20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}