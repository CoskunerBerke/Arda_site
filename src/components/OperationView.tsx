import React, { useState } from 'react';
import {
  CircleCheck,
  Clock,
  Droplets,
  Gauge,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  Send,
  Snowflake,
  Thermometer,
  TriangleAlert,
  Truck,
} from 'lucide-react';
import { INITIAL_SHIPMENTS, INITIAL_SMS_LOGS } from '../data/mockData';
import type { Shipment } from '../types/logistics';
import { createRateLimiter, sanitizeText } from '../utils/security';
import { Modal, PhoneFrame, StatusBadge, StealthCard } from './ui/Primitives';

const STAGES = ['Onay', 'Paletleme', 'Yolda', 'Dağıtım', 'Teslim'];
const smsRateLimiter = createRateLimiter(10, 60_000);

function StageStepper({ stage }: { stage: number }) {
  return (
    <div className="flex items-center">
      {STAGES.map((label, idx) => {
        const step = idx + 1;
        const completed = step < stage;
        const current = step === stage;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center border text-[10px] font-bold ${
                  completed
                    ? 'border-emerald/40 bg-emerald/10 text-emerald'
                    : current
                    ? 'animate-pulse-glow-emerald border-cyan/40 bg-cyan/10 text-cyan'
                    : 'border-stealth-600 bg-stealth-900 text-steel-600'
                }`}
              >
                {step}
              </div>
              <span
                className={`mt-1 text-[9px] font-medium ${
                  completed || current ? 'text-steel-300' : 'text-steel-600'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 ${
                  completed ? 'stage-connector' : 'stage-connector-pending'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExceptionAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 border border-crimson/40 bg-crimson/10 p-3">
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-crimson" />
      <div>
        <p className="text-xs font-semibold text-crimson">
          İstisna Bildirimi — SF Express
        </p>
        <p className="mt-0.5 text-xs text-steel-300">{message}</p>
      </div>
    </div>
  );
}

function ClimateStatus({ shipment }: { shipment: Shipment }) {
  const ok =
    shipment.temperature >= shipment.tempMin &&
    shipment.temperature <= shipment.tempMax;
  return (
    <div
      className={`flex items-center gap-2 border px-3 py-2 ${
        ok ? 'border-emerald/40 bg-emerald/10' : 'border-crimson/40 bg-crimson/10'
      }`}
    >
      <Snowflake className={`h-4 w-4 ${ok ? 'text-emerald' : 'text-crimson'}`} />
      <div>
        <p className={`text-xs font-semibold ${ok ? 'text-emerald' : 'text-crimson'}`}>
          {shipment.temperature.toFixed(1)}°C
        </p>
        <p className="text-[10px] text-steel-500">
          {shipment.tempMin}–{shipment.tempMax}°C aralığı
        </p>
      </div>
      <div className="ml-2 flex items-center gap-1 text-[10px] text-steel-500">
        <Droplets className="h-3 w-3" /> {shipment.humidity}%
      </div>
    </div>
  );
}

function ShipmentSelector({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="stealth-scroll flex gap-2 overflow-x-auto pb-2">
      {INITIAL_SHIPMENTS.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={`shrink-0 border px-3 py-2 text-left transition-colors ${
            active === r.id
              ? 'border-emerald/40 bg-emerald/10'
              : 'border-stealth-600 bg-stealth-900 hover:border-stealth-500'
          }`}
        >
          <p className="text-xs font-bold text-white">{r.id}</p>
          <p className="truncate text-[10px] text-steel-500">{r.client}</p>
        </button>
      ))}
    </div>
  );
}

function VectorMap({ shipment }: { shipment: Shipment }) {
  const projectX = (lng: number) => (lng - 26) * 3 + 10;
  const projectY = (lat: number) => (41 - lat) * 3 + 10;

  const nodes = shipment.route.map((o) => ({
    x: projectX(o.lng),
    y: projectY(o.lat),
    status: o.status,
  }));

  const pathData = nodes
    .map((o, idx) => `${idx === 0 ? 'M' : 'L'} ${o.x} ${o.y}`)
    .join(' ');

  const current = nodes.find((o) => o.status === 'current') || nodes[nodes.length - 1];

  return (
    <div className="grid-pattern relative aspect-[4/3] w-full overflow-hidden border border-stealth-600 bg-black">
      <svg
        viewBox="0 0 140 80"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={pathData}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.6"
        />
        {nodes.map((o, idx) => (
          <g key={idx}>
            {o.status === 'completed' && (
              <circle cx={o.x} cy={o.y} r="1.5" fill="#00FF87" />
            )}
            {o.status === 'current' && (
              <>
                <circle
                  cx={o.x}
                  cy={o.y}
                  r="3"
                  fill="#06B6D4"
                  opacity="0.3"
                  className="animate-pulse"
                />
                <circle cx={o.x} cy={o.y} r="1.5" fill="#06B6D4" />
              </>
            )}
            {o.status === 'upcoming' && (
              <circle
                cx={o.x}
                cy={o.y}
                r="1.2"
                fill="none"
                stroke="#525252"
                strokeWidth="0.5"
              />
            )}
          </g>
        ))}
        {current && (
          <text
            x={current.x}
            y={current.y - 3}
            fill="#06B6D4"
            fontSize="2"
            textAnchor="middle"
            className="font-mono"
          >
            {shipment.id}
          </text>
        )}
      </svg>

      <div className="absolute bottom-2 left-2 flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-[10px] text-steel-400">
          <span className="h-2 w-2 bg-emerald" /> Tamamlanan
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-steel-400">
          <span className="h-2 w-2 bg-cyan" /> Mevcut
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-steel-400">
          <span className="h-2 w-2 border border-steel-500" /> Beklenen
        </span>
      </div>
    </div>
  );
}

function ShipmentDetails({
  shipment,
  onPOD,
  onDriverTrack,
  onCustomerTrack,
}: {
  shipment: Shipment;
  onPOD: () => void;
  onDriverTrack: () => void;
  onCustomerTrack: () => void;
}) {
  return (
    <div className="space-y-4 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">{shipment.id}</h4>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="mt-1 truncate text-xs text-steel-400">{shipment.product}</p>
          <p className="text-[11px] text-steel-500">{shipment.client}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-cyan">{shipment.etaText}</p>
          <p className="text-[11px] text-steel-500">
            {shipment.remainingKm} / {shipment.totalKm} km
          </p>
        </div>
      </div>

      <StageStepper stage={shipment.stage} />

      {shipment.exceptionAlert && <ExceptionAlert message={shipment.exceptionAlert} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="stealth-card p-3">
          <Thermometer className="h-4 w-4 text-amber" />
          <p className="mt-1 text-sm font-bold text-white">
            {shipment.temperature.toFixed(1)}°C
          </p>
          <p className="text-[10px] text-steel-500">Konteyner</p>
        </div>
        <div className="stealth-card p-3">
          <Droplets className="h-4 w-4 text-cyan" />
          <p className="mt-1 text-sm font-bold text-white">{shipment.humidity}%</p>
          <p className="text-[10px] text-steel-500">Nem</p>
        </div>
        <div className="stealth-card p-3">
          <Gauge className="h-4 w-4 text-emerald" />
          <p className="mt-1 text-sm font-bold text-white">{shipment.speed} km/s</p>
          <p className="text-[10px] text-steel-500">Hız</p>
        </div>
        <div className="stealth-card p-3">
          <Package className="h-4 w-4 text-steel-400" />
          <p className="mt-1 text-sm font-bold text-white">
            {shipment.units} {shipment.unitLabel}
          </p>
          <p className="text-[10px] text-steel-500">Yük</p>
        </div>
      </div>

      <ClimateStatus shipment={shipment} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="stealth-card p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
            <MapPin className="h-3 w-3" /> Çıkış
          </p>
          <p className="text-xs text-steel-300">{shipment.origin}</p>
          <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
            Varış
          </p>
          <p className="text-xs text-steel-300">{shipment.destination}</p>
        </div>

        <div className="stealth-card p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
            <Truck className="h-3 w-3" /> Araç
          </p>
          <p className="text-xs text-steel-300">
            {shipment.vehicle} — {shipment.plate}
          </p>
          <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
            Sürücü
          </p>
          <p className="text-xs text-steel-300">{shipment.driverName}</p>
          <p className="text-[11px] text-steel-500">{shipment.driverPhone}</p>
        </div>
      </div>

      <VectorMap shipment={shipment} />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onDriverTrack}
          className="flex items-center gap-1.5 border border-cyan/40 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan transition-colors hover:bg-cyan/20"
        >
          <Navigation className="h-4 w-4" /> Sürücü Takibi
        </button>
        <button
          onClick={onCustomerTrack}
          className="flex items-center gap-1.5 border border-emerald/40 bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald transition-colors hover:bg-emerald/20"
        >
          <Phone className="h-4 w-4" /> Müşteri Takibi
        </button>
        <button
          onClick={onPOD}
          disabled={!shipment.hasPOD}
          className={`flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold transition-colors ${
            shipment.hasPOD
              ? 'border-emerald/40 bg-emerald/10 text-emerald hover:bg-emerald/20'
              : 'cursor-not-allowed border-stealth-600 bg-stealth-800 text-steel-600'
          }`}
        >
          <CircleCheck className="h-4 w-4" />{' '}
          {shipment.hasPOD ? 'POD Görüntüle' : 'POD Bekliyor'}
        </button>
      </div>
    </div>
  );
}

function SmsDispatchCard({ shipment }: { shipment: Shipment }) {
  const [driverMsg, setDriverMsg] = useState(
    `${shipment.id} — ${shipment.destination} teslimatı ${shipment.etaText} bekleniyor. Rota onayınız gerekiyor.`
  );
  const [customerMsg, setCustomerMsg] = useState(
    `Sayın ${shipment.client}, sevkiyatınız ${shipment.id} yola çıktı. Tahmini teslimat: ${shipment.etaText}.`
  );
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!smsRateLimiter.tryAcquire().allowed) return;
    setDriverMsg((prev) => sanitizeText(prev, 280));
    setCustomerMsg((prev) => sanitizeText(prev, 280));
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="space-y-4 p-4 md:p-5">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
          <Truck className="h-3 w-3" /> Sürücü SMS — {shipment.driverPhone}
        </label>
        <textarea
          value={driverMsg}
          onChange={(e) => setDriverMsg(sanitizeText(e.target.value, 280))}
          rows={2}
          className="stealth-input w-full resize-none p-2.5 text-xs"
        />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
          <Phone className="h-3 w-3" /> Müşteri SMS
        </label>
        <textarea
          value={customerMsg}
          onChange={(e) => setCustomerMsg(sanitizeText(e.target.value, 280))}
          rows={2}
          className="stealth-input w-full resize-none p-2.5 text-xs"
        />
      </div>
      <button
        onClick={handleSend}
        className={`flex items-center gap-2 border px-4 py-2 text-xs font-semibold transition-colors ${
          sent
            ? 'border-emerald/40 bg-emerald/10 text-emerald'
            : 'border-emerald bg-emerald text-black hover:bg-emerald-300'
        }`}
      >
        {sent ? <CircleCheck className="h-4 w-4" /> : <Send className="h-4 w-4" />}{' '}
        {sent ? 'SMS Gönderildi' : 'SMS Gönder'}
      </button>
    </div>
  );
}

function SmsHistoryCard() {
  return (
    <div className="space-y-2 p-4 md:p-5">
      {INITIAL_SMS_LOGS.map((e) => (
        <div key={e.id} className="border border-stealth-600 bg-stealth-950 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
              <MessageSquare className="h-3 w-3" />{' '}
              {e.recipient === 'driver' ? 'Sürücü' : 'Müşteri'} — {e.phone}
            </span>
            <span
              className={`text-[10px] font-semibold ${
                e.status === 'read'
                  ? 'text-emerald'
                  : e.status === 'delivered'
                  ? 'text-cyan'
                  : 'text-amber'
              }`}
            >
              {e.status === 'read'
                ? 'Okundu'
                : e.status === 'delivered'
                ? 'İletildi'
                : 'Gönderildi'}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-steel-300">{e.message}</p>
          <p className="mt-1 text-[10px] text-steel-600">
            {e.timestamp} — {e.shipmentId}
          </p>
        </div>
      ))}
    </div>
  );
}

export function OperationView() {
  const [activeId, setActiveId] = useState(INITIAL_SHIPMENTS[0].id);
  const [podOpen, setPodOpen] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  const s =
    INITIAL_SHIPMENTS.find((u) => u.id === activeId) || INITIAL_SHIPMENTS[0];

  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white md:text-xl">Operasyon Yönetimi</h2>
        <p className="text-xs text-steel-500">
          Aktif sevkiyat takibi, iklim kontrolü ve SMS dispatch
        </p>
      </div>

      <ShipmentSelector active={activeId} onSelect={setActiveId} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StealthCard
            title="Sevkiyat Detayı"
            subtitle={`${s.id} — ${s.client}`}
          >
            <ShipmentDetails
              shipment={s}
              onPOD={() => setPodOpen(true)}
              onDriverTrack={() => setDriverOpen(true)}
              onCustomerTrack={() => setCustomerOpen(true)}
            />
          </StealthCard>
        </div>

        <div className="space-y-4">
          <StealthCard title="SMS Dispatch" subtitle="Sürücü & müşteri bildirimi">
            <SmsDispatchCard shipment={s} />
          </StealthCard>
          <StealthCard title="SMS Geçmişi" subtitle="Son gönderimler">
            <SmsHistoryCard />
          </StealthCard>
        </div>
      </div>

      <Modal
        open={podOpen}
        onClose={() => setPodOpen(false)}
        title="Teslim Belgesi (POD)"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <CircleCheck className="h-5 w-5 text-emerald" />
              <p className="text-sm font-bold text-emerald">Teslim Edildi</p>
            </div>
            <p className="mt-2 text-xs text-steel-300">
              {s.id} — {s.product}
            </p>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-steel-500">İmzalayan:</span>
                <span className="text-white">{s.podSignedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-500">Tarih:</span>
                <span className="text-white">{s.podDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-500">Varış:</span>
                <span className="text-white">{s.destination}</span>
              </div>
            </div>
          </div>
          <div className="border border-emerald/20 bg-emerald/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-steel-500">
              Dijital İmza
            </p>
            <p className="mt-2 font-mono text-lg text-emerald">{s.podSignedBy}</p>
          </div>
        </div>
      </Modal>

      <Modal
        open={driverOpen}
        onClose={() => setDriverOpen(false)}
        title="Sürücü Takibi"
        maxWidth="max-w-sm"
      >
        <PhoneFrame label="Sürücü Ekranı">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border border-stealth-600 bg-stealth-900 p-2.5">
              <Truck className="h-4 w-4 text-cyan" />
              <div>
                <p className="text-xs font-bold text-white">{s.plate}</p>
                <p className="text-[10px] text-steel-500">{s.driverName}</p>
              </div>
            </div>
            <div className="border border-stealth-600 bg-stealth-900 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-steel-600">
                Mevcut Konum
              </p>
              <p className="mt-1 text-xs text-steel-300">{s.currentLocation}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-stealth-600 bg-stealth-900 p-2.5 text-center">
                <Gauge className="mx-auto h-4 w-4 text-emerald" />
                <p className="mt-1 text-xs font-bold text-white">{s.speed}</p>
                <p className="text-[10px] text-steel-500">km/s</p>
              </div>
              <div className="border border-stealth-600 bg-stealth-900 p-2.5 text-center">
                <Clock className="mx-auto h-4 w-4 text-cyan" />
                <p className="mt-1 text-xs font-bold text-white">{s.etaText}</p>
                <p className="text-[10px] text-steel-500">Kalan</p>
              </div>
            </div>
            <button className="w-full border border-cyan/40 bg-cyan/10 py-2 text-xs font-semibold text-cyan">
              Konum Paylaşımını Başlat
            </button>
          </div>
        </PhoneFrame>
      </Modal>

      <Modal
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        title="Müşteri Takibi"
        maxWidth="max-w-sm"
      >
        <PhoneFrame label="Müşteri Takip Ekranı">
          <div className="space-y-3">
            <div className="border border-emerald/40 bg-emerald/10 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-emerald">
                Tahmini Teslimat
              </p>
              <p className="mt-1 text-lg font-bold text-white">15:30 — 16:30</p>
              <p className="text-[10px] text-steel-500">Bugün</p>
            </div>
            <div className="border border-stealth-600 bg-stealth-900 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-steel-600">
                Sevkiyat
              </p>
              <p className="mt-1 text-xs font-bold text-white">{s.id}</p>
              <p className="text-[10px] text-steel-500">{s.product}</p>
            </div>
            <div className="space-y-1.5">
              {s.route.slice(0, 3).map((u, f) => (
                <div key={f} className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 ${
                      u.status === 'completed'
                        ? 'bg-emerald'
                        : u.status === 'current'
                        ? 'animate-pulse bg-cyan'
                        : 'border border-steel-500'
                    }`}
                  />
                  <p className="text-[11px] text-steel-300">{u.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 border border-emerald/40 bg-emerald/10 py-2 text-xs font-semibold text-emerald">
                Sürücüyü Ara
              </button>
              <button className="flex-1 border border-stealth-600 bg-stealth-900 py-2 text-xs font-semibold text-steel-300">
                İrsaliye PDF
              </button>
            </div>
          </div>
        </PhoneFrame>
      </Modal>
    </div>
  );
}
