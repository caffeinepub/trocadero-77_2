import { Award, Clock, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { SignalData } from "../hooks/useCryptoSignals";

function fmtPrice(p: number) {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

export default function HighProfitSection({
  signals,
}: { signals: SignalData[] }) {
  const sorted = [...signals]
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 6);

  return (
    <section id="highprofit" className="relative py-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 50%, oklch(75% 0.15 60 / 0.04) 0%, transparent 70%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/8 mb-4">
            <Award className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-mono text-gold tracking-widest">
              TOP OPPORTUNITIES
            </span>
          </div>
          <h2 className="section-heading text-4xl md:text-5xl font-bold mb-4">
            High <span className="gold-gradient">Profit</span> Signals
          </h2>
          <p className="text-foreground/70 max-w-lg mx-auto">
            Highest potential return opportunities identified by our AI engine,
            sorted by estimated profit.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((signal, idx) => {
            const ib = signal.direction === "long";
            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                data-ocid={`highprofit.item.${idx + 1}`}
                className="rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
                style={{
                  background: "oklch(10% 0.015 240 / 0.75)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid oklch(75% 0.15 60 / ${idx === 0 ? "0.35" : "0.15"})`,
                  boxShadow:
                    idx === 0
                      ? "0 20px 40px rgba(0,0,0,0.4), 0 0 30px oklch(75% 0.15 60 / 0.1)"
                      : "0 12px 24px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  className="h-1.5"
                  style={{
                    background:
                      idx === 0
                        ? "linear-gradient(90deg, oklch(78% 0.17 65), oklch(65% 0.12 55))"
                        : `linear-gradient(90deg, oklch(${ib ? "62% 0.18 145" : "60% 0.18 25"}), transparent)`,
                  }}
                />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white"
                        style={{
                          background:
                            idx === 0
                              ? "linear-gradient(135deg, oklch(78% 0.17 65), oklch(65% 0.12 55))"
                              : ib
                                ? "oklch(62% 0.18 145)"
                                : "oklch(60% 0.18 25)",
                        }}
                      >
                        {signal.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-display font-bold">
                          {signal.coinName}
                        </div>
                        <div className="text-xs font-mono text-foreground/70">
                          {signal.symbol}/USDT
                        </div>
                      </div>
                    </div>
                    {idx === 0 ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30">
                        <Zap className="w-3 h-3 text-gold" />
                        <span className="text-xs font-mono text-gold font-bold">
                          #1
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-foreground/55">
                        #{idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="mb-4 rounded-xl bg-surface-3/50 p-3 text-center">
                    <div className="text-3xl font-mono font-bold text-gold">
                      +{signal.profitPercent}%
                    </div>
                    <div className="text-xs text-foreground/65 mt-1">
                      Estimated Profit
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold ${ib ? "bg-signal-buy/15 text-signal-buy border border-signal-buy/25" : "bg-signal-sell/15 text-signal-sell border border-signal-sell/25"}`}
                    >
                      {ib ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {ib ? "LONG" : "SHORT"}
                    </div>
                    <div className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gold/8 border border-gold/20 text-xs font-mono text-gold">
                      {signal.confidence}% conf.
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-foreground/65">Entry Price</span>
                      <span>{fmtPrice(signal.entryPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/65">Take Profit</span>
                      <span className="text-signal-buy">
                        {fmtPrice(signal.takeProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/65">Stop Loss</span>
                      <span className="text-signal-sell">
                        {fmtPrice(signal.stopLoss)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-foreground/65">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">
                        {signal.estimatedHours}h to TP
                      </span>
                    </div>
                    <div className="text-xs font-mono text-foreground/55">
                      RSI {signal.rsi}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center text-xs font-mono text-foreground/50"
        >
          Signals are generated using AI technical analysis. Past performance
          does not guarantee future results. Trade responsibly.
        </motion.div>
      </div>
    </section>
  );
}
