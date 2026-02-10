import { motion } from "framer-motion";
import { useState } from "react";

export interface Skill {
  name: string;
  level: number; // 0-100
  color: "primary" | "secondary" | "accent";
}

interface SkillNodeProps {
  skill: Skill;
  index: number;
  x: number;
  y: number;
}

const colorMap = {
  primary: {
    bg: "bg-primary/20",
    border: "border-primary/50",
    glow: "glow-primary",
    text: "text-primary",
    bar: "bg-primary",
  },
  secondary: {
    bg: "bg-secondary/20",
    border: "border-secondary/50",
    glow: "glow-secondary",
    text: "text-secondary",
    bar: "bg-secondary",
  },
  accent: {
    bg: "bg-accent/20",
    border: "border-accent/50",
    glow: "glow-accent",
    text: "text-accent",
    bar: "bg-accent",
  },
};

const SkillNode = ({ skill, index, x, y }: SkillNodeProps) => {
  const [hovered, setHovered] = useState(false);
  const colors = colorMap[skill.color];
  const size = 12 + (skill.level / 100) * 20;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 200 }}
    >
      <motion.div
        className="relative cursor-pointer flex items-center justify-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 2,
        }}
      >
        {/* Glow ring */}
        <motion.div
          className={`absolute rounded-full ${colors.bg} border ${colors.border}`}
          style={{ width: size * 3, height: size * 3 }}
          animate={{
            scale: hovered ? 1.3 : 1,
            opacity: hovered ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Core */}
        <motion.div
          className={`relative rounded-full ${colors.bar} ${hovered ? colors.glow : ""}`}
          style={{ width: size, height: size }}
          animate={{ scale: hovered ? 1.2 : 1 }}
          transition={{ duration: 0.2 }}
        />

        {/* Label */}
        <motion.div
          className={`absolute whitespace-nowrap pointer-events-none`}
          style={{ top: size * 1.8 }}
          animate={{ opacity: hovered ? 1 : 0.6 }}
        >
          <span className={`text-xs font-display font-medium ${colors.text}`}>
            {skill.name}
          </span>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-center"
            >
              <span className="text-[10px] text-muted-foreground">
                {skill.level}%
              </span>
              <div className="w-16 h-1 rounded-full bg-muted mt-1 mx-auto">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SkillNode;
