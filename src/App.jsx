import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function App() {
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-orange"
        style={{ scaleX: progress }}
      />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <motion.main
          key={pathname}
          className="flex-1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
