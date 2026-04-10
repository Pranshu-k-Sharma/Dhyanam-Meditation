import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

export default function SplitText({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "0px",
  textAlign = "left",
  onLetterAnimationComplete,
  showCallback = false,
}) {
  const pieces = useMemo(() => {
    if (splitType === "words") {
      return text
        .split(" ")
        .flatMap((word, index, array) => [
          { value: word, key: `${word}-${index}` },
          ...(index < array.length - 1 ? [{ value: " ", key: `space-${index}` }] : []),
        ]);
    }

    return Array.from(text).map((char, index) => ({
      value: char === " " ? "\u00A0" : char,
      key: `${char === " " ? "space" : char}-${index}`,
    }));
  }, [splitType, text]);

  useEffect(() => {
    if (!showCallback || typeof onLetterAnimationComplete !== "function") {
      return;
    }

    const totalDurationMs = delay * pieces.length + duration * 1000;
    const timer = window.setTimeout(() => {
      onLetterAnimationComplete();
    }, totalDurationMs);

    return () => window.clearTimeout(timer);
  }, [delay, duration, onLetterAnimationComplete, pieces, showCallback]);

  return (
    <div className={className} style={{ textAlign, display: "inline-flex", flexWrap: "wrap", justifyContent: textAlign === "center" ? "center" : undefined }}>
      {pieces.map((piece, index) => (
        <motion.span
          key={piece.key}
          className="inline-block"
          initial={from}
          animate={to}
          transition={{
            delay: (delay / 1000) * index,
            duration,
            ease,
          }}
        >
          {piece.value}
        </motion.span>
      ))}
    </div>
  );
}
