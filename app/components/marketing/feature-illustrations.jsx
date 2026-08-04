"use client";

import { motion } from "framer-motion";

import { MKT_EASE, useMktMotion } from "./motion";

/** Animated change-request flow — documents + approval path, no human icons */
export function ChangeControlIllustration() {
  const { animate } = useMktMotion();

  return (
    <svg viewBox="0 0 200 160" className="mx-auto h-36 w-full max-w-[220px]" aria-hidden>
      {/* Flow path */}
      <motion.path
        d="M 28 80 H 72 M 128 80 H 172"
        stroke="#0a1550"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={animate ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: MKT_EASE, repeat: Infinity, repeatDelay: 1.5 }}
      />
      {/* Moving pulse along path */}
      {animate ? (
        <>
          <motion.circle
            r="4"
            fill="#c5f042"
            cx={28}
            cy={80}
            animate={{ cx: [28, 72, 72, 128, 172], cy: 80 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
          />
        </>
      ) : null}

      {/* Source doc */}
      <motion.rect
        x="8"
        y="52"
        width="40"
        height="52"
        rx="6"
        fill="white"
        stroke="#0a1550"
        strokeWidth="2"
        animate={animate ? { y: [52, 50, 52] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="16"
        y="64"
        width="24"
        height="3"
        rx="1"
        fill="#c5f042"
        animate={animate ? { opacity: [0.4, 1, 0.4] } : undefined}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <motion.rect x="16" y="72" width="18" height="3" rx="1" fill="#0a1550" opacity="0.2" />
      <motion.rect x="16" y="80" width="20" height="3" rx="1" fill="#0a1550" opacity="0.2" />

      {/* Center gate */}
      <motion.rect
        x="84"
        y="44"
        width="32"
        height="72"
        rx="8"
        fill="#0a1550"
        animate={animate ? { scale: [1, 1.04, 1] } : undefined}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 80px" }}
      />
      <motion.text
        x="100"
        y="72"
        textAnchor="middle"
        fill="#c5f042"
        fontSize="8"
        fontWeight="bold"
        animate={animate ? { opacity: [0.6, 1, 0.6] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        CR
      </motion.text>
      <motion.circle
        cx="100"
        cy="92"
        r="6"
        fill="#4ec0e8"
        animate={animate ? { scale: [1, 1.2, 1] } : undefined}
        transition={{ duration: 1.2, repeat: Infinity }}
      />

      {/* Approved doc */}
      <motion.rect
        x="152"
        y="52"
        width="40"
        height="52"
        rx="6"
        fill="white"
        stroke="#c5f042"
        strokeWidth="2"
        animate={animate ? { y: [52, 48, 52] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      <motion.path
        d="M 164 78 L 172 86 L 184 70"
        stroke="#c5f042"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={animate ? { pathLength: [0, 1, 1, 0] } : { pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.8 }}
      />
    </svg>
  );
}

/** Animated delivery pipeline — nodes + flowing data */
export function PipelineIllustration() {
  const { animate } = useMktMotion();

  return (
    <svg viewBox="0 0 200 160" className="mx-auto h-36 w-full max-w-[220px]" aria-hidden>
      {[
        { x: 24, label: "Board", color: "#ff6b5b" },
        { x: 100, label: "Gantt", color: "#0a1550" },
        { x: 176, label: "Portal", color: "#4ec0e8" },
      ].map((node, i) => (
        <g key={node.label}>
          <motion.rect
            x={node.x - 22}
            y="60"
            width="44"
            height="44"
            rx="10"
            fill="white"
            stroke={node.color}
            strokeWidth="2"
            animate={animate ? { y: [60, 56, 60] } : undefined}
            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
          />
          <text
            x={node.x}
            y="88"
            textAnchor="middle"
            fill="#0a1550"
            fontSize="7"
            fontWeight="bold"
          >
            {node.label}
          </text>
        </g>
      ))}

      <motion.path
        d="M 46 82 H 78 M 122 82 H 154"
        stroke="#0a1550"
        strokeWidth="2"
        strokeDasharray="4 4"
        animate={animate ? { strokeDashoffset: [0, -16] } : undefined}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />

      {animate
        ? [0, 1].map((n) => (
            <motion.circle
              key={n}
              r="5"
              fill="#ffe24a"
              cx={n === 0 ? 46 : 154}
              cy={82}
              animate={{
                cx: n === 0 ? [46, 154] : [154, 46],
                cy: 82,
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: n * 1.1,
                ease: "easeInOut",
              }}
            />
          ))
        : null}
    </svg>
  );
}

/** Animated portal hub — orbital rings, no figurative elements */
export function PortalIllustration() {
  const { animate } = useMktMotion();

  return (
    <svg viewBox="0 0 200 160" className="mx-auto h-36 w-full max-w-[220px]" aria-hidden>
      <motion.circle
        cx="100"
        cy="80"
        r="36"
        fill="none"
        stroke="#4ec0e8"
        strokeWidth="2"
        animate={animate ? { rotate: 360 } : undefined}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "100px 80px" }}
      />
      <motion.ellipse
        cx="100"
        cy="80"
        rx="36"
        ry="12"
        fill="none"
        stroke="#0a1550"
        strokeWidth="1.5"
        animate={animate ? { rotate: -360 } : undefined}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "100px 80px" }}
      />
      <motion.ellipse
        cx="100"
        cy="80"
        rx="36"
        ry="12"
        fill="none"
        stroke="#c5f042"
        strokeWidth="1.5"
        opacity="0.6"
        animate={animate ? { rotate: 360 } : undefined}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "100px 80px" }}
      />

      <motion.circle
        cx="100"
        cy="80"
        r="14"
        fill="#0a1550"
        animate={animate ? { scale: [1, 1.08, 1] } : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 80px" }}
      />
      <motion.circle
        cx="100"
        cy="80"
        r="6"
        fill="#c5f042"
        animate={animate ? { opacity: [0.5, 1, 0.5] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Orbiting status chips */}
      {animate
        ? [0, 120, 240].map((start, i) => (
            <motion.g
              key={start}
              style={{ transformOrigin: "100px 80px" }}
              initial={{ rotate: start }}
              animate={{ rotate: start + 360 }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "linear" }}
            >
              <rect
                x="142"
                y="75"
                width="10"
                height="10"
                rx="2"
                fill={["#ffe24a", "#ff4d8d", "#4ec0e8"][i]}
              />
            </motion.g>
          ))
        : null}
    </svg>
  );
}
