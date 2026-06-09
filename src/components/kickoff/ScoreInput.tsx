import { Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
};

export function ScoreInput({ value, onChange, disabled }: Props) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(20, value + 1));
  return (
    <div
      className={`inline-flex items-center gap-2 ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <button
        type="button"
        onClick={dec}
        aria-label="decrease"
        className="size-11 rounded-lg border border-turf-line bg-turf-deep text-chalk hover:border-gold hover:text-gold transition flex items-center justify-center"
      >
        <Minus className="size-5" />
      </button>
      <div className="relative w-14 h-14 overflow-hidden rounded-lg border border-turf-line bg-turf-deep flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 24, opacity: 0, scaleY: 0.6 }}
            animate={{ y: 0, opacity: 1, scaleY: 1 }}
            exit={{ y: -24, opacity: 0, scaleY: 0.6 }}
            transition={{ duration: 0.18 }}
            className="font-scoreboard text-4xl font-bold text-chalk"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={inc}
        aria-label="increase"
        className="size-11 rounded-lg border border-turf-line bg-turf-deep text-chalk hover:border-gold hover:text-gold transition flex items-center justify-center"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}