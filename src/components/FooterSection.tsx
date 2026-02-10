import { motion } from "framer-motion";

const FooterSection = () => {
  return (
    <footer className="relative z-10 py-16 border-t border-border/30">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.p
          className="text-muted-foreground text-sm font-body"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="text-primary">✦</span>{" "}
          Built with passion across the Skill Universe{" "}
          <span className="text-primary">✦</span>
        </motion.p>
      </div>
    </footer>
  );
};

export default FooterSection;
