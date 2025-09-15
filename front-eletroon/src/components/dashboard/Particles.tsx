import React from 'react';

interface ParticleProps {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

const Particle: React.FC<ParticleProps> = ({ x, y, size, color, delay }) => {
  return (
    <div
      className="particle"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

const Particles: React.FC = () => {
  const colors = [
    'rgba(59, 130, 246, 0.6)',
    'rgba(139, 92, 246, 0.6)',
    'rgba(16, 185, 129, 0.6)',
    'rgba(245, 158, 11, 0.6)',
    'rgba(239, 68, 68, 0.6)',
  ];

  const particles = [];
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = Math.random() * 3 + 1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 15;

    particles.push(
      <Particle
        key={i}
        x={x}
        y={y}
        size={size}
        color={color}
        delay={delay}
      />
    );
  }

  return <div className="dashboard-particles">{particles}</div>;
};

export default Particles;
