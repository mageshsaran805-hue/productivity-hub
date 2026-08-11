"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4447", "#ec4899"];

function createParticle(id: number) {
  return {
    id,
    x: Math.random() * 100,
    y: -10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 0.3,
    shape: Math.random() > 0.5 ? "circle" : "square" as const,
  };
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<ReturnType<typeof createParticle>[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 40 }, (_, i) => createParticle(i));
      setParticles(newParticles);
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [trigger, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: `${p.x}vw`,
              y: `${p.y}vh`,
              rotate: p.rotation,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              y: "110vh",
              rotate: p.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: 0,
              scale: 0.5,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute"
            style={{
              left: `${p.x}vw`,
              top: 0,
            }}
          >
            <div
              className={p.shape === "circle" ? "rounded-full" : "rounded-sm"}
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === "circle" ? "50%" : "2px",
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useConfetti() {
  const [show, setShow] = useState(false);

  const fire = useCallback(() => {
    setShow(true);
    setTimeout(() => setShow(false), 100);
  }, []);

  return { show, fire };
}
