import React, { useState, useEffect, useRef } from "react";

interface StreamingTextProps {
  text: string;
  className?: string;
  speed?: number; // characters per frame
  onComplete?: () => void;
}

/**
 * StreamingText — Renders text character by character for a streaming AI feel.
 * Used when we have the full text but want to animate it in.
 * For real SSE streaming, use the chunk-based approach in AiChatPanel.
 */
export function StreamingText({ text, className, speed = 3, onComplete }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    // Reset on text change
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (done) return;

    const interval = setInterval(() => {
      const next = indexRef.current + speed;
      if (next >= textRef.current.length) {
        setDisplayed(textRef.current);
        setDone(true);
        onComplete?.();
        clearInterval(interval);
      } else {
        indexRef.current = next;
        setDisplayed(textRef.current.slice(0, next));
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [done, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-3.5 bg-[#9F86FF] ml-0.5 animate-pulse align-text-bottom" />
      )}
    </span>
  );
}
