import { motion } from "framer-motion";
import SkillNode, { type Skill } from "./SkillNode";

interface SkillCategory {
  name: string;
  icon: string;
  color: "primary" | "secondary" | "accent";
  skills: Skill[];
}

const categories: SkillCategory[] = [
  {
    name: "Frontend",
    icon: "🌐",
    color: "primary",
    skills: [
      { name: "React", level: 92, color: "primary" },
      { name: "TypeScript", level: 88, color: "primary" },
      { name: "CSS/Tailwind", level: 90, color: "primary" },
      { name: "Next.js", level: 78, color: "primary" },
      { name: "Vue.js", level: 65, color: "primary" },
    ],
  },
  {
    name: "Backend",
    icon: "⚡",
    color: "secondary",
    skills: [
      { name: "Node.js", level: 85, color: "secondary" },
      { name: "Python", level: 80, color: "secondary" },
      { name: "PostgreSQL", level: 75, color: "secondary" },
      { name: "GraphQL", level: 70, color: "secondary" },
      { name: "Docker", level: 68, color: "secondary" },
    ],
  },
  {
    name: "Design & Tools",
    icon: "✨",
    color: "accent",
    skills: [
      { name: "Figma", level: 82, color: "accent" },
      { name: "Motion Design", level: 73, color: "accent" },
      { name: "Git", level: 90, color: "accent" },
      { name: "CI/CD", level: 72, color: "accent" },
      { name: "Testing", level: 76, color: "accent" },
    ],
  },
];

// Generate positions in clusters
const generatePositions = (categoryIndex: number, skillCount: number) => {
  const centerX = 20 + categoryIndex * 30;
  const centerY = 50;
  const radius = 14;

  return Array.from({ length: skillCount }, (_, i) => {
    const angle = (i / skillCount) * Math.PI * 2 - Math.PI / 2;
    return {
      x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 6,
      y: centerY + Math.sin(angle) * radius * 1.2 + (Math.random() - 0.5) * 6,
    };
  });
};

const colorClasses = {
  primary: "text-primary border-primary/30 bg-primary/5",
  secondary: "text-secondary border-secondary/30 bg-secondary/5",
  accent: "text-accent border-accent/30 bg-accent/5",
};

const SkillConstellation = () => {
  return (
    <section className="relative w-full min-h-[80vh] py-20">
      {/* Section header */}
      <div className="text-center mb-8 relative z-10">
        <motion.h2
          className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Skill Constellations
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Hover over each star to explore proficiency levels
        </motion.p>
      </div>

      {/* Category labels */}
      <div className="flex justify-center gap-6 mb-12 relative z-10 flex-wrap px-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            className={`px-4 py-2 rounded-full border ${colorClasses[cat.color]} font-display text-sm font-medium`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 + 0.3 }}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </motion.div>
        ))}
      </div>

      {/* Skill nodes */}
      <div className="relative w-full h-[500px] max-w-6xl mx-auto">
        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {categories.map((cat, catIndex) => {
            const positions = generatePositions(catIndex, cat.skills.length);
            const centerX = 20 + catIndex * 30;
            const centerY = 50;
            return positions.map((pos, i) => (
              <motion.line
                key={`${catIndex}-${i}`}
                x1={`${centerX}%`}
                y1={`${centerY}%`}
                x2={`${pos.x}%`}
                y2={`${pos.y}%`}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.3 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.2 + i * 0.05, duration: 0.6 }}
              />
            ));
          })}
        </svg>

        {/* Category center nodes */}
        {categories.map((cat, catIndex) => {
          const centerX = 20 + catIndex * 30;
          const centerY = 50;
          return (
            <motion.div
              key={`center-${cat.name}`}
              className="absolute text-2xl"
              style={{ left: `${centerX}%`, top: `${centerY}%`, transform: "translate(-50%, -50%)" }}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.2, type: "spring" }}
            >
              {cat.icon}
            </motion.div>
          );
        })}

        {/* Skill nodes */}
        {categories.map((cat, catIndex) => {
          const positions = generatePositions(catIndex, cat.skills.length);
          return cat.skills.map((skill, skillIndex) => (
            <SkillNode
              key={`${cat.name}-${skill.name}`}
              skill={skill}
              index={catIndex * 5 + skillIndex}
              x={positions[skillIndex].x}
              y={positions[skillIndex].y}
            />
          ));
        })}
      </div>
    </section>
  );
};

export default SkillConstellation;
