'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

  useEffect(() => {
    setMounted(true);
    // Generate particles only on client side
    const generatedParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 4}s`
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,100,255,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,100,120,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(100,255,200,0.3),transparent_50%)]"></div>
      </div>

      {/* Floating Particles */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <main className="text-center max-w-4xl mx-auto">
          {/* Logo with Animation */}
          <div className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <Image
                className="relative z-10 filter brightness-0 invert"
                src="/next.svg"
                alt="Dating App Logo"
                width={200}
                height={42}
                priority
              />
            </div>
          </div>

          {/* Hero Title */}
          <div className={`mb-6 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Find Your
            </h1>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-shimmer">
              Perfect Match
            </h1>
          </div>

          {/* Subtitle */}
          <div className={`mb-12 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Connect with amazing people through{' '}
              <span className="text-pink-400 font-semibold">live video chat</span> and create 
              meaningful relationships in a safe, fun environment.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link
              href="/video-chat"
              className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/25 transform-gpu animate-pulse-glow"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-3">
                🎥 Start Video Chat
                <span className="inline-block transition-transform group-hover:translate-x-1 group-hover:scale-110">→</span>
              </span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-20 animate-ping"></div>
            </Link>

            <Link
              href="#features"
              className="group px-8 py-4 border-2 border-purple-400 rounded-full text-purple-300 font-semibold text-lg transition-all duration-300 hover:bg-purple-400 hover:text-white hover:scale-105 transform-gpu hover:shadow-lg hover:shadow-purple-400/25"
            >
              <span className="flex items-center gap-3">
                ✨ Learn More
                <span className="inline-block transition-transform group-hover:translate-x-1 group-hover:scale-110">→</span>
              </span>
            </Link>
          </div>

          {/* Features Grid */}
          <div className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <FeatureCard 
              icon="💝"
              title="Safe & Secure"
              description="Advanced privacy features to keep your conversations protected"
              delay="0s"
            />
            <FeatureCard 
              icon="🌍"
              title="Global Community"
              description="Connect with people from around the world instantly"
              delay="0.2s"
            />
            <FeatureCard 
              icon="⚡"
              title="Lightning Fast"
              description="Crystal clear HD video calls with minimal latency"
              delay="0.4s"
            />
          </div>
        </main>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: {
  icon: string;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div 
      className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-xl transform-gpu"
      style={{ animationDelay: delay }}
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
        {description}
      </p>
    </div>
  );
}
