import React, { useState } from 'react';
import {
  Boxes,
  CircleCheck,
  DollarSign,
  Lock,
  Package,
  Plus,
  Search,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import {
  CUSTOMER_REVENUE_SLICES,
  TOP_PRODUCTS,
  WEEKLY_BREAKDOWN,
  WEEKLY_FINANCIALS,
} from '../data/mockData';
import type { InventoryItem, TierId } from '../types/logistics';
import { sanitizeText } from '../utils/security';
import {
  DonutRevenueChart,
  getMarginBadge,
  KpiCard,
  Modal,
  SlideDrawer,
  StatusBadge,
  StealthCard,
  WeeklyComposedChart,
} from './ui/Primitives';

export function FinanceSalesView({
  mode,
  currentTier,
  inventory,
  onRestockItem,
  onTriggerUpgrade,
}: {
  mode: 'finance' | 'sales';
  currentTier: TierId;
  inventory: InventoryItem[];
  onRestockItem: (id: string, addedQty: number) => void;
  onTriggerUpgrade: () => void;
}) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [inventoryDrawerOpen, setInventoryDrawerOpen] = useState(false);
  const [execReportOpen, setExecReportOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<'ALL' | 'critical' | 'low' | 'in-stock'>(
    'ALL'
  );
  const [stockQuery, setStockQuery] = useState('');

  const totalRevenue = WEEKLY_FINANCIALS.reduce((sum, w) => sum + w.revenue, 0);
  const totalProfit = WEEKLY_FINANCIALS.reduce((sum, w) => sum + w.netProfit, 0);
  const avgMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);
  const totalShipments = WEEKLY_FINANCIALS.reduce((sum, w) => sum + w.shipmentCount, 0);

  const lowStockItems = inventory.filter((item) => item.status !== 'in-stock');
  const maxProductRev = Math.max(...TOP_PRODUCTS.map((p) => p.revenue));

  const filteredInventory = inventory.filter((item) => {
    const matchesStatus = stockFilter === 'ALL' || item.status === stockFilter;
    const q = stockQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesStatus && matchesQ;
  });

  const activeWeekShipments = selectedWeek ? WEEKLY_BREAKDOWN[selectedWeek] || [] : [];
  const isPdfUnlocked = currentTier === 'pro' || currentTier === 'enterprise';

  return (
    <div key={mode} className="animate-view-enter space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">
            {mode === 'sales' ? 'Satış & Stok Envanteri' : 'Finans & Satış Analitiği'}
          </h2>
          <p className="text-xs text-steel-500">
            {mode === 'sales'
              ? 'Depo doluluk oranları, kritik stok uyarıları ve ürün bazlı satış hızı'
              : "KPI'lar, kârlılık analizi, COGS kırılımı ve stok yönetimi"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInventoryDrawerOpen(true)}
            className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-xs font-semibold text-cyan transition-colors hover:bg-cyan/20"
          >
            Tam Envanter ({inventory.length} SKU)
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Toplam Ciro"
          value={`₺${(totalRevenue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          accent="text-emerald"
          trend="+12.4%"
          trendUp={true}
        />
        <KpiCard
          label="Net Kâr"
          value={`₺${(totalProfit / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          accent="text-cyan"
          trend="+8.1%"
          trendUp={true}
        />
        <KpiCard
          label="Ort. Marj"
          value={`%${avgMargin}`}
          icon={Package}
          accent="text-amber"
          trend="-2.1%"
          trendUp={false}
        />
        <KpiCard
          label="Sevkiyat"
          value={`${totalShipments}`}
          sub="6 hafta"
          icon={Boxes}
          accent="text-steel-400"
        />
      </div>

      {/* Executive PDF Banner (Unlocks on Pro/Enterprise) */}
      {isPdfUnlocked ? (
        <div className="flex flex-col items-start justify-between gap-3 border border-emerald/40 bg-emerald/10 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CircleCheck className="h-6 w-6 text-emerald" />
            <div>
              <p className="text-sm font-semibold text-emerald">
                Haftalık Yönetici PDF Özeti Aktif ({currentTier.toUpperCase()})
              </p>
              <p className="text-xs text-steel-300">
                6 haftalık kârlılık, navlun sapmaları ve soğuk zincir raporu hazır
              </p>
            </div>
          </div>
          <button
            onClick={() => setExecReportOpen(true)}
            className="border border-emerald bg-emerald px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-emerald-300"
          >
            Yönetici Özetini Aç
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-between gap-3 border border-amber/40 bg-amber/10 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-amber" />
            <div>
              <p className="text-sm font-semibold text-amber">
                Haftalık Yönetici PDF Özeti Kilitli
              </p>
              <p className="text-xs text-steel-400">
                Pro veya Enterprise pakete yükseltin
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerUpgrade}
            className="border border-amber/40 bg-amber/10 px-4 py-2 text-xs font-semibold text-amber transition-colors hover:bg-amber/20"
          >
            Paket Yükselt
          </button>
        </div>
      )}

      {/* If mode === 'sales', put Stock & Top Products first for immediate focus; otherwise put Charts & Financials first */}
      {mode === 'sales' && (
        <StealthCard
          title="Stok Envanteri & Hızlı İkmal"
          subtitle={`${inventory.length} aktif SKU — Kritik ve düşük stokları tek tıkla ikmal edin`}
        >
          <div className="space-y-3 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'ALL', label: `Tümü (${inventory.length})` },
                    {
                      id: 'critical',
                      label: `Kritik (${
                        inventory.filter((i) => i.status === 'critical').length
                      })`,
                    },
                    {
                      id: 'low',
                      label: `Düşük (${
                        inventory.filter((i) => i.status === 'low').length
                      })`,
                    },
                    {
                      id: 'in-stock',
                      label: `Yeterli (${
                        inventory.filter((i) => i.status === 'in-stock').length
                      })`,
                    },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setStockFilter(t.id)}
                    className={`border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      stockFilter === t.id
                        ? 'border-emerald/40 bg-emerald/10 text-emerald'
                        : 'border-stealth-600 bg-stealth-950 text-steel-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
                <input
                  type="text"
                  value={stockQuery}
                  onChange={(e) => setStockQuery(sanitizeText(e.target.value, 50))}
                  placeholder="SKU, ürün veya depo ara..."
                  className="stealth-input w-full py-1.5 pl-8 pr-3 text-xs"
                />
              </div>
            </div>

            <div className="stealth-scroll overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead>
                  <tr className="border-b border-stealth-600">
                    <th className="px-3 py-2 font-semibold text-steel-400">SKU</th>
                    <th className="px-3 py-2 font-semibold text-steel-400">Ürün</th>
                    <th className="px-3 py-2 font-semibold text-steel-400">Lokasyon</th>
                    <th className="px-3 py-2 font-semibold text-steel-400">Stok / Min</th>
                    <th className="px-3 py-2 font-semibold text-steel-400">Birim Fiyat</th>
                    <th className="px-3 py-2 font-semibold text-steel-400">Durum</th>
                    <th className="px-3 py-2 text-right font-semibold text-steel-400">
                      İkmal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-stealth-800 transition-colors hover:bg-stealth-800/60"
                    >
                      <td className="px-3 py-2.5 font-mono text-cyan">{item.sku}</td>
                      <td className="px-3 py-2.5 font-medium text-white">{item.name}</td>
                      <td className="px-3 py-2.5 text-steel-400">{item.location}</td>
                      <td className="px-3 py-2.5 font-mono">
                        <span
                          className={
                            item.status === 'critical'
                              ? 'font-bold text-crimson'
                              : item.status === 'low'
                              ? 'font-bold text-amber'
                              : 'text-white'
                          }
                        >
                          {item.stock}
                        </span>{' '}
                        <span className="text-steel-600">/ {item.reorderLevel}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-steel-300">
                        ₺{item.unitPrice.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          status={
                            item.status === 'in-stock'
                              ? 'active'
                              : item.status === 'low'
                              ? 'expiring'
                              : 'inactive'
                          }
                          translateStatus
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => onRestockItem(item.id, 25)}
                          className="inline-flex items-center gap-1 border border-emerald/40 bg-emerald/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald transition-colors hover:bg-emerald/20"
                        >
                          <Plus className="h-3 w-3" /> +25 Palet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </StealthCard>
      )}

      {/* Row 1: Customer Revenue Donut + Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StealthCard title="Müşteri Ciro Dağılımı" subtitle="Bu çeyrek">
          <DonutRevenueChart data={CUSTOMER_REVENUE_SLICES} />
          <div className="grid grid-cols-2 gap-2 p-4 pt-0">
            {CUSTOMER_REVENUE_SLICES.map((slice) => (
              <div key={slice.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-[11px] text-steel-400">{slice.name}</span>
                <span className="ml-auto font-mono text-[11px] font-semibold text-white">
                  ₺{(slice.revenue / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>
        </StealthCard>

        <StealthCard
          title="Düşük Stok Uyarıları"
          subtitle={`${lowStockItems.length} kritik ürün`}
        >
          <div className="space-y-2 p-4">
            {lowStockItems.length === 0 ? (
              <div className="border border-emerald/40 bg-emerald/10 p-4 text-center text-xs text-emerald">
                Tüm depo kalemleri minimum güvenli stok seviyesinin üzerinde.
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-stealth-600 bg-stealth-950 p-3 transition-colors hover:border-stealth-500"
                >
                  <div className="flex items-center gap-2.5">
                    <TriangleAlert
                      className={`h-4 w-4 shrink-0 ${
                        item.status === 'critical' ? 'text-crimson' : 'text-amber'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{item.name}</p>
                      <p className="font-mono text-[10px] text-steel-500">
                        {item.sku} — {item.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`font-mono text-sm font-bold ${
                          item.status === 'critical' ? 'text-crimson' : 'text-amber'
                        }`}
                      >
                        {item.stock}
                      </p>
                      <p className="font-mono text-[10px] text-steel-500">
                        Min: {item.reorderLevel}
                      </p>
                    </div>
                    <button
                      onClick={() => onRestockItem(item.id, 25)}
                      title="Hızlı Stok İkmali (+25)"
                      className="border border-stealth-600 bg-stealth-900 px-2 py-1 font-mono text-[10px] font-semibold text-emerald transition-colors hover:border-emerald/40 hover:bg-emerald/10"
                    >
                      +25
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </StealthCard>
      </div>

      {/* Row 2: Top Selling Products + Weekly Cost & Profit Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StealthCard title="En Çok Satan Ürünler" subtitle="Gelir bazlı sıralama">
          <div className="space-y-3 p-4">
            {TOP_PRODUCTS.map((prod) => {
              const widthPct = ((prod.revenue / maxProductRev) * 100).toFixed(0);
              return (
                <div key={prod.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-xs text-steel-300">{prod.name}</span>
                    <span className="font-mono text-xs font-semibold text-white">
                      ₺{prod.revenue.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-stealth-800">
                    <div
                      className="stage-connector h-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </StealthCard>

        <StealthCard title="Haftalık Maliyet & Kâr" subtitle="COGS breakdown">
          <WeeklyComposedChart data={WEEKLY_FINANCIALS} />
        </StealthCard>
      </div>

      {/* Weekly Breakdown Table */}
      <StealthCard
        title="Haftalık Detay"
        subtitle="Tıklayınca sevkiyat kırılımı"
        action={
          <span className="text-[10px] text-cyan">Detay için satıra tıklayın →</span>
        }
      >
        <div className="stealth-scroll overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-stealth-600">
                <th className="px-3 py-2 font-semibold text-steel-400">Hafta</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Ciro</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Net Kâr</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Marj</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Sevkiyat</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Saat</th>
              </tr>
            </thead>
            <tbody>
              {WEEKLY_FINANCIALS.map((w) => (
                <tr
                  key={w.weekNum}
                  onClick={() => setSelectedWeek(w.weekNum)}
                  className="cursor-pointer border-b border-stealth-800 transition-colors hover:bg-stealth-800"
                >
                  <td className="px-3 py-2.5 font-medium text-steel-300">{w.week}</td>
                  <td className="px-3 py-2.5 font-mono text-white">
                    ₺{w.revenue.toLocaleString('tr-TR')}
                  </td>
                  <td
                    className={`px-3 py-2.5 font-mono font-semibold ${
                      w.netProfit < 0 ? 'text-crimson' : 'text-emerald'
                    }`}
                  >
                    ₺{w.netProfit.toLocaleString('tr-TR')}
                  </td>
                  <td
                    className={`px-3 py-2.5 font-mono ${
                      w.margin < 15
                        ? 'text-crimson'
                        : w.margin <= 25
                        ? 'text-amber'
                        : 'text-emerald'
                    }`}
                  >
                    %{w.margin.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-steel-400">
                    {w.shipmentCount}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-steel-400">
                    {w.actualHours}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StealthCard>

      {/* Stock Overview Table */}
      {mode === 'finance' && (
        <StealthCard
          title="Stok Durumu"
          subtitle={`${inventory.length} ürün`}
          action={
            <button
              onClick={() => setInventoryDrawerOpen(true)}
              className="text-xs text-cyan transition-colors hover:text-cyan-300"
            >
              Tümü →
            </button>
          }
        >
          <div className="stealth-scroll overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="border-b border-stealth-600">
                  <th className="px-3 py-2 font-semibold text-steel-400">Ürün</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Stok</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Min</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Durum</th>
                </tr>
              </thead>
              <tbody>
                {inventory.slice(0, 5).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-stealth-800 transition-colors hover:bg-stealth-800/50"
                  >
                    <td className="px-3 py-2.5 text-steel-300">{item.name}</td>
                    <td className="px-3 py-2.5 font-mono text-white">{item.stock}</td>
                    <td className="px-3 py-2.5 font-mono text-steel-500">
                      {item.reorderLevel}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge
                        status={
                          item.status === 'in-stock'
                            ? 'active'
                            : item.status === 'low'
                            ? 'expiring'
                            : 'inactive'
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StealthCard>
      )}

      {/* SlideDrawer: Weekly Shipments Breakdown */}
      <SlideDrawer
        open={selectedWeek !== null}
        onClose={() => setSelectedWeek(null)}
        title={`${selectedWeek}. Hafta Sevkiyatları`}
        subtitle={`${activeWeekShipments.length} sevkiyat`}
      >
        <div className="space-y-3">
          {activeWeekShipments.map((item) => {
            const mBadge = getMarginBadge(item.margin);
            return (
              <div
                key={item.id}
                className="border border-stealth-600 bg-stealth-950 p-3 transition-colors hover:border-stealth-500"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs font-bold text-white">{item.id}</p>
                  <span className={mBadge.bg}>
                    {mBadge.label} — %{item.margin.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-steel-500">
                  {item.client} — {item.product}
                </p>
                <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-steel-400">
                    Satış: ₺{item.sellPrice.toLocaleString('tr-TR')}
                  </span>
                  <span
                    className={item.netProfit < 0 ? 'text-crimson' : 'text-emerald'}
                  >
                    Net: ₺{item.netProfit.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-stealth-800 pt-1.5 font-mono text-[10px] text-steel-500">
                  <span>Navlun: ₺{item.freight.toLocaleString('tr-TR')}</span>
                  <span>Süre: {item.deliveryTime}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SlideDrawer>

      {/* SlideDrawer: Full Stock Inventory */}
      <SlideDrawer
        open={inventoryDrawerOpen}
        onClose={() => setInventoryDrawerOpen(false)}
        title="Stok Envanteri"
        subtitle={`${inventory.length} ürün`}
        maxWidth="max-w-lg"
      >
        <div className="stealth-scroll overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-stealth-600">
                <th className="px-2 py-2 font-semibold text-steel-400">Ürün</th>
                <th className="px-2 py-2 font-semibold text-steel-400">SKU</th>
                <th className="px-2 py-2 font-semibold text-steel-400">Stok</th>
                <th className="px-2 py-2 font-semibold text-steel-400">Fiyat</th>
                <th className="px-2 py-2 font-semibold text-steel-400">Lokasyon</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-stealth-800">
                  <td className="px-2 py-2.5 text-steel-300">{item.name}</td>
                  <td className="px-2 py-2.5 font-mono text-steel-500">{item.sku}</td>
                  <td
                    className={`px-2 py-2.5 font-mono font-semibold ${
                      item.status === 'critical'
                        ? 'text-crimson'
                        : item.status === 'low'
                        ? 'text-amber'
                        : 'text-white'
                    }`}
                  >
                    {item.stock}
                  </td>
                  <td className="px-2 py-2.5 font-mono text-steel-300">
                    ₺{item.unitPrice.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-2 py-2.5 text-steel-500">{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SlideDrawer>

      {/* Executive Summary Modal */}
      <Modal
        open={execReportOpen}
        onClose={() => setExecReportOpen(false)}
        title="Haftalık Yönetici Özeti (Executive Brief)"
        subtitle="6 Haftalık Konsolide B2B Lojistik & Maliyet Raporu"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-stealth-600 bg-stealth-950 p-3">
              <p className="text-[10px] text-steel-500">Konsolide Ciro</p>
              <p className="mt-1 font-mono text-sm font-bold text-emerald">
                ₺{totalRevenue.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="border border-stealth-600 bg-stealth-950 p-3">
              <p className="text-[10px] text-steel-500">Konsolide Net Kâr</p>
              <p className="mt-1 font-mono text-sm font-bold text-cyan">
                ₺{totalProfit.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="border border-stealth-600 bg-stealth-950 p-3">
              <p className="text-[10px] text-steel-500">Ortalama Marj</p>
              <p className="mt-1 font-mono text-sm font-bold text-amber">
                %{avgMargin}
              </p>
            </div>
          </div>

          <div className="border border-stealth-600 bg-stealth-950 p-3 space-y-2">
            <p className="font-semibold text-white">Öne Çıkan Operasyonel Bulgular:</p>
            <p className="text-steel-300">
              • En yüksek net kârlılık <strong>3. Hafta (%18.6 marj)</strong> ve{' '}
              <strong>5. Hafta (%17.1 marj)</strong> dönemlerinde Sampa Otomotiv ve Ege
              Tekstil hatlarında kaydedilmiştir.
            </p>
            <p className="text-steel-300">
              • Ankara-Niğde koridorundaki hava muhalefeti kaynaklı navlun artışları
              4. Hafta marjını %7.9 seviyesine çekmiştir; alternatif demiryolu/liman
              intermodal kombinasyonu önerilir.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
