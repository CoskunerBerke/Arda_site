import React, { useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  Database,
  Shield,
  Upload,
  Webhook,
} from 'lucide-react';
import { COLUMN_MAPPINGS, INITIAL_ERP_LIST } from '../data/mockData';
import type { ErpIntegration } from '../types/logistics';
import { validateUploadFile } from '../utils/security';
import { StealthCard } from './ui/Primitives';

function ExcelDropzone() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState('');

  const startUpload = (name: string, size?: number) => {
    const check = validateUploadFile({ name, size });
    if (!check.valid) return;
    setFileName(check.sanitizedName);
    setUploading(true);
    setProgress(0);
    setDone(false);
    const interval = setInterval(() => {
      setProgress((c) => {
        if (c >= 100) {
          clearInterval(interval);
          setUploading(false);
          setDone(true);
          return 100;
        }
        return c + 10;
      });
    }, 200);
  };

  return (
    <div
      onDragOver={(u) => u.preventDefault()}
      onDrop={(u) => {
        u.preventDefault();
        const f = u.dataTransfer.files?.[0];
        if (f) startUpload(f.name, f.size);
      }}
      className="border border-dashed border-stealth-500 bg-stealth-950 p-8 text-center transition-colors hover:border-emerald/40"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-stealth-600 bg-stealth-900">
        {done ? (
          <CircleCheck className="h-8 w-8 text-emerald" />
        ) : (
          <Upload className="h-8 w-8 text-steel-400" />
        )}
      </div>

      {!uploading && !done && (
        <>
          <p className="text-sm font-semibold text-white">
            Excel dosyanızı buraya sürükleyin
          </p>
          <p className="mt-1 text-xs text-steel-500">
            veya dosya seçin (.xlsx, .csv)
          </p>
          <button
            onClick={() => startUpload('AS_Lojistik_Faturalar.xlsx', 42000)}
            className="mt-4 border border-emerald/40 bg-emerald/10 px-4 py-2 text-xs font-semibold text-emerald transition-colors hover:bg-emerald/20"
          >
            Dosya Seç
          </button>
        </>
      )}

      {uploading && (
        <div>
          <p className="text-sm font-semibold text-cyan">
            {fileName} yükleniyor...
          </p>
          <div className="mx-auto mt-3 h-1.5 w-full max-w-xs bg-stealth-800">
            <div
              className="stage-connector h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-steel-500">%{progress}</p>
        </div>
      )}

      {done && (
        <div>
          <p className="text-sm font-semibold text-emerald">{fileName} yüklendi</p>
          <p className="mt-1 text-xs text-steel-500">
            Sütun eşleştirme tamamlandı — veri işlendi
          </p>
          <button
            onClick={() => {
              setDone(false);
              setFileName('');
            }}
            className="mt-3 text-xs text-steel-400 hover:text-white"
          >
            Yeni dosya yükle
          </button>
        </div>
      )}
    </div>
  );
}

function ErpCard({ erp }: { erp: ErpIntegration }) {
  const badge = {
    connected: { label: 'Bağlı', cls: 'badge-emerald' },
    syncing: { label: 'Senkronize', cls: 'badge-cyan' },
    available: { label: 'Mevcut', cls: 'badge-neutral' },
  }[erp.status];

  return (
    <div className="stealth-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center border border-stealth-600 bg-stealth-950">
            <Database className="h-5 w-5 text-steel-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{erp.name}</p>
            <p className="text-[10px] text-steel-500">ERP Entegrasyonu</p>
          </div>
        </div>
        <span className={badge.cls}>{badge.label}</span>
      </div>
      <div className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-steel-500">Son senkron:</span>
          <span className="text-steel-300">{erp.lastSync}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-steel-500">İşlenen kayıt:</span>
          <span className="text-steel-300">
            {erp.recordsProcessed.toLocaleString('tr-TR')}
          </span>
        </div>
      </div>
      {erp.status === 'available' && (
        <button className="mt-3 w-full border border-stealth-600 bg-stealth-900 py-2 text-xs font-semibold text-steel-400 transition-colors hover:border-emerald/40 hover:text-emerald">
          Bağla
        </button>
      )}
    </div>
  );
}

export function DataIntegrationView() {
  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white md:text-xl">
          Veri Yükleme & Entegrasyon
        </h2>
        <p className="text-xs text-steel-500">
          Excel toplu yükleme ve ERP webhook bağlantıları
        </p>
      </div>

      <div className="flex items-start gap-3 border border-cyan/40 bg-cyan/10 p-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
        <div>
          <p className="text-xs font-semibold text-cyan">
            Güvenlik — Girdi Sterilizasyonu
          </p>
          <p className="mt-0.5 text-xs text-steel-300">
            Yüklenen dosyalar sunucuda taramadan geçer; zararlı makro ve betikler
            otomatik filtrelenir. Çok kiracılı izolasyon uygulanır.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StealthCard
          title="Excel Toplu Yükleme"
          subtitle="Sürükle-bırak sevkiyat verisi"
        >
          <div className="p-4">
            <ExcelDropzone />
          </div>
        </StealthCard>

        <StealthCard title="Sütun Eşleştirme" subtitle="Otomatik alan tanıma">
          <div className="stealth-scroll overflow-x-auto p-4">
            <table className="w-full min-w-[400px] text-left text-xs">
              <thead>
                <tr className="border-b border-stealth-600">
                  <th className="px-3 py-2 font-semibold text-steel-400">
                    Excel Sütunu
                  </th>
                  <th className="px-3 py-2 font-semibold text-steel-400">
                    Hedef Alan
                  </th>
                  <th className="px-3 py-2 font-semibold text-steel-400">
                    Zorunlu
                  </th>
                </tr>
              </thead>
              <tbody>
                {COLUMN_MAPPINGS.map((e) => (
                  <tr key={e.source} className="border-b border-stealth-800">
                    <td className="px-3 py-2.5 text-steel-300">{e.source}</td>
                    <td className="px-3 py-2.5">
                      <code className="text-cyan">{e.target}</code>
                    </td>
                    <td className="px-3 py-2.5">
                      {e.required ? (
                        <span className="text-crimson">Evet</span>
                      ) : (
                        <span className="text-steel-500">Hayır</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StealthCard>
      </div>

      <StealthCard
        title="ERP Entegrasyonları"
        subtitle="Webhook & otomatik senkron"
        action={
          <span className="flex items-center gap-1.5 text-[10px] text-steel-500">
            <Webhook className="h-3 w-3" /> REST API
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {INITIAL_ERP_LIST.map((e) => (
            <ErpCard key={e.id} erp={e} />
          ))}
        </div>
      </StealthCard>

      <div className="flex items-start gap-3 border border-amber/40 bg-amber/10 p-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
        <div>
          <p className="text-xs font-semibold text-amber">Webhook Rate Limit</p>
          <p className="mt-0.5 text-xs text-steel-300">
            ERP webhook istekleri 100/dakika ile sınırlandırılır. Limit aşımı
            durumunda otomatik kuyruğa alınır.
          </p>
        </div>
      </div>
    </div>
  );
}
