"use client"

import { AnimatePresence, motion } from "framer-motion"

export function AnimatedTabContent({
  tabKey,
  children,
}: {
  tabKey: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
