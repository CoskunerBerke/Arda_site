import {
  Activity,
  Building2,
  Clock,
  DollarSign,
  Eye,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { ADMIN_METRICS, INITIAL_COMPANIES } from '../data/mockData';
import { KpiCard, StatusBadge, StealthCard } from './ui/Primitives';

export function AdminView() {
  const e = ADMIN_METRICS;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-emerald" />
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">
            Super Admin Panel
          </h2>
          <p className="text-xs text-steel-500">
            Platform metrikleri, abonelikler ve ROI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="MRR"
          value={`₺${e.totalMRR.toLocaleString('tr-TR')}`}
          icon={DollarSign}
          accent="text-emerald"
          trend="+15%"
          trendUp={true}
        />
        <KpiCard
          label="SaaS Geliri (Yıllık)"
          value={`₺${(e.totalSaaSRevenue / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          accent="text-cyan"
          trend="+22%"
          trendUp={true}
        />
        <KpiCard
          label="Aktif Abonelik"
          value={`${e.activeSubscriptions}`}
          sub={`${e.totalCompanies} toplam`}
          icon={Users}
          accent="text-amber"
        />
        <KpiCard
          label="Toplam Sevkiyat"
          value={`${e.totalShipments}`}
          sub="Bu ay"
          icon={Activity}
          accent="text-steel-400"
        />
      </div>

      <StealthCard
        title="Platform ROI"
        subtitle="Bu ay tasarruf sağlanan süre ve işlenen sevkiyat değeri"
      >
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald" />
              <p className="text-xs font-semibold text-steel-400">
                Tasarruf Saati
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald">
              {e.hoursSaved}+ saat
            </p>
            <p className="text-[11px] text-steel-500">Operasyonel otomasyon</p>
          </div>

          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-cyan" />
              <p className="text-xs font-semibold text-steel-400">
                İşlenen Sevkiyat
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-cyan">
              ₺{(e.platformProcessedValue / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-[11px] text-steel-500">Platform üzerinden</p>
          </div>

          <div className="stealth-card p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber" />
              <p className="text-xs font-semibold text-steel-400">
                ROI Çarpanı
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber">
              {e.roiMultiplier}x
            </p>
            <p className="text-[11px] text-steel-500">Yatırım getirisi</p>
          </div>
        </div>
      </StealthCard>

      <StealthCard
        title="Aktif Abonelikler"
        subtitle={`${INITIAL_COMPANIES.length} şirket`}
        action={
          <span className="flex items-center gap-1.5 text-[10px] text-steel-500">
            <Eye className="h-3 w-3" /> Canlı
          </span>
        }
      >
        <div className="stealth-scroll overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-stealth-600">
                <th className="px-3 py-2 font-semibold text-steel-400">
                  Şirket
                </th>
                <th className="px-3 py-2 font-semibold text-steel-400">
                  Paket
                </th>
                <th className="px-3 py-2 font-semibold text-steel-400">MRR</th>
                <th className="px-3 py-2 font-semibold text-steel-400">
                  Hacim
                </th>
                <th className="px-3 py-2 font-semibold text-steel-400">
                  Bitiş
                </th>
                <th className="px-3 py-2 font-semibold text-steel-400">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_COMPANIES.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-stealth-800 hover:bg-stealth-800"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-steel-500" />
                      <span className="font-medium text-white">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        t.plan === 'Enterprise'
                          ? 'text-amber'
                          : t.plan === 'Pro'
                          ? 'text-emerald'
                          : 'text-steel-400'
                      }
                    >
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-steel-300">
                    ₺{t.mrr.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-3 py-2.5 text-steel-400">
                    {t.monthlyVolume}
                  </td>
                  <td className="px-3 py-2.5 text-steel-500">{t.expiration}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StealthCard>
    </div>
  );
}
