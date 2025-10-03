import React, { useEffect, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  delay: number;
}

const LoginParticles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(255, 255, 255, 0.6)',  // White
  ];

  const createParticle = (id: number): Particle => ({
    id,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight, // Posição aleatória em toda a tela
    size: Math.random() * 3 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: Math.random() * 0.5 + 0.2,
    delay: Math.random() * 5,
  });

  const updateParticles = () => {
    if (!containerRef.current) return;

    particlesRef.current = particlesRef.current.map(particle => {
      particle.y -= particle.speed;
      
      // Reset particle when it goes off screen - reposiciona na parte inferior
      if (particle.y < -50) {
        return {
          ...particle,
          y: window.innerHeight + Math.random() * 100,
          x: Math.random() * window.innerWidth,
        };
      }
      
      return particle;
    });

    // Render particles
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      particlesRef.current.forEach(particle => {
        const particleElement = document.createElement('div');
        particleElement.className = 'particle';
        particleElement.style.left = `${particle.x}px`;
        particleElement.style.top = `${particle.y}px`;
        particleElement.style.width = `${particle.size}px`;
        particleElement.style.height = `${particle.size}px`;
        particleElement.style.background = `radial-gradient(circle, ${particle.color} 0%, ${particle.color.replace('0.8', '0.4')} 50%, transparent 100%)`;
        particleElement.style.boxShadow = `0 0 ${particle.size * 2}px ${particle.color}`;
        particleElement.style.animationDelay = `${particle.delay}s`;
        
        containerRef.current?.appendChild(particleElement);
      });
    }

    animationRef.current = requestAnimationFrame(updateParticles);
  };

  useEffect(() => {
    // Create initial particles
    const particleCount = Math.min(50, Math.floor(window.innerWidth / 20));
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => createParticle(i));

    // Start animation
    updateParticles();

    // Handle resize
    const handleResize = () => {
      const newParticleCount = Math.min(50, Math.floor(window.innerWidth / 20));
      if (newParticleCount !== particlesRef.current.length) {
        particlesRef.current = Array.from({ length: newParticleCount }, (_, i) => createParticle(i));
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={containerRef} className="particles-container" />;
};

export default LoginParticles;
