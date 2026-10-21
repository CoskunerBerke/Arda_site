import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CircleCheck,
  Clock,
  Droplets,
  Gauge,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  Plus,
  Search,
  Send,
  Snowflake,
  Thermometer,
  TriangleAlert,
  Truck,
} from 'lucide-react';
import { STAGE_INDEX } from '../data/mockData';
import type { RoleType, Shipment, ShipmentStatus, SmsLogItem } from '../types/logistics';
import { createRateLimiter, sanitizeText } from '../utils/security';
import { Modal, PhoneFrame, StatusBadge, StealthCard } from './ui/Primitives';

const STAGE_LABELS = ['Onay', 'Paletleme', 'Yolda', 'Dağıtım', 'Teslim'];

const smsRateLimiter = createRateLimiter(6, 60_000);

function StageProgress({ stage }: { stage: number }) {
  return (
    <div className="flex items-center">
      {STAGE_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < stage;
        const isCurrent = stepNum === stage;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center border font-mono text-[10px] font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'border-emerald/40 bg-emerald/10 text-emerald'
                    : isCurrent
                    ? 'animate-pulse-glow-emerald border-cyan/40 bg-cyan/10 text-cyan'
                    : 'border-stealth-600 bg-stealth-900 text-steel-600'
                }`}
              >
                {stepNum}
              </div>
              <span
                className={`mt-1 text-[9px] font-medium ${
                  isCompleted || isCurrent ? 'text-steel-300' : 'text-steel-600'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STAGE_LABELS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 transition-all duration-500 ${
                  isCompleted ? 'stage-connector' : 'stage-connector-pending'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExceptionBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 border border-crimson/40 bg-crimson/10 p-3">
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-crimson" />
      <div>
        <p className="text-xs font-semibold text-crimson">
          İstisna Bildirimi — AS Lojistik Operasyon Merkezi
        </p>
        <p className="mt-0.5 text-xs text-steel-300">{message}</p>
      </div>
    </div>
  );
}

function ClimateComplianceBar({
  shipment,
  liveTemp,
}: {
  shipment: Shipment;
  liveTemp: number;
}) {
  const withinRange = liveTemp >= shipment.tempMin && liveTemp <= shipment.tempMax;
  return (
    <div
      className={`flex items-center justify-between gap-2 border px-3 py-2 transition-colors ${
        withinRange
          ? 'border-emerald/40 bg-emerald/10'
          : 'border-crimson/40 bg-crimson/10'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Snowflake
          className={`h-4 w-4 ${withinRange ? 'text-emerald' : 'text-crimson'}`}
        />
        <div>
          <p
            className={`font-mono text-xs font-semibold ${
              withinRange ? 'text-emerald' : 'text-crimson'
            }`}
          >
            {liveTemp.toFixed(1)}°C — Soğuk Zincir {withinRange ? 'Optimal' : 'Uyarı'}
          </p>
          <p className="text-[10px] text-steel-500">
            Hedef: {shipment.tempMin}–{shipment.tempMax}°C aralığı
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 font-mono text-[10px] text-steel-400">
        <Droplets className="h-3 w-3 text-cyan" /> {shipment.humidity}% Nem
      </div>
    </div>
  );
}

function VectorRouteMap({ shipment }: { shipment: Shipment }) {
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null);

  useEffect(() => {
    setSelectedStopIdx(null);
  }, [shipment.id]);

  // Coordinate projection matching original SVG viewBox (0 0 140 80)
  const projectX = (lng: number) => (lng - 25.5) * 8.8 + 12;
  const projectY = (lat: number) => (41.8 - lat) * 10.2 + 10;

  const points = shipment.route.map((stop, idx) => ({
    ...stop,
    idx,
    x: projectX(stop.lng),
    y: projectY(stop.lat),
  }));

  const pathData = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const currentPoint =
    points.find((pt) => pt.status === 'current') || points[points.length - 1];

  const inspectedStop =
    selectedStopIdx !== null ? points[selectedStopIdx] : currentPoint;

  // Reference Hub Corridors in Turkey
  const hubs = [
    { name: 'İSTANBUL', lat: 41.01, lng: 28.97 },
    { name: 'BURSA', lat: 40.18, lng: 29.06 },
    { name: 'İZMİR', lat: 38.42, lng: 27.14 },
    { name: 'ANKARA', lat: 39.93, lng: 32.85 },
    { name: 'MERSİN', lat: 36.8, lng: 34.63 },
    { name: 'GAZİANTEP', lat: 37.06, lng: 37.38 },
  ];

  return (
    <div className="grid-pattern relative aspect-[4/3] w-full overflow-hidden border border-stealth-600 bg-black">
      {/* Top HUD Bar */}
      <div className="pointer-events-none absolute left-2.5 right-2.5 top-2 z-10 flex items-center justify-between text-[10px]">
        <span className="border border-stealth-600 bg-stealth-950/90 px-2 py-0.5 font-mono text-steel-400">
          KORİDOR: {shipment.origin.split(' ')[0].toUpperCase()} →{' '}
          {shipment.destination.split(' ')[0].toUpperCase()}
        </span>
        <span className="border border-stealth-600 bg-stealth-950/90 px-2 py-0.5 font-mono text-cyan">
          GPS: {shipment.currentLat.toFixed(2)}°N, {shipment.currentLng.toFixed(2)}°E
        </span>
      </div>

      <svg
        viewBox="0 0 140 80"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Subtle Stylized Anatolia / Marmara / Aegean / Mediterranean Coastline Outline */}
        <path
          d="M 16 14 L 38 14 L 58 17 L 88 15 L 122 18 L 130 35 L 122 58 L 96 64 L 78 68 L 54 65 L 30 62 L 18 48 L 14 28 Z"
          fill="rgba(10, 14, 20, 0.55)"
          stroke="#171717"
          strokeWidth="0.4"
        />

        {/* Reference Logistics Hubs */}
        {hubs.map((h) => {
          const hx = projectX(h.lng);
          const hy = projectY(h.lat);
          return (
            <g key={h.name} opacity="0.35">
              <circle cx={hx} cy={hy} r="0.6" fill="#475569" />
              <text
                x={hx}
                y={hy + 2.4}
                fill="#475569"
                fontSize="1.6"
                textAnchor="middle"
                className="font-mono"
              >
                {h.name}
              </text>
            </g>
          );
        })}

        {/* Base Route Track */}
        <path
          d={pathData}
          fill="none"
          stroke="#1F1F1F"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Animated Active Route Vector */}
        <path
          d={pathData}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="0.65"
          strokeDasharray="2,2"
          opacity="0.85"
          className="animate-route-dash"
        />

        {/* Waypoint Nodes */}
        {points.map((pt) => {
          const isSelected = selectedStopIdx === pt.idx;
          return (
            <g
              key={pt.idx}
              className="cursor-pointer"
              onClick={() => setSelectedStopIdx(pt.idx)}
            >
              {pt.status === 'completed' && (
                <>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? '2.4' : '1.6'}
                    fill="#00FF87"
                  />
                </>
              )}
              {pt.status === 'current' && (
                <>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#06B6D4"
                    opacity="0.25"
                    className="animate-pulse"
                  />
                  <circle cx={pt.x} cy={pt.y} r="1.8" fill="#06B6D4" />
                </>
              )}
              {pt.status === 'upcoming' && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? '2' : '1.3'}
                  fill="#0A0A0A"
                  stroke="#64748B"
                  strokeWidth="0.6"
                />
              )}
            </g>
          );
        })}

        {/* Current Shipment Callout Tag */}
        {currentPoint && (
          <g>
            <rect
              x={currentPoint.x - 8}
              y={currentPoint.y - 7.2}
              width="16"
              height="3.8"
              fill="#000000"
              stroke="#06B6D4"
              strokeWidth="0.3"
            />
            <text
              x={currentPoint.x}
              y={currentPoint.y - 4.6}
              fill="#06B6D4"
              fontSize="2.1"
              textAnchor="middle"
              className="font-mono"
            >
              {shipment.id}
            </text>
          </g>
        )}
      </svg>

      {/* Bottom Legend */}
      <div className=" absolute bottom-2 left-2.5 flex flex-col gap-1 border border-stealth-600/80 bg-stealth-950/90 px-2 py-1.5">
        <span className="flex items-center gap-1.5 text-[10px] text-steel-400">
          <span className="h-2 w-2 bg-emerald" /> Tamamlanan
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-steel-400">
          <span className="h-2 w-2 bg-cyan" /> Mevcut Konum
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-steel-400">
          <span className="h-2 w-2 border border-steel-500" /> Beklenen Nokta
        </span>
      </div>

      {/* Selected Waypoint Info Box */}
      {inspectedStop && (
        <div className="absolute bottom-2 right-2.5 max-w-[210px] border border-stealth-600 bg-stealth-950/95 px-2.5 py-1.5 text-right">
          <p className="truncate text-[10px] font-bold text-white">
            {inspectedStop.label}
          </p>
          <p className="truncate text-[9px] text-steel-400">
            {inspectedStop.location} • {inspectedStop.time}
          </p>
        </div>
      )}
    </div>
  );
}

export function OperationView({
  shipments,
  onAddShipment,
  smsLogs,
  onSendSms,
  role,
}: {
  shipments: Shipment[];
  onAddShipment: (shipment: Shipment) => void;
  smsLogs: SmsLogItem[];
  onSendSms: (newItems: SmsLogItem[]) => void;
  role: RoleType;
}) {
  const [selectedId, setSelectedId] = useState<string>(shipments[0]?.id || 'AR-9082');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveSimActive, setLiveSimActive] = useState<boolean>(true);
  const [simTick, setSimTick] = useState<number>(0);

  // Modals
  const [podOpen, setPodOpen] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newShipmentOpen, setNewShipmentOpen] = useState(false);
  const [driverLiveSharing, setDriverLiveSharing] = useState(false);
  const [waybillDownloaded, setWaybillDownloaded] = useState(false);

  // New shipment form state
  const [newClient, setNewClient] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newUnits, setNewUnits] = useState('10');
  const [newOrigin, setNewOrigin] = useState('Gebze OSB Depo');
  const [newDest, setNewDest] = useState('İzmir Liman Terminali');
  const [newPlate, setNewPlate] = useState('34 AR 990');
  const [newDriver, setNewDriver] = useState('Murat Kaya');

  useEffect(() => {
    if (!liveSimActive) return;
    const timer = setInterval(() => {
      setSimTick((t) => (t + 1) % 20);
    }, 3000);
    return () => clearInterval(timer);
  }, [liveSimActive]);

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.client.toLowerCase().includes(q) ||
        s.product.toLowerCase().includes(q) ||
        s.plate.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [shipments, statusFilter, searchQuery]);

  const activeShipment =
    shipments.find((s) => s.id === selectedId) ||
    filteredShipments[0] ||
    shipments[0];

  // Subtle live telemetry oscillation for active trucks
  const isMoving = activeShipment.speed > 0;
  const liveSpeed = isMoving
    ? activeShipment.speed + ((simTick % 3) - 1) * 2
    : 0;
  const liveTemp = isMoving
    ? Number((activeShipment.temperature + ((simTick % 3) - 1) * 0.1).toFixed(1))
    : activeShipment.temperature;

  // SMS state synced whenever activeShipment changes
  const [driverSms, setDriverSms] = useState('');
  const [customerSms, setCustomerSms] = useState('');
  const [smsSentBanner, setSmsSentBanner] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);

  useEffect(() => {
    setDriverSms(
      `${activeShipment.id} — ${activeShipment.destination} teslimatı ${activeShipment.etaText} bekleniyor. Rota onayınız gerekiyor.`
    );
    setCustomerSms(
      `Sayın ${activeShipment.client}, sevkiyatınız ${activeShipment.id} yola çıktı. Tahmini teslimat: ${activeShipment.etaText}.`
    );
    setSmsError(null);
  }, [activeShipment]);

  const handleDispatchSms = () => {
    const cleanDriver = sanitizeText(driverSms, 240).trim();
    const cleanCustomer = sanitizeText(customerSms, 240).trim();

    if (!cleanDriver && !cleanCustomer) {
      setSmsError('Lütfen gönderilecek en az bir SMS metni girin.');
      return;
    }

    const rateCheck = smsRateLimiter.tryAcquire();
    if (!rateCheck.allowed) {
      setSmsError(
        `Güvenlik Sınırı: Çok sık SMS isteği gönderildi. ${rateCheck.retryInSeconds} sn bekleyin.`
      );
      return;
    }

    setSmsError(null);
    const nowLabel = 'Şimdi — Canlı';
    const created: SmsLogItem[] = [];

    if (cleanDriver) {
      created.push({
        id: `sms-${Date.now()}-d`,
        shipmentId: activeShipment.id,
        recipient: 'driver',
        phone: activeShipment.driverPhone,
        message: cleanDriver,
        timestamp: nowLabel,
        status: 'delivered',
      });
    }
    if (cleanCustomer) {
      created.push({
        id: `sms-${Date.now()}-c`,
        shipmentId: activeShipment.id,
        recipient: 'customer',
        phone: '+90 212 444 00 01',
        message: cleanCustomer,
        timestamp: nowLabel,
        status: 'sent',
      });
    }

    onSendSms(created);
    setSmsSentBanner(true);
    setTimeout(() => setSmsSentBanner(false), 2500);
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanClient = sanitizeText(newClient, 80).trim();
    const cleanProduct = sanitizeText(newProduct, 100).trim();
    const cleanOrigin = sanitizeText(newOrigin, 80).trim();
    const cleanDest = sanitizeText(newDest, 80).trim();
    const cleanPlate = sanitizeText(newPlate, 20).trim().toUpperCase();
    const cleanDriver = sanitizeText(newDriver, 60).trim();
    const unitsNum = Math.max(1, Math.min(500, parseInt(newUnits, 10) || 10));

    if (!cleanClient || !cleanProduct) return;

    const nextNum = 9130 + shipments.length;
    const created: Shipment = {
      id: `AR-${nextNum}`,
      client: cleanClient,
      product: `${cleanProduct} — ${unitsNum} Palet`,
      units: unitsNum,
      unitLabel: 'Palet',
      origin: cleanOrigin || 'Gebze OSB Depo',
      destination: cleanDest || 'İzmir Liman Terminali',
      vehicle: 'Mercedes Actros 1848',
      plate: cleanPlate || '34 AR 990',
      driverName: cleanDriver || 'Murat Kaya',
      driverPhone: '+90 532 888 19 20',
      status: 'Yükleme',
      currentLocation: `${cleanOrigin} — Rampa 1`,
      etaText: '4 Saat 30 Dakika',
      remainingKm: 340,
      totalKm: 340,
      temperature: 18.5,
      humidity: 46,
      speed: 0,
      tempMin: 14,
      tempMax: 25,
      progressPct: 15,
      stage: STAGE_INDEX.Onay,
      departureDate: '2026-10-21',
      currentLat: 40.8,
      currentLng: 29.43,
      hasPOD: false,
      podSignedBy: '',
      podDate: '',
      route: [
        {
          label: 'Sipariş Onaylandı',
          location: cleanOrigin,
          time: 'Şimdi',
          status: 'current',
          lat: 40.8,
          lng: 29.43,
        },
        {
          label: 'Paletlendi & Çemberlendi',
          location: cleanOrigin,
          time: 'Planlandı',
          status: 'upcoming',
          lat: 40.5,
          lng: 29.1,
        },
        {
          label: 'Ambar / Hat Tırında',
          location: 'Ana Koridor',
          time: 'Planlandı',
          status: 'upcoming',
          lat: 39.9,
          lng: 28.15,
        },
        {
          label: 'Varış Ambarı / Dağıtımda',
          location: cleanDest,
          time: 'Planlandı',
          status: 'upcoming',
          lat: 38.8,
          lng: 27.2,
        },
        {
          label: 'Teslim Edildi & İrsaliye Onaylandı',
          location: cleanDest,
          time: 'Planlandı',
          status: 'upcoming',
          lat: 38.46,
          lng: 26.84,
        },
      ],
    };

    onAddShipment(created);
    setSelectedId(created.id);
    setNewClient('');
    setNewProduct('');
    setNewShipmentOpen(false);
  };

  const statusTabs: { id: string; label: string }[] = [
    { id: 'ALL', label: `Tümü (${shipments.length})` },
    {
      id: 'Yolda',
      label: `Yolda (${shipments.filter((s) => s.status === 'Yolda').length})`,
    },
    {
      id: 'Gecikti',
      label: `Gecikti (${shipments.filter((s) => s.status === 'Gecikti').length})`,
    },
    {
      id: 'Yükleme',
      label: `Yükleme (${shipments.filter((s) => s.status === 'Yükleme').length})`,
    },
    {
      id: 'Teslim Edildi',
      label: `Teslim (${shipments.filter((s) => s.status === 'Teslim Edildi').length})`,
    },
  ];

  return (
    <div className="animate-view-enter space-y-4 md:space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">Operasyon Yönetimi</h2>
          <p className="text-xs text-steel-500">
            Aktif sevkiyat takibi, iklim kontrolü ve SMS dispatch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLiveSimActive(!liveSimActive)}
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors ${
              liveSimActive
                ? 'border-emerald/40 bg-emerald/10 text-emerald'
                : 'border-stealth-600 bg-stealth-900 text-steel-500'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            {liveSimActive ? 'Canlı Telemetri: AÇIK' : 'Telemetri: DURAKLATILDI'}
          </button>

          {role !== 'customer' && (
            <button
              onClick={() => setNewShipmentOpen(true)}
              className="flex items-center gap-1.5 border border-emerald bg-emerald px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-emerald-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Yeni Sevkiyat
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-3 border border-stealth-600 bg-stealth-900 p-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'border-cyan/40 bg-cyan/10 text-cyan'
                  : 'border-stealth-600 bg-stealth-950 text-steel-400 hover:border-stealth-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(sanitizeText(e.target.value, 60))}
            placeholder="Sevkiyat No, Firma, Plaka ara..."
            className="stealth-input w-full py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {/* Horizontal Shipment Selector Bar */}
      <div className="stealth-scroll flex gap-2 overflow-x-auto pb-2">
        {filteredShipments.map((item) => {
          const isSelected = activeShipment.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`group relative shrink-0 border px-3.5 py-2.5 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-emerald/40 bg-emerald/10'
                  : 'border-stealth-600 bg-stealth-900 hover:border-stealth-500'
              }`}
              style={{ minWidth: '165px' }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-bold text-white">{item.id}</p>
                <span
                  className={`h-1.5 w-1.5 ${
                    item.status === 'Yolda'
                      ? 'bg-cyan'
                      : item.status === 'Teslim Edildi'
                      ? 'bg-emerald'
                      : item.status === 'Gecikti'
                      ? 'bg-crimson'
                      : 'bg-amber'
                  }`}
                />
              </div>
              <p className="mt-0.5 truncate text-[10px] text-steel-400">{item.client}</p>
              <div className="mt-2 h-0.5 w-full bg-stealth-800">
                <div
                  className="stage-connector h-full transition-all duration-300"
                  style={{ width: `${item.progressPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Columns: Active Shipment Details */}
        <div className="lg:col-span-2">
          <StealthCard
            title="Sevkiyat Detayı"
            subtitle={`${activeShipment.id} — ${activeShipment.client}`}
            action={
              <span className="font-mono text-[11px] text-steel-500">
                Çıkış: {activeShipment.departureDate}
              </span>
            }
          >
            <div
              key={activeShipment.id}
              className="animate-card-switch space-y-4 p-4 md:p-5"
            >
              {/* Shipment Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono text-sm font-bold text-white">
                      {activeShipment.id}
                    </h4>
                    <StatusBadge status={activeShipment.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-steel-300">
                    {activeShipment.product}
                  </p>
                  <p className="text-[11px] text-steel-500">{activeShipment.client}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-semibold text-cyan">
                    {activeShipment.etaText}
                  </p>
                  <p className="font-mono text-[11px] text-steel-500">
                    {activeShipment.remainingKm} / {activeShipment.totalKm} km
                  </p>
                </div>
              </div>

              {/* 5-Stage Progress */}
              <StageProgress stage={activeShipment.stage} />

              {/* Exception Banner if delayed */}
              {activeShipment.exceptionAlert && (
                <ExceptionBanner message={activeShipment.exceptionAlert} />
              )}

              {/* 4 Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="stealth-card p-3">
                  <Thermometer className="h-4 w-4 text-amber" />
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {liveTemp.toFixed(1)}°C
                  </p>
                  <p className="text-[10px] text-steel-500">Konteyner</p>
                </div>
                <div className="stealth-card p-3">
                  <Droplets className="h-4 w-4 text-cyan" />
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {activeShipment.humidity}%
                  </p>
                  <p className="text-[10px] text-steel-500">Nem</p>
                </div>
                <div className="stealth-card p-3">
                  <Gauge className="h-4 w-4 text-emerald" />
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {liveSpeed} km/s
                  </p>
                  <p className="text-[10px] text-steel-500">Hız</p>
                </div>
                <div className="stealth-card p-3">
                  <Package className="h-4 w-4 text-steel-400" />
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {activeShipment.units} {activeShipment.unitLabel}
                  </p>
                  <p className="text-[10px] text-steel-500">Yük</p>
                </div>
              </div>

              {/* Cold Chain Compliance Bar */}
              <ClimateComplianceBar shipment={activeShipment} liveTemp={liveTemp} />

              {/* Origin/Dest & Vehicle/Driver */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="stealth-card p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
                    <MapPin className="h-3 w-3 text-cyan" /> Çıkış
                  </p>
                  <p className="text-xs text-steel-300">{activeShipment.origin}</p>
                  <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
                    Varış
                  </p>
                  <p className="text-xs text-steel-300">{activeShipment.destination}</p>
                </div>
                <div className="stealth-card p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
                    <Truck className="h-3 w-3 text-emerald" /> Araç
                  </p>
                  <p className="text-xs text-steel-300">
                    {activeShipment.vehicle} —{' '}
                    <span className="font-mono text-white">{activeShipment.plate}</span>
                  </p>
                  <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
                    Sürücü
                  </p>
                  <p className="text-xs text-steel-300">{activeShipment.driverName}</p>
                  <p className="font-mono text-[11px] text-steel-500">
                    {activeShipment.driverPhone}
                  </p>
                </div>
              </div>

              {/* Vector Route Map */}
              <VectorRouteMap shipment={activeShipment} />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDriverModalOpen(true)}
                  className="flex items-center gap-1.5 border border-cyan/40 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan transition-colors hover:bg-cyan/20"
                >
                  <Navigation className="h-4 w-4" /> Sürücü Takibi
                </button>
                <button
                  onClick={() => {
                    setWaybillDownloaded(false);
                    setCustomerModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 border border-emerald/40 bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald transition-colors hover:bg-emerald/20"
                >
                  <Phone className="h-4 w-4" /> Müşteri Takibi
                </button>
                <button
                  onClick={() => setPodOpen(true)}
                  disabled={!activeShipment.hasPOD}
                  className={`flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold transition-colors ${
                    activeShipment.hasPOD
                      ? 'border-emerald/40 bg-emerald/10 text-emerald hover:bg-emerald/20'
                      : 'cursor-not-allowed border-stealth-600 bg-stealth-800 text-steel-600'
                  }`}
                >
                  <CircleCheck className="h-4 w-4" />{' '}
                  {activeShipment.hasPOD ? 'POD Görüntüle' : 'POD Bekliyor'}
                </button>
              </div>
            </div>
          </StealthCard>
        </div>

        {/* Right Column: SMS Dispatch & History */}
        <div className="space-y-4">
          <StealthCard
            title="SMS Dispatch"
            subtitle="Sürücü & müşteri bildirimi (XSS Korumalı)"
          >
            <div className="space-y-4 p-4 md:p-5">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
                  <Truck className="h-3 w-3 text-cyan" /> Sürücü SMS —{' '}
                  <span className="font-mono">{activeShipment.driverPhone}</span>
                </label>
                <textarea
                  value={driverSms}
                  onChange={(e) => setDriverSms(e.target.value)}
                  rows={2}
                  maxLength={240}
                  className="stealth-input w-full resize-none p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
                  <Phone className="h-3 w-3 text-emerald" /> Müşteri SMS
                </label>
                <textarea
                  value={customerSms}
                  onChange={(e) => setCustomerSms(e.target.value)}
                  rows={2}
                  maxLength={240}
                  className="stealth-input w-full resize-none p-2.5 text-xs"
                />
              </div>

              {smsError && (
                <p className="border border-crimson/40 bg-crimson/10 px-2.5 py-1.5 text-[11px] text-crimson">
                  {smsError}
                </p>
              )}

              <button
                onClick={handleDispatchSms}
                className={`flex items-center gap-2 border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  smsSentBanner
                    ? 'border-emerald/40 bg-emerald/10 text-emerald'
                    : 'border-emerald bg-emerald text-black hover:bg-emerald-300'
                }`}
              >
                {smsSentBanner ? (
                  <CircleCheck className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}{' '}
                {smsSentBanner ? 'SMS Kuyruğa Eklendi & İletildi' : 'SMS Gönder'}
              </button>
            </div>
          </StealthCard>

          <StealthCard
            title="SMS Geçmişi"
            subtitle={`Son gönderimler (${smsLogs.length} kayıt)`}
          >
            <div className="stealth-scroll max-h-[380px] space-y-2 overflow-y-auto p-4 md:p-5">
              {smsLogs.map((sms) => (
                <div
                  key={sms.id}
                  className="border border-stealth-600 bg-stealth-950 p-3 transition-colors hover:border-stealth-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
                      <MessageSquare className="h-3 w-3" />{' '}
                      {sms.recipient === 'driver' ? 'Sürücü' : 'Müşteri'} —{' '}
                      <span className="font-mono">{sms.phone}</span>
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        sms.status === 'read'
                          ? 'text-emerald'
                          : sms.status === 'delivered'
                          ? 'text-cyan'
                          : 'text-amber'
                      }`}
                    >
                      {sms.status === 'read'
                        ? 'Okundu'
                        : sms.status === 'delivered'
                        ? 'İletildi'
                        : 'Gönderildi'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-steel-300">{sms.message}</p>
                  <p className="mt-1 font-mono text-[10px] text-steel-600">
                    {sms.timestamp} — {sms.shipmentId}
                  </p>
                </div>
              ))}
            </div>
          </StealthCard>
        </div>
      </div>

      {/* POD Modal */}
      <Modal
        open={podOpen}
        onClose={() => setPodOpen(false)}
        title="Teslim Belgesi (POD)"
        subtitle="Kriptografik zaman damgalı dijital teslimat tutanağı"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <CircleCheck className="h-5 w-5 text-emerald" />
              <p className="text-sm font-bold text-emerald">Teslim Edildi</p>
            </div>
            <p className="mt-2 text-xs text-steel-300">
              {activeShipment.id} — {activeShipment.product}
            </p>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-steel-500">İmzalayan:</span>
                <span className="font-medium text-white">
                  {activeShipment.podSignedBy}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-500">Tarih:</span>
                <span className="font-mono text-white">{activeShipment.podDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-500">Varış:</span>
                <span className="text-white">{activeShipment.destination}</span>
              </div>
            </div>
          </div>

          <div className="border border-emerald/20 bg-emerald/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-steel-500">
                Dijital İmza & Doğrulama
              </p>
              <span className="font-mono text-[10px] text-emerald">DOĞRULANDI</span>
            </div>
            <p className="mt-2 font-mono text-lg text-emerald">
              {activeShipment.podSignedBy}
            </p>
          </div>
        </div>
      </Modal>

      {/* Driver Tracking Modal */}
      <Modal
        open={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        title="Sürücü Takibi"
        maxWidth="max-w-sm"
      >
        <PhoneFrame label="Sürücü Mobil Terminali">
          <div className="space-y-3">
            <div className="flex items-center justify-between border border-stealth-600 bg-stealth-900 p-2.5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-cyan" />
                <div>
                  <p className="font-mono text-xs font-bold text-white">
                    {activeShipment.plate}
                  </p>
                  <p className="text-[10px] text-steel-500">
                    {activeShipment.driverName}
                  </p>
                </div>
              </div>
              {driverLiveSharing && (
                <span className="badge-emerald text-[10px]">CANLI GPS</span>
              )}
            </div>

            <div className="border border-stealth-600 bg-stealth-900 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-steel-600">
                Mevcut Konum
              </p>
              <p className="mt-1 text-xs text-steel-300">
                {activeShipment.currentLocation}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border border-stealth-600 bg-stealth-900 p-2.5 text-center">
                <Gauge className="mx-auto h-4 w-4 text-emerald" />
                <p className="mt-1 font-mono text-xs font-bold text-white">
                  {liveSpeed}
                </p>
                <p className="text-[10px] text-steel-500">km/s</p>
              </div>
              <div className="border border-stealth-600 bg-stealth-900 p-2.5 text-center">
                <Clock className="mx-auto h-4 w-4 text-cyan" />
                <p className="mt-1 font-mono text-xs font-bold text-white">
                  {activeShipment.etaText}
                </p>
                <p className="text-[10px] text-steel-500">Kalan</p>
              </div>
            </div>

            <button
              onClick={() => setDriverLiveSharing((v) => !v)}
              className={`w-full border py-2 text-xs font-semibold transition-colors ${
                driverLiveSharing
                  ? 'border-emerald/40 bg-emerald/10 text-emerald'
                  : 'border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20'
              }`}
            >
              {driverLiveSharing
                ? 'Canlı Konum Paylaşımı Aktif (Durdur)'
                : 'Konum Paylaşımını Başlat'}
            </button>
          </div>
        </PhoneFrame>
      </Modal>

      {/* Customer Tracking Modal */}
      <Modal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Müşteri Takibi"
        maxWidth="max-w-sm"
      >
        <PhoneFrame label="Müşteri Takip Ekranı">
          <div className="space-y-3">
            <div className="border border-emerald/40 bg-emerald/10 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-emerald">
                Tahmini Teslimat
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-white">
                {activeShipment.etaText}
              </p>
              <p className="text-[10px] text-steel-500">
                {activeShipment.remainingKm} km kaldı
              </p>
            </div>

            <div className="border border-stealth-600 bg-stealth-900 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-steel-600">
                Sevkiyat
              </p>
              <p className="mt-1 font-mono text-xs font-bold text-white">
                {activeShipment.id}
              </p>
              <p className="text-[10px] text-steel-500">{activeShipment.product}</p>
            </div>

            <div className="space-y-1.5">
              {activeShipment.route.map((stop, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 ${
                        stop.status === 'completed'
                          ? 'bg-emerald'
                          : stop.status === 'current'
                          ? 'animate-pulse bg-cyan'
                          : 'border border-steel-500'
                      }`}
                    />
                    <p className="text-[11px] text-steel-300">{stop.label}</p>
                  </div>
                  <span className="font-mono text-[9px] text-steel-500">
                    {stop.time}
                  </span>
                </div>
              ))}
            </div>

            {waybillDownloaded && (
              <p className="border border-emerald/40 bg-emerald/10 px-2.5 py-1.5 text-center text-[10px] text-emerald">
                e-İrsaliye ({activeShipment.id}) doğrulandı ve hazırlandı.
              </p>
            )}

            <div className="flex gap-2">
              <a
                href={`tel:${activeShipment.driverPhone.replace(/\s+/g, '')}`}
                className="flex-1 border border-emerald/40 bg-emerald/10 py-2 text-center text-xs font-semibold text-emerald transition-colors hover:bg-emerald/20"
              >
                Sürücüyü Ara
              </a>
              <button
                onClick={() => setWaybillDownloaded(true)}
                className="flex-1 border border-stealth-600 bg-stealth-900 py-2 text-xs font-semibold text-steel-300 transition-colors hover:border-stealth-500 hover:text-white"
              >
                İrsaliye PDF
              </button>
            </div>
          </div>
        </PhoneFrame>
      </Modal>

      {/* Create New Shipment Modal */}
      <Modal
        open={newShipmentOpen}
        onClose={() => setNewShipmentOpen(false)}
        title="Yeni Sevkiyat Kaydı Oluştur"
        subtitle="Girdiler otomatik olarak sterilize edilir ve rotaya atanır"
      >
        <form onSubmit={handleCreateShipment} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block text-steel-400">Müşteri Firma Adı *</label>
            <input
              type="text"
              required
              value={newClient}
              onChange={(e) => setNewClient(e.target.value)}
              placeholder="Örn: Kordsa Teknik Tekstil A.Ş."
              className="stealth-input w-full px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-steel-400">Ürün / Yük Tanımı *</label>
              <input
                type="text"
                required
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="Örn: Endüstriyel Polimer Bobin"
                className="stealth-input w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-steel-400">Palet Adedi *</label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={newUnits}
                onChange={(e) => setNewUnits(e.target.value)}
                className="stealth-input w-full px-3 py-2 font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-steel-400">Çıkış Depo</label>
              <input
                type="text"
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                className="stealth-input w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-steel-400">Varış Noktası</label>
              <input
                type="text"
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                className="stealth-input w-full px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-steel-400">Araç Plakası</label>
              <input
                type="text"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                className="stealth-input w-full px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-steel-400">Sürücü Adı Soyadı</label>
              <input
                type="text"
                value={newDriver}
                onChange={(e) => setNewDriver(e.target.value)}
                className="stealth-input w-full px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewShipmentOpen(false)}
              className="border border-stealth-600 bg-stealth-900 px-4 py-2 font-semibold text-steel-400 hover:text-white"
            >
              İptal
            </button>
            <button
              type="submit"
              className="border border-emerald bg-emerald px-4 py-2 font-semibold text-black hover:bg-emerald-300"
            >
              Sevkiyatı Başlat
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
