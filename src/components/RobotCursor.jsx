import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import "./RobotCursor.css";

export default function RobotCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const x = useSpring(mouseX, { stiffness: 220, damping: 25 });
  const y = useSpring(mouseY, { stiffness: 220, damping: 25 });
  const [clicking, setClicking] = useState(false);
  const [overInteractive, setOverInteractive] = useState(false);
  const clickTimeout = useRef(null);
  const pointerPosition = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const updateInteractiveTarget = (x, y) => {
      const target = document.elementFromPoint(x, y);
      const isInteractive = target instanceof Element
        && target.closest("input, select, textarea, button, a, [role='button'], [role='combobox']");
      setOverInteractive(Boolean(isInteractive));
    };
    const moveCursor = (event) => {
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
      updateInteractiveTarget(event.clientX, event.clientY);
    };
    const refreshInteractiveTarget = () => {
      const { x, y } = pointerPosition.current;
      updateInteractiveTarget(x, y);
    };
    const handleMouseDown = () => {
      setClicking(true);
      window.clearTimeout(clickTimeout.current);
      clickTimeout.current = window.setTimeout(() => setClicking(false), 250);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", refreshInteractiveTarget, true);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", refreshInteractiveTarget, true);
      window.clearTimeout(clickTimeout.current);
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    document.body.classList.toggle("robot-cursor-interactive", overInteractive);
    return () => document.body.classList.remove("robot-cursor-interactive");
  }, [overInteractive]);

  return (
    <motion.div
      className={`robot-cursor${overInteractive ? " robot-cursor-hidden" : ""}`}
      style={{ x, y }}
      animate={{ scale: clicking ? 0.78 : 1, rotate: clicking ? -12 : 0 }}
      aria-hidden="true"
    >
      <div className="robot-glow" />
      <motion.img
        src="/Cheerful%20Neon%20Server%20Robot%20in%20Flight-1.png"
        alt=""
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
