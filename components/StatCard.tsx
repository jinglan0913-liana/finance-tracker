import { formatCurrency } from "@/lib/format";

type Tone = "neutral" | "positive" | "warning" | "negative";

const toneClasses: Record<Tone, string> = {
  neutral: "text-ink",
  positive: "text-positive",
  warning: "text-amber-400",
  negative: "text-negative",
};

/** One of the four summary tiles at the top of the Dashboard. */
export default function StatCard({
  label,
  amount,
  caption,
  tone = "neutral",
  valueText,
  Icon,
}: {
  label: string;
  amount: number;
  caption?: string;
  tone?: Tone;
  /** Overrides the formatted amount, for values that aren't money (e.g. "66%"). */
  valueText?: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className={`h-4 w-4 ${toneClasses[tone]}`} />
      </div>

      <p className={`mt-3 text-2xl font-semibold tracking-tight tabular-nums ${toneClasses[tone]}`}>
        {valueText ?? formatCurrency(amount)}
      </p>

      {caption && <p className="mt-1.5 text-xs text-faint">{caption}</p>}
    </div>
  );
}
