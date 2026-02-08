"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";

export default function BottomSheet({ open, onClose, children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const overlayVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const sheetVariants = {
    visible: {
      y: 0,
      transition: { ease: "easeInOut", duration: 0.15 },
    },
    hidden: {
      y: "100%",
      transition: { ease: "anticipate" },
    },
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="z-67670 fixed inset-0 bg-black/50"
            onClick={onClose}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />
          <motion.div
            className="border-b-128 z-67670 fixed bottom-0 left-1/2 top-8 -mb-32 w-full max-w-xl -translate-x-1/2 rounded-t-xl border-gray-800 bg-gray-800 text-white shadow-lg"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document?.body,
  );
}
