import { useEffect, useRef } from 'react';

const PARTICLES = ['✦', '✧', '◆', '◇', '●', '○'];
const COLORS = [
  'rgba(248, 242, 231, 0.86)',
  'rgba(209, 191, 163, 0.78)',
  'rgba(28, 18, 8, 0.7)',
];

export default function CursorParticles() {
  const containerRef = useRef(null);
  const particleCountRef = useRef(0);

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let animationFrameId = null;

    const createParticle = (x, y) => {
      if (!containerRef.current) return;

      const particle = document.createElement('div');
      particle.className = 'particle particle-glow';
      
      const symbol = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      
      particle.textContent = symbol;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = color;
      particle.style.--tx = `${Math.cos(angle) * distance}px`;
      particle.style.--ty = `${Math.sin(angle) * distance}px`;
      particle.style.pointerEvents = 'none';
      particle.style.animation = `particle-burst 0.8s ease-out forwards`;
      
      containerRef.current.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 800);
    };

    const handleMouseMove = (e) => {
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const dx = currentX - lastX;
      const dy = currentY - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 15) {
        createParticle(currentX, currentY);
        lastX = currentX;
        lastY = currentY;
        particleCountRef.current = (particleCountRef.current + 1) % 100;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return <div ref={containerRef} className="cursor-particles" />;
}
