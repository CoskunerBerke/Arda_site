import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import type { CustomerRevenueSlice, WeeklyFinancial } from '../../types/logistics';

export function StealthCard({
  children,
  className = '',
  title,
  subtitle,
  action,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <div className={`${interactive ? 'stealth-card-interactive' : 'stealth-card'} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-stealth-600 px-4 py-3 md:px-5">
          <div className="min-w-0">
            {title && <h3 className="truncate text-sm font-bold text-white">{title}</h3>}
            {subtitle && <p className="truncate text-xs text-steel-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="stealth-card-interactive group relative overflow-hidden p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center border border-stealth-600 bg-stealth-950 transition-colors group-hover:border-stealth-500 ${accent} md:h-10 md:w-10`}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        {trend && (
          <span
            className={`font-mono text-[11px] font-semibold ${
              trendUp ? 'text-emerald' : 'text-crimson'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-3 font-mono text-xl font-bold tracking-tight text-white md:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-steel-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-steel-500">{sub}</p>}
    </div>
  );
}

const STATUS_BADGE_MAP: Record<string, string> = {
  Yolda: 'badge-cyan',
  'Teslim Edildi': 'badge-emerald',
  Gecikti: 'badge-crimson',
  Yükleme: 'badge-amber',
  Hazırlanıyor: 'badge-neutral',
  active: 'badge-emerald',
  expiring: 'badge-amber',
  inactive: 'badge-crimson',
};

const STATUS_LABELS_TR: Record<string, string> = {
  active: 'Aktif',
  expiring: 'Yenileme Yakın',
  inactive: 'Pasif',
};

export function StatusBadge({
  status,
  translateStatus = false,
}: {
  status: string;
  translateStatus?: boolean;
}) {
  const badgeCls = STATUS_BADGE_MAP[status] || 'badge-neutral';
  const dotCls =
    status === 'Yolda'
      ? 'bg-cyan'
      : status === 'Teslim Edildi' || status === 'active'
      ? 'bg-emerald'
      : status === 'Gecikti' || status === 'inactive'
      ? 'bg-crimson'
      : status === 'Yükleme' || status === 'expiring'
      ? 'bg-amber'
      : 'bg-steel-500';

  const shouldPulse = status !== 'Teslim Edildi' && status !== 'inactive';
  const displayLabel = translateStatus ? STATUS_LABELS_TR[status] || status : status;

  return (
    <span className={badgeCls}>
      <span className={`h-1.5 w-1.5 ${dotCls} ${shouldPulse ? 'animate-pulse' : ''}`} />
      {displayLabel}
    </span>
  );
}

export function getMarginBadge(margin: number) {
  if (margin < 0) {
    return {
      text: 'text-crimson',
      bar: 'bg-crimson',
      bg: 'badge-crimson',
      label: 'Zarar',
    };
  }
  if (margin < 15) {
    return {
      text: 'text-crimson',
      bar: 'bg-crimson',
      bg: 'badge-crimson',
      label: 'Düşük',
    };
  }
  if (margin <= 25) {
    return {
      text: 'text-amber',
      bar: 'bg-amber',
      bg: 'badge-amber',
      label: 'Orta',
    };
  }
  return {
    text: 'text-emerald',
    bar: 'bg-emerald',
    bg: 'badge-emerald',
    label: 'Sağlıklı',
  };
}

export function SlideDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full ${maxWidth} stealth-scroll overflow-y-auto border-l border-stealth-600 bg-stealth-950 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stealth-600 bg-stealth-950/95 px-5 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white">{title}</h3>
            {subtitle && <p className="truncate text-xs text-steel-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-stealth-600 bg-stealth-900 text-steel-400 transition-colors hover:border-stealth-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] ${maxWidth} -translate-x-1/2 -translate-y-1/2 animate-slide-up`}
      >
        <div className="stealth-card stealth-scroll max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stealth-600 bg-stealth-950/95 px-5 py-4 backdrop-blur-sm">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">{title}</h3>
              {subtitle && <p className="mt-0.5 text-xs text-steel-500">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="flex h-9 w-9 items-center justify-center border border-stealth-600 bg-stealth-900 text-steel-400 transition-colors hover:border-stealth-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  );
}

export function PhoneFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="relative border border-stealth-600 bg-stealth-950 p-4">
        <div className="mb-3 flex items-center justify-center">
          <div className="h-1 w-12 rounded-full bg-stealth-600" />
        </div>
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-steel-600">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

/**
 * Interactive SVG Donut Chart matching exact Stealth Dark palette & tooltip styling
 */
export function DonutRevenueChart({ data }: { data: CustomerRevenueSlice[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  const cx = 110;
  const cy = 110;
  const outerR = 86;
  const innerR = 52;
  const padAngle = 0.03; // radians

  let currentAngle = -Math.PI / 2;

  const slices = data.map((item, idx) => {
    const fraction = item.revenue / total;
    const sweep = Math.max(0.02, fraction * Math.PI * 2 - padAngle);
    const startAngle = currentAngle + padAngle / 2;
    const endAngle = startAngle + sweep;
    currentAngle += fraction * Math.PI * 2;

    const x1Out = cx + outerR * Math.cos(startAngle);
    const y1Out = cy + outerR * Math.sin(startAngle);
    const x2Out = cx + outerR * Math.cos(endAngle);
    const y2Out = cy + outerR * Math.sin(endAngle);

    const x1In = cx + innerR * Math.cos(endAngle);
    const y1In = cy + innerR * Math.sin(endAngle);
    const x2In = cx + innerR * Math.cos(startAngle);
    const y2In = cy + innerR * Math.sin(startAngle);

    const largeArc = sweep > Math.PI ? 1 : 0;

    const pathData = [
      `M ${x1Out} ${y1Out}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Out} ${y2Out}`,
      `L ${x1In} ${y1In}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2In} ${y2In}`,
      'Z',
    ].join(' ');

    return {
      ...item,
      idx,
      pathData,
      pct: ((item.revenue / total) * 100).toFixed(1),
    };
  });

  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="relative flex h-64 items-center justify-center p-4">
      <svg viewBox="0 0 220 220" className="h-full w-full max-w-[220px]">
        {slices.map((s) => {
          const isHovered = hoveredIdx === s.idx;
          return (
            <path
              key={s.name}
              d={s.pathData}
              fill={s.color}
              stroke="#000000"
              strokeWidth={2}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform: isHovered ? 'scale(1.045)' : 'scale(1)',
                opacity: hoveredIdx === null || isHovered ? 1 : 0.55,
                transition: 'transform 0.22s ease, opacity 0.22s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIdx(s.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="9"
          fontWeight="600"
        >
          {activeItem ? activeItem.name : 'TOPLAM CİRO'}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="14"
          fontWeight="700"
          className="font-mono"
        >
          {activeItem
            ? `₺${(activeItem.revenue / 1000).toFixed(0)}K`
            : `₺${(total / 1000000).toFixed(2)}M`}
        </text>
        {activeItem && (
          <text
            x={cx}
            y={cy + 26}
            textAnchor="middle"
            fill={activeItem.color}
            fontSize="9"
            fontWeight="600"
            className="font-mono"
          >
            %{activeItem.pct} pay
          </text>
        )}
      </svg>
    </div>
  );
}

/**
 * Interactive SVG Composed Bar + Line Chart for Weekly Cost & Profit (COGS breakdown)
 */
export function WeeklyComposedChart({ data }: { data: WeeklyFinancial[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 560;
  const height = 250;
  const padLeft = 48;
  const padRight = 36;
  const padTop = 20;
  const padBottom = 34;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = 360000;
  const maxMargin = 25;

  const yTicks = [0, 90000, 180000, 270000, 360000];
  const groupW = plotW / data.length;
  const barW = Math.min(14, (groupW - 22) / 3);

  const linePoints = data.map((d, i) => {
    const cx = padLeft + i * groupW + groupW / 2;
    const cy = padTop + plotH - (d.margin / maxMargin) * plotH;
    return { x: cx, y: cy, margin: d.margin };
  });

  const linePath = linePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');

  const activeWeek = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="relative h-72 w-full p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Horizontal Dashed Grid */}
        {yTicks.map((tick) => {
          const y = padTop + plotH - (tick / maxVal) * plotH;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#1F1F1F"
                strokeDasharray="3,3"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                fill="#525252"
                fontSize="10"
                className="font-mono"
              >
                {tick === 0 ? '0' : `${tick / 1000}K`}
              </text>
            </g>
          );
        })}

        {/* Bars per week */}
        {data.map((d, i) => {
          const centerX = padLeft + i * groupW + groupW / 2;
          const cogsH = (d.cogs / maxVal) * plotH;
          const freightH = (d.freight / maxVal) * plotH;
          const profitH = (d.netProfit / maxVal) * plotH;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={d.week}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Hover highlight column */}
              <rect
                x={padLeft + i * groupW + 4}
                y={padTop}
                width={groupW - 8}
                height={plotH}
                fill={isHovered ? 'rgba(255,255,255,0.03)' : 'transparent'}
              />

              {/* COGS Bar (#FF2E4D) */}
              <rect
                x={centerX - barW * 1.6}
                y={padTop + plotH - cogsH}
                width={barW}
                height={cogsH}
                fill="#FF2E4D"
                opacity={isHovered ? 0.85 : 0.6}
              />

              {/* Freight Bar (#FFB800) */}
              <rect
                x={centerX - barW * 0.5}
                y={padTop + plotH - freightH}
                width={barW}
                height={freightH}
                fill="#FFB800"
                opacity={isHovered ? 0.85 : 0.6}
              />

              {/* Net Profit Bar (#00FF87) */}
              <rect
                x={centerX + barW * 0.6}
                y={padTop + plotH - profitH}
                width={barW}
                height={profitH}
                fill="#00FF87"
                opacity={isHovered ? 1 : 0.8}
              />

              {/* X Axis Label */}
              <text
                x={centerX}
                y={height - 10}
                textAnchor="middle"
                fill={isHovered ? '#FFFFFF' : '#525252'}
                fontSize="10"
              >
                {d.week}
              </text>
            </g>
          );
        })}

        {/* Margin % Line (#06B6D4) */}
        <path d={linePath} fill="none" stroke="#06B6D4" strokeWidth={2} />
        {linePoints.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={hoveredIdx === i ? 4.5 : 3}
            fill="#06B6D4"
            stroke="#000000"
            strokeWidth={1.5}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-[10px] text-steel-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-crimson opacity-80" /> Maliyet (COGS)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-amber opacity-80" /> Nakliye
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-emerald" /> Net Kâr
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-cyan" /> Marj %
        </span>
      </div>

      {/* Floating Tooltip */}
      {activeWeek && (
        <div
          className="pointer-events-none absolute right-5 top-4 z-20 border border-stealth-600 bg-stealth-900/95 p-3 text-xs shadow-xl backdrop-blur-sm"
          style={{ minWidth: '175px' }}
        >
          <p className="font-bold text-white">{activeWeek.week}</p>
          <div className="mt-1.5 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-crimson">Maliyet:</span>
              <span className="text-steel-200">
                ₺{activeWeek.cogs.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-amber">Nakliye:</span>
              <span className="text-steel-200">
                ₺{activeWeek.freight.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-emerald">Net Kâr:</span>
              <span className="text-emerald">
                ₺{activeWeek.netProfit.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-stealth-600 pt-1">
              <span className="text-cyan">Marj:</span>
              <span className="text-cyan">%{activeWeek.margin.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
