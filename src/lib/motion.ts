import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion presets — one source of truth for timing + easing so
 * transitions feel consistent across the whole app instead of a flat
 * "one duration for everything".
 */

/** Fast, snappy spring for micro-interactions (buttons, chips, icons). */
export const springFast: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.6,
};

/** Default spring for cards, modals, toggles. */
export const springDefault: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.8,
};

/** Soft spring for large surfaces (sidebar, drawers). */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 0.9,
};

/** Shared cubic-bezier easings. */
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;
export const easeSoft = [0.33, 1, 0.68, 1] as const;

/** Fade + rise, the standard entrance for panels and sections. */
export const fadeUp = (distance = 24, delay = 0): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut, delay },
  },
});

/** Simple fade used for overlays / full-screen layers. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: easeOut } },
};

/** Scale-in for modals and popovers. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
};