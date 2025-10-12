import React, { useMemo } from "react";
import "./SparkleOverlay.css";

const PARTICLE_COUNT = 18; // change number of sparkles

export default function SparkleOverlay({ show = false }) {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      id: index,
      size: Math.random() * 14 + 10,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: Math.random() * 4 + 6,
    }));
  }, []);

  if (!show) return null;

  return (
    <div className="sparkle-overlay">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="sparkle-particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
