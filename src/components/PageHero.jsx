import { motion } from "framer-motion";

export default function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden border-b border-navy/10 bg-white text-navy">
      <motion.div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-[4rem] border-[28px] border-orange/20"
        initial={{ rotate: 0, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 45, scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="h-2 w-10 rounded-full bg-gradient-to-r from-orange to-orange-light" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{eyebrow}</p>
          </motion.div>
          <motion.h1
            className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              className="mt-5 max-w-xl text-navy/70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              {description}
            </motion.p>
          )}
        </div>
        {children && (
          <motion.div
            className="overflow-hidden rounded-3xl border-2 border-navy bg-gradient-to-b from-white to-[#eef2f6] shadow-[10px_10px_0_0_#E28A2E]"
            initial={{ opacity: 0, rotateY: -30, x: 40 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1000 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
