import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "./ConnectRobotAnimation.css";

export default function ConnectRobotAnimation({ onConnect, canSubmit }) {
  const [flying, setFlying] = useState(false);
  const timeoutRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const handleConnect = () => {
    if (flying || !canSubmit()) return;

    setFlying(true);
    timeoutRef.current = window.setTimeout(() => {
      setFlying(false);
      onConnect();
    }, shouldReduceMotion ? 0 : 1000);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleConnect}
        disabled={flying}
        className="connect-server-btn"
      >
        {flying ? "Connecting..." : "Connect to server"}
      </button>

      <AnimatePresence>
        {flying && (
          <motion.div
            key="flying-robot"
            className="flying-robot-box"
            aria-hidden="true"
            initial={shouldReduceMotion
              ? { opacity: 0 }
              : { x: "-20vw", y: 0, rotate: -8, scale: 0.6, opacity: 0 }}
            animate={shouldReduceMotion
              ? { opacity: 0 }
              : {
                x: "110vw",
                y: [0, -90, 40, -50, 0],
                rotate: [0, 5, -4, 3, 0],
                scale: [0.6, 1.2, 1],
                opacity: [0, 1, 1, 1, 0],
              }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 1, ease: "easeInOut" }}
          >
            <span className="robot-box-scanline" />
            <img
              src="/Cheerful%20Neon%20Server%20Robot%20in%20Flight-1.png"
              alt=""
              className="flying-robot-image"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
