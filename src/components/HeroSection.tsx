import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Nebula background */}
      <div className="absolute inset-0 nebula-bg" />

      {/* Orbital ring decoration */}
      <div className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full border border-border/20 animate-orbit-slow opacity-20" />
      <div className="absolute w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full border border-primary/10 animate-orbit opacity-15" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-sm font-display text-primary">
              ✦ Explore the constellation of abilities
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 leading-tight">
            <span className="text-foreground">Skill</span>
            <br />
            <span className="text-primary text-glow-primary">Universe</span>
          </h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Navigate through an interactive cosmos of skills and expertise.
            Each star represents a capability, each constellation a domain.
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm glow-primary hover:scale-105 transition-transform">
              Explore Skills
            </button>
            <button className="px-8 py-3 rounded-full border border-border text-foreground font-display font-semibold text-sm hover:bg-muted/50 transition-colors">
              View Resume
            </button>
          </motion.div>
        </motion.div>

        {/* Floating skill tags */}
        {["React", "TypeScript", "Node.js", "Design"].map((tag, i) => (
          <motion.span
            key={tag}
            className="absolute hidden md:block text-xs font-display text-muted-foreground/50 border border-border/30 rounded-full px-3 py-1"
            style={{
              left: `${15 + i * 22}%`,
              top: `${20 + (i % 2) * 60}%`,
            }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            {tag}
          </motion.span>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-primary/60" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
