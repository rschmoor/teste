"use client"

import { motion, AnimatePresence, type MotionProps } from "framer-motion"
import { ReactNode, type ComponentProps } from "react"

// Fade in animation
export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = ""
}: { 
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Slide in from side
export function SlideIn({ 
  children, 
  direction = "left",
  delay = 0,
  duration = 0.3,
  className = ""
}: { 
  children: ReactNode
  direction?: "left" | "right" | "up" | "down"
  delay?: number
  duration?: number
  className?: string
}) {
  const variants = {
    left: { x: -100, opacity: 0 },
    right: { x: 100, opacity: 0 },
    up: { y: -100, opacity: 0 },
    down: { y: 100, opacity: 0 }
  }

  return (
    <motion.div
      initial={variants[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={variants[direction]}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Scale animation for buttons
export type ScaleButtonProps = Omit<ComponentProps<typeof motion.button>, "whileHover" | "whileTap" | "children"> & {
  children: ReactNode
  className?: string
  whileHover?: MotionProps["whileHover"]
  whileTap?: MotionProps["whileTap"]
}

export function ScaleButton({ 
  children, 
  className = "",
  whileHover = { scale: 1.05 },
  whileTap = { scale: 0.95 },
  ...props
}: ScaleButtonProps) {
  return (
    <motion.button
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Stagger children animation
export function StaggerContainer({ 
  children, 
  staggerDelay = 0.1,
  className = ""
}: { 
  children: ReactNode
  staggerDelay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Individual stagger item
export function StaggerItem({ 
  children, 
  className = ""
}: { 
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Success animation with checkmark
export function SuccessAnimation({ 
  show, 
  onComplete,
  size = 60
}: { 
  show: boolean
  onComplete?: () => void
  size?: number
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.6
          }}
          onAnimationComplete={onComplete}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-green-500 rounded-full flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              width={size * 0.6}
              height={size * 0.6}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path d="M20 6L9 17l-5-5" />
            </motion.svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Cart slide animation
export function CartSlide({ 
  children, 
  isOpen,
  onClose
}: { 
  children: ReactNode
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Slide panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Bounce animation for notifications
export function BounceNotification({ 
  children, 
  show,
  className = ""
}: { 
  children: ReactNode
  show: boolean
  className?: string
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 50 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 25 
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hover card animation
export function HoverCard({ 
  children, 
  className = ""
}: { 
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ 
        y: -8, 
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}