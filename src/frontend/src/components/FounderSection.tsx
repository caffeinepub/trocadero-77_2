import { Globe, Linkedin, Quote } from "lucide-react";
import { motion } from "motion/react";

export default function FounderSection() {
  return (
    <section
      id="founder"
      className="relative py-24 px-6 overflow-hidden"
      data-ocid="founder.section"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 60% 50%, oklch(75% 0.15 60 / 0.05) 0%, transparent 65%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-mono text-gold tracking-widest">
              THE VISIONARY
            </span>
          </div>
          <h2 className="section-heading text-4xl md:text-5xl font-bold">
            Meet the <span className="gold-gradient">Founder</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 rounded-full border border-gold/10 animate-spin-slow" />
            </div>
            <div className="relative z-10">
              <div
                className="absolute -inset-3 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(75% 0.15 60 / 0.3), oklch(60% 0.18 25 / 0.1), oklch(62% 0.18 145 / 0.1))",
                  filter: "blur(16px)",
                }}
              />
              <img
                src="/assets/generated/founder-malverin.dim_600x800.jpg"
                alt="Malverin Stonehart"
                className="relative rounded-2xl w-72 h-96 object-cover object-top"
                style={{
                  boxShadow:
                    "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px oklch(75% 0.15 60 / 0.2)",
                }}
              />
              <div
                className="absolute -bottom-4 left-4 right-4 rounded-xl p-3 border border-gold/20"
                style={{
                  background: "oklch(10% 0.015 240 / 0.9)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="font-display font-bold text-base">
                  Malverin Stonehart
                </div>
                <div className="text-xs font-mono text-gold mt-0.5">
                  Founder &amp; Chief Strategist
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="relative">
              <Quote
                className="w-12 h-12 text-gold/20 mb-3"
                style={{ fill: "oklch(75% 0.15 60 / 0.08)" }}
              />
              <p className="font-display text-2xl md:text-3xl font-semibold leading-snug text-foreground/90 italic">
                “Precision is not just a strategy — it is a discipline.”
              </p>
            </div>

            <div className="w-24 h-px bg-gradient-to-r from-gold to-transparent" />

            <div className="space-y-4 text-foreground/70 leading-relaxed">
              <p>
                Malverin Stonehart is the visionary founder behind this
                platform, driven by a passion for innovation, entrepreneurship,
                and digital transformation. With a strategic mindset and
                forward-looking perspective, he is dedicated to building ideas
                that create lasting value in the modern business landscape.
              </p>
              <p>
                Through this platform, Malverin seeks to bring together
                creativity, technology, and strategic thinking to explore new
                opportunities and inspire progress. His approach to leadership
                focuses on innovation, resilience, and sustainable growth in an
                increasingly connected global economy.
              </p>
              <p>
                As an entrepreneur, he believes in turning bold ideas into
                meaningful ventures that shape the future and empower new
                possibilities in the digital era.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { label: "Years in Markets", value: "12+" },
                { label: "Signal Accuracy", value: "87%" },
                { label: "Assets Analyzed", value: "900+" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="px-4 py-2.5 rounded-xl glass-card border border-gold/15"
                >
                  <div className="text-xl font-mono font-bold text-gold">
                    {item.value}
                  </div>
                  <div className="text-xs text-foreground/65">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                data-ocid="founder.link"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-gold/30 text-foreground/70 hover:text-gold transition-colors text-sm"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </button>
              <button
                type="button"
                data-ocid="founder.link"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-gold/30 text-foreground/70 hover:text-gold transition-colors text-sm"
              >
                <Globe className="w-4 h-4" /> Portfolio
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
