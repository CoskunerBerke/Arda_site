import { Check, Lock, Zap } from 'lucide-react';
import { PRICING_TIERS } from '../data/mockData';
import type { TierId } from '../types/logistics';
import { Modal } from './ui/Primitives';

const TIER_STYLES: Record<TierId, { border: string; text: string }> = {
  basic: { border: 'border-cyan/40', text: 'text-cyan' },
  pro: { border: 'border-emerald/40', text: 'text-emerald' },
  enterprise: { border: 'border-amber/40', text: 'text-amber' },
};

export function UpgradeModal({
  open,
  onClose,
  currentTier,
}: {
  open: boolean;
  onClose: () => void;
  currentTier: TierId;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AS LOJİSTİK Altyapınızı Yükseltin"
      maxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PRICING_TIERS.map((n) => {
          const i = TIER_STYLES[n.id];
          const a = currentTier === n.id;

          return (
            <div
              key={n.id}
              className={`relative flex flex-col border ${i.border} bg-stealth-950 p-5`}
            >
              {n.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 border border-emerald/40 bg-stealth-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald">
                    <Zap className="h-3 w-3" /> Önerilen
                  </span>
                </div>
              )}
              <h3 className={`text-lg font-bold ${i.text}`}>{n.name}</h3>
              <p className="mt-1 text-xs text-steel-500">{n.description}</p>
              <p className="mt-3">
                <span className="text-3xl font-bold text-white">
                  ₺{n.price.toLocaleString('tr-TR')}
                </span>
                <span className="text-sm text-steel-500"> {n.period}</span>
              </p>
              <ul className="mb-5 mt-4 flex-1 space-y-2">
                {n.features.map((o) => (
                  <li
                    key={o}
                    className="flex items-start gap-2 text-xs text-steel-300"
                  >
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${i.text}`} />
                    <span>{o}</span>
                  </li>
                ))}
                {n.locked.map((o) => (
                  <li
                    key={o}
                    className="flex items-start gap-2 text-xs text-steel-600"
                  >
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="line-through">{o}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={a}
                className={`w-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  a
                    ? 'cursor-default border-stealth-600 bg-stealth-800 text-steel-500'
                    : n.id === 'enterprise'
                    ? 'border-amber/40 bg-amber/10 text-amber hover:bg-amber/20'
                    : 'border-emerald bg-emerald text-black hover:bg-emerald-300'
                }`}
              >
                {a ? 'Mevcut Paket' : 'Yükselt'}
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
