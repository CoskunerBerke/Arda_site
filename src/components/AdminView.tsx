import React, { useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { ADMIN_METRICS } from '../data/mockData';
import type { CompanySubscription, SecurityAuditEvent } from '../types/logistics';
import { sanitizeText } from '../utils/security';
import { KpiCard, StatusBadge, StealthCard } from './ui/Primitives';

export function AdminView({
  companies,
  onRenewCompany,
  securityEvents,
}: {
  companies: CompanySubscription[];
  onRenewCompany: (id: string) => void;
  securityEvents: SecurityAuditEvent[];
}) {
  const [planFilter, setPlanFilter] = useState<'ALL' | 'Enterprise' | 'Pro' | 'Basic'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const dynamicMRR = useMemo(
    () => companies.reduce((sum, c) => sum + c.mrr, 0),
    [companies]
  );
  const dynamicARR = dynamicMRR * 12;
  const activeCount = companies.filter((c) => c.status === 'active').length;

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesPlan = planFilter === 'ALL' || c.plan === planFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.plan.toLowerCase().includes(q);
      return matchesPlan && matchesQ;
    });
  }, [companies, planFilter, searchQuery]);

  return (
    <div className="animate-view-enter space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-emerald" />
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">Super Admin Panel</h2>
          <p className="text-xs text-steel-500">
            Platform metrikleri, abonelikler, güvenlik denetimi ve ROI
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="MRR"
          value={`₺${dynamicMRR.toLocaleString('tr-TR')}`}
          icon={DollarSign}
          accent="text-emerald"
          trend="+15%"
          trendUp={true}
        />
        <KpiCard
          label="SaaS Geliri (Yıllık)"
          value={`₺${(dynamicARR / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          accent="text-cyan"
          trend="+22%"
          trendUp={true}
        />
        <KpiCard
          label="Aktif Abonelik"
          value={`${activeCount}`}
          sub={`${companies.length} toplam`}
          icon={Users}
          accent="text-amber"
        />
        <KpiCard
          label="Toplam Sevkiyat"
          value={`${ADMIN_METRICS.totalShipments}`}
          sub="Bu ay"
          icon={Activity}
          accent="text-steel-400"
        />
      </div>

      {/* Platform ROI */}
      <StealthCard
        title="Platform ROI"
        subtitle="Bu ay tasarruf sağlanan süre ve işlenen sevkiyat değeri"
      >
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald" />
              <p className="text-xs font-semibold text-steel-400">Tasarruf Saati</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald">
              {ADMIN_METRICS.hoursSaved}+ saat
            </p>
            <p className="text-[11px] text-steel-500">Operasyonel otomasyon</p>
          </div>

          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-cyan" />
              <p className="text-xs font-semibold text-steel-400">İşlenen Sevkiyat</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-cyan">
              ₺{(ADMIN_METRICS.platformProcessedValue / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-[11px] text-steel-500">Platform üzerinden</p>
          </div>

          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber" />
              <p className="text-xs font-semibold text-steel-400">ROI Çarpanı</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-amber">
              {ADMIN_METRICS.roiMultiplier}x
            </p>
            <p className="text-[11px] text-steel-500">Yatırım getirisi</p>
          </div>
        </div>
      </StealthCard>

      {/* Active Subscriptions Table */}
      <StealthCard
        title="Aktif Abonelikler"
        subtitle={`${companies.length} şirket`}
        action={
          <span className="flex items-center gap-1.5 text-[10px] text-steel-500">
            <Eye className="h-3 w-3 text-emerald" /> Canlı
          </span>
        }
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'Enterprise', 'Pro', 'Basic'] as const).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setPlanFilter(plan)}
                  className={`border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    planFilter === plan
                      ? 'border-emerald/40 bg-emerald/10 text-emerald'
                      : 'border-stealth-600 bg-stealth-950 text-steel-400 hover:text-white'
                  }`}
                >
                  {plan === 'ALL' ? 'Tüm Paketler' : plan}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(sanitizeText(e.target.value, 50))}
                placeholder="Şirket veya e-posta ara..."
                className="stealth-input w-full py-1.5 pl-8 pr-3 text-xs"
              />
            </div>
          </div>

          <div className="stealth-scroll overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-stealth-600">
                  <th className="px-3 py-2 font-semibold text-steel-400">Şirket</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Paket</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">MRR</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Hacim</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Bitiş</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Durum</th>
                  <th className="px-3 py-2 text-right font-semibold text-steel-400">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-stealth-800 transition-colors hover:bg-stealth-800"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-steel-500" />
                        <div>
                          <span className="font-medium text-white">{company.name}</span>
                          <p className="font-mono text-[10px] text-steel-600">
                            {company.contact}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={
                          company.plan === 'Enterprise'
                            ? 'font-semibold text-amber'
                            : company.plan === 'Pro'
                            ? 'font-semibold text-emerald'
                            : 'text-steel-400'
                        }
                      >
                        {company.plan}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-steel-300">
                      ₺{company.mrr.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-steel-400">
                      {company.monthlyVolume}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-steel-500">
                      {company.expiration}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={company.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {company.status !== 'active' ? (
                        <button
                          onClick={() => onRenewCompany(company.id)}
                          className="inline-flex items-center gap-1 border border-emerald/40 bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold text-emerald transition-colors hover:bg-emerald/20"
                        >
                          <RefreshCw className="h-3 w-3" /> Yenile
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-steel-600">
                          Doğrulandı
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </StealthCard>

      {/* Security Audit Log */}
      <StealthCard
        title="Güvenlik & Denetim Kayıtları (Audit Log)"
        subtitle="Çok kiracılı izolasyon, RBAC ve girdi sterilizasyonu olayları"
        action={<span className="badge-emerald text-[10px]">Sıfır Açık Kalkanı</span>}
      >
        <div className="space-y-2 p-4">
          {securityEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col justify-between gap-2 border border-stealth-600 bg-stealth-950 p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      ev.severity === 'blocked'
                        ? 'badge-crimson'
                        : ev.severity === 'warn'
                        ? 'badge-amber'
                        : 'badge-cyan'
                    }
                  >
                    {ev.category}
                  </span>
                  <span className="text-xs font-semibold text-white">{ev.actor}</span>
                </div>
                <p className="mt-1 text-xs text-steel-300">{ev.message}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-steel-500">
                {ev.timestamp}
              </span>
            </div>
          ))}
        </div>
      </StealthCard>
    </div>
  );
}
