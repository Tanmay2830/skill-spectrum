import { motion } from "framer-motion";

const stats = [
  { label: "Technologies", value: "15+", icon: "🛸" },
  { label: "Projects Built", value: "50+", icon: "🚀" },
  { label: "Years Experience", value: "5+", icon: "⭐" },
  { label: "Lines of Code", value: "200K+", icon: "💫" },
];

const StatsBar = () => {
  return (
    <section className="relative z-10 py-16 border-y border-border/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <span className="text-3xl md:text-4xl font-display font-bold text-foreground block mb-1">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground font-body">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
