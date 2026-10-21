import React, { useState } from 'react';
import {
  Boxes,
  DollarSign,
  Lock,
  Package,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import {
  CUSTOMER_REVENUE_SLICES,
  INITIAL_INVENTORY,
  TOP_PRODUCTS,
  WEEKLY_BREAKDOWN,
  WEEKLY_FINANCIALS,
} from '../data/mockData';
import {
  DonutRevenueChart,
  getMarginBadge,
  KpiCard,
  SlideDrawer,
  StatusBadge,
  StealthCard,
  WeeklyComposedChart,
} from './ui/Primitives';

export function FinanceSalesView({
  onTriggerUpgrade,
}: {
  onTriggerUpgrade: () => void;
}) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const totalRevenue = WEEKLY_FINANCIALS.reduce((n, i) => n + i.revenue, 0);
  const totalProfit = WEEKLY_FINANCIALS.reduce((n, i) => n + i.netProfit, 0);
  const avgMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const lowStock = INITIAL_INVENTORY.filter((t) => t.status !== 'in-stock');
  const maxRev = Math.max(...TOP_PRODUCTS.map((i) => i.revenue));
  const weekShipments = selectedWeek ? WEEKLY_BREAKDOWN[selectedWeek] || [] : [];

  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white md:text-xl">Finans & Satış</h2>
        <p className="text-xs text-steel-500">
          KPI'lar, kârlılık analizi ve stok yönetimi
        </p>
      </div>

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
          value="111"
          sub="6 hafta"
          icon={Boxes}
          accent="text-steel-400"
        />
      </div>

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StealthCard title="Müşteri Ciro Dağılımı" subtitle="Bu çeyrek">
          <DonutRevenueChart data={CUSTOMER_REVENUE_SLICES} />
          <div className="grid grid-cols-2 gap-2 p-4 pt-0">
            {CUSTOMER_REVENUE_SLICES.map((e) => (
              <div key={e.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5"
                  style={{ backgroundColor: e.color }}
                />
                <span className="truncate text-[11px] text-steel-400">
                  {e.name}
                </span>
                <span className="ml-auto text-[11px] font-semibold text-white">
                  ₺{(e.revenue / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>
        </StealthCard>

        <StealthCard
          title="Düşük Stok Uyarıları"
          subtitle={`${lowStock.length} kritik ürün`}
        >
          <div className="space-y-2 p-4">
            {lowStock.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between border border-stealth-600 bg-stealth-950 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <TriangleAlert
                    className={`h-4 w-4 ${
                      t.status === 'critical' ? 'text-crimson' : 'text-amber'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-steel-500">
                      {t.sku} — {t.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      t.status === 'critical' ? 'text-crimson' : 'text-amber'
                    }`}
                  >
                    {t.stock}
                  </p>
                  <p className="text-[10px] text-steel-500">
                    Min: {t.reorderLevel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </StealthCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StealthCard title="En Çok Satan Ürünler" subtitle="Gelir bazlı sıralama">
          <div className="space-y-3 p-4">
            {TOP_PRODUCTS.map((e, idx) => {
              const pct = ((e.revenue / maxRev) * 100).toFixed(0);
              return (
                <div key={idx}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-xs text-steel-300">
                      {e.name}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      ₺{e.revenue.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-stealth-800">
                    <div
                      className="stage-connector h-full"
                      style={{ width: `${pct}%` }}
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

      <StealthCard
        title="Haftalık Detay"
        subtitle="Tıklayınca sevkiyat kırılımı"
      >
        <div className="stealth-scroll overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-stealth-600">
                <th className="px-3 py-2 font-semibold text-steel-400">Hafta</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Ciro</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Net Kâr</th>
                <th className="px-3 py-2 font-semibold text-steel-400">Marj</th>
                <th className="px-3 py-2 font-semibold text-steel-400">
                  Sevkiyat
                </th>
                <th className="px-3 py-2 font-semibold text-steel-400">Saat</th>
              </tr>
            </thead>
            <tbody>
              {WEEKLY_FINANCIALS.map((t) => (
                <tr
                  key={t.weekNum}
                  onClick={() => setSelectedWeek(t.weekNum)}
                  className="cursor-pointer border-b border-stealth-800 hover:bg-stealth-800"
                >
                  <td className="px-3 py-2.5 text-steel-300">{t.week}</td>
                  <td className="px-3 py-2.5 text-white">
                    ₺{t.revenue.toLocaleString('tr-TR')}
                  </td>
                  <td
                    className={`px-3 py-2.5 font-semibold ${
                      t.netProfit < 0 ? 'text-crimson' : 'text-emerald'
                    }`}
                  >
                    ₺{t.netProfit.toLocaleString('tr-TR')}
                  </td>
                  <td
                    className={`px-3 py-2.5 ${
                      t.margin < 15
                        ? 'text-crimson'
                        : t.margin <= 25
                        ? 'text-amber'
                        : 'text-emerald'
                    }`}
                  >
                    %{t.margin.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-steel-400">
                    {t.shipmentCount}
                  </td>
                  <td className="px-3 py-2.5 text-steel-400">
                    {t.actualHours}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StealthCard>

      <StealthCard
        title="Stok Durumu"
        subtitle={`${INITIAL_INVENTORY.length} ürün`}
        action={
          <button
            onClick={() => setInventoryOpen(true)}
            className="text-xs text-cyan hover:text-cyan-300"
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
              {INITIAL_INVENTORY.slice(0, 5).map((t) => (
                <tr key={t.id} className="border-b border-stealth-800">
                  <td className="px-3 py-2.5 text-steel-300">{t.name}</td>
                  <td className="px-3 py-2.5 text-white">{t.stock}</td>
                  <td className="px-3 py-2.5 text-steel-500">
                    {t.reorderLevel}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      status={
                        t.status === 'in-stock'
                          ? 'active'
                          : t.status === 'low'
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

      <SlideDrawer
        open={selectedWeek !== null}
        onClose={() => setSelectedWeek(null)}
        title={`${selectedWeek}. Hafta Sevkiyatları`}
        subtitle={`${weekShipments.length} sevkiyat`}
      >
        <div className="space-y-3">
          {weekShipments.map((o) => {
            const l = getMarginBadge(o.margin);
            return (
              <div
                key={o.id}
                className="border border-stealth-600 bg-stealth-950 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">{o.id}</p>
                  <span className={l.bg}>
                    {l.label} — %{o.margin.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-steel-500">
                  {o.client} — {o.product}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-steel-400">
                    Satış: ₺{o.sellPrice.toLocaleString('tr-TR')}
                  </span>
                  <span
                    className={
                      o.netProfit < 0 ? 'text-crimson' : 'text-emerald'
                    }
                  >
                    Net: ₺{o.netProfit.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SlideDrawer>

      <SlideDrawer
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        title="Stok Envanteri"
        subtitle={`${INITIAL_INVENTORY.length} ürün`}
      >
        <div className="stealth-scroll overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-xs">
            <thead>
              <tr className="border-b border-stealth-600">
                <th className="px-2 py-2 font-semibold text-steel-400">Ürün</th>
                <th className="px-2 py-2 font-semibold text-steel-400">SKU</th>
                <th className="px-2 py-2 font-semibold text-steel-400">Stok</th>
                <th className="px-2 py-2 font-semibold text-steel-400">Fiyat</th>
                <th className="px-2 py-2 font-semibold text-steel-400">
                  Lokasyon
                </th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_INVENTORY.map((o) => (
                <tr key={o.id} className="border-b border-stealth-800">
                  <td className="px-2 py-2.5 text-steel-300">{o.name}</td>
                  <td className="px-2 py-2.5 text-steel-500">{o.sku}</td>
                  <td
                    className={`px-2 py-2.5 font-semibold ${
                      o.status === 'critical'
                        ? 'text-crimson'
                        : o.status === 'low'
                        ? 'text-amber'
                        : 'text-white'
                    }`}
                  >
                    {o.stock}
                  </td>
                  <td className="px-2 py-2.5 text-steel-300">
                    ₺{o.unitPrice.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-2 py-2.5 text-steel-500">{o.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SlideDrawer>
    </div>
  );
}
