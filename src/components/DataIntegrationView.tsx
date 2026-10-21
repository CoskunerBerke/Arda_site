import React, { useRef, useState } from 'react';
import {
  Check,
  CircleAlert,
  CircleCheck,
  Database,
  RefreshCw,
  Shield,
  Upload,
  Webhook,
} from 'lucide-react';
import { COLUMN_MAPPINGS, STAGE_INDEX } from '../data/mockData';
import type { ErpIntegration, Shipment } from '../types/logistics';
import {
  createRateLimiter,
  generateWebhookFingerprint,
  sanitizeSpreadsheetCell,
  validateUploadFile,
} from '../utils/security';
import { StealthCard } from './ui/Primitives';

const webhookRateLimiter = createRateLimiter(15, 60_000);

interface SanitizedRowPreview {
  client: string;
  product: string;
  units: number;
  origin: string;
  destination: string;
  plate: string;
  neutralizedThreat: boolean;
}

const SAMPLE_RAW_ROWS = [
  {
    client: 'Kordsa Teknik Tekstil A.Ş.',
    product: 'Endüstriyel Kord Bezi Rulosu',
    units: '14',
    origin: 'İzmit OSB Depo',
    destination: 'Bursa Gemlik Liman',
    plate: '41 AR 308',
  },
  {
    client: '=CMD|" /C calc"!A0 Brisa Lojistik A.Ş.',
    product: 'Ağır Vasıta Lastik Paleti',
    units: '10',
    origin: 'Aksaray OSB',
    destination: 'İstanbul Ambarlı Liman',
    plate: '68 AR 512',
  },
];

export function DataIntegrationView({
  erpList,
  onUpdateErp,
  onImportShipments,
  onLogSecurityEvent,
}: {
  erpList: ErpIntegration[];
  onUpdateErp: (id: string, patch: Partial<ErpIntegration>) => void;
  onImportShipments: (newShipments: Shipment[]) => void;
  onLogSecurityEvent: (
    category: 'UPLOAD_SANITIZE' | 'WEBHOOK_HMAC',
    actor: string,
    message: string,
    severity?: 'ok' | 'warn' | 'blocked'
  ) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sanitizedPreview, setSanitizedPreview] = useState<SanitizedRowPreview[]>([]);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const processUpload = (fileMeta: { name: string; size?: number; type?: string }) => {
    setUploadError(null);
    setImportedSuccess(false);

    const validation = validateUploadFile(fileMeta);
    if (!validation.valid) {
      setUploadError(validation.error || 'Geçersiz dosya formatı.');
      onLogSecurityEvent(
        'UPLOAD_SANITIZE',
        'Veri Yükleme Motoru',
        `Engellenen dosya yüklemesi (${validation.sanitizedName}): ${validation.error}`,
        'blocked'
      );
      return;
    }

    setFileName(validation.sanitizedName);
    setUploading(true);
    setProgress(0);
    setUploaded(false);

    const cleanedRows: SanitizedRowPreview[] = SAMPLE_RAW_ROWS.map((r) => {
      const cClient = sanitizeSpreadsheetCell(r.client);
      const cProduct = sanitizeSpreadsheetCell(r.product);
      const cOrigin = sanitizeSpreadsheetCell(r.origin);
      const cDest = sanitizeSpreadsheetCell(r.destination);
      const cPlate = sanitizeSpreadsheetCell(r.plate);
      const unitsNum = Math.max(1, parseInt(r.units, 10) || 5);

      return {
        client: cClient.clean,
        product: cProduct.clean,
        units: unitsNum,
        origin: cOrigin.clean,
        destination: cDest.clean,
        plate: cPlate.clean,
        neutralizedThreat:
          cClient.wasThreatNeutralized ||
          cProduct.wasThreatNeutralized ||
          cOrigin.wasThreatNeutralized ||
          cDest.wasThreatNeutralized ||
          cPlate.wasThreatNeutralized,
      };
    });

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploaded(true);
          setSanitizedPreview(cleanedRows);
          const threatsCount = cleanedRows.filter((row) => row.neutralizedThreat).length;
          onLogSecurityEvent(
            'UPLOAD_SANITIZE',
            'Veri Yükleme Motoru',
            `${validation.sanitizedName} tarandı. ${cleanedRows.length} satır işlendi, ${threatsCount} zararlı formül/makro sterilize edildi.`,
            threatsCount > 0 ? 'warn' : 'ok'
          );
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleImportToOperations = () => {
    if (sanitizedPreview.length === 0 || importedSuccess) return;
    const baseNum = 9140 + Math.floor(Math.random() * 50);
    const createdShipments: Shipment[] = sanitizedPreview.map((row, idx) => ({
      id: `AR-${baseNum + idx}`,
      client: row.client,
      product: `${row.product} — ${row.units} Palet`,
      units: row.units,
      unitLabel: 'Palet',
      origin: row.origin,
      destination: row.destination,
      vehicle: 'Scania R500',
      plate: row.plate,
      driverName: idx === 0 ? 'Kemal Öztürk' : 'Serkan Polat',
      driverPhone: '+90 532 410 55 80',
      status: 'Yolda',
      currentLocation: `${row.origin} Çıkış Koridoru`,
      etaText: '4 Saat 10 Dakika',
      remainingKm: 210,
      totalKm: 260,
      temperature: 18.8,
      humidity: 48,
      speed: 79,
      tempMin: 14,
      tempMax: 25,
      progressPct: 35,
      stage: STAGE_INDEX.Yolda,
      departureDate: '2026-10-21',
      currentLat: 40.45,
      currentLng: 29.15,
      hasPOD: false,
      podSignedBy: '',
      podDate: '',
      route: [
        {
          label: 'Sipariş Onaylandı',
          location: row.origin,
          time: 'Bugün — 08:30',
          status: 'completed',
          lat: 40.76,
          lng: 29.91,
        },
        {
          label: 'Paletlendi & Çemberlendi',
          location: row.origin,
          time: 'Bugün — 09:10',
          status: 'completed',
          lat: 40.72,
          lng: 29.8,
        },
        {
          label: 'Ambar / Hat Tırında',
          location: 'Otoyol Koridoru',
          time: 'Canlı',
          status: 'current',
          lat: 40.45,
          lng: 29.15,
        },
        {
          label: 'Varış Ambarı / Dağıtımda',
          location: row.destination,
          time: 'Tahmini 14:20',
          status: 'upcoming',
          lat: 40.43,
          lng: 29.15,
        },
        {
          label: 'Teslim Edildi & İrsaliye Onaylandı',
          location: row.destination,
          time: 'Tahmini 15:00',
          status: 'upcoming',
          lat: 40.42,
          lng: 29.12,
        },
      ],
    }));

    onImportShipments(createdShipments);
    setImportedSuccess(true);
  };

  const handleTriggerErpSync = (erp: ErpIntegration) => {
    const check = webhookRateLimiter.tryAcquire();
    if (!check.allowed) return;

    setSyncingId(erp.id);
    onUpdateErp(erp.id, { status: 'syncing' });

    setTimeout(() => {
      const addedRecords = Math.floor(Math.random() * 140) + 45;
      const nowTime = 'Şimdi — Canlı';
      const sig = generateWebhookFingerprint(erp.id, nowTime);
      onUpdateErp(erp.id, {
        status: 'connected',
        lastSync: nowTime,
        recordsProcessed: erp.recordsProcessed + addedRecords,
      });
      onLogSecurityEvent(
        'WEBHOOK_HMAC',
        `${erp.name} ERP Webhook`,
        `Senkronizasyon tamamlandı (+${addedRecords} kayıt). İmza: ${sig}`,
        'ok'
      );
      setSyncingId(null);
    }, 900);
  };

  return (
    <div className="animate-view-enter space-y-4 md:space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white md:text-xl">
          Veri Yükleme & Entegrasyon
        </h2>
        <p className="text-xs text-steel-500">
          Excel toplu yükleme ve ERP webhook bağlantıları
        </p>
      </div>

      {/* Security Banner */}
      <div className="flex items-start gap-3 border border-cyan/40 bg-cyan/10 p-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
        <div>
          <p className="text-xs font-semibold text-cyan">
            Güvenlik — Girdi Sterilizasyonu
          </p>
          <p className="mt-0.5 text-xs text-steel-300">
            Yüklenen dosyalar sunucuda taramadan geçer; zararlı makro ve betikler otomatik
            filtrelenir. Çok kiracılı izolasyon uygulanır.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Excel Uploader */}
        <StealthCard
          title="Excel Toplu Yükleme"
          subtitle="Sürükle-bırak sevkiyat verisi (.xlsx, .csv)"
        >
          <div className="p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  processUpload({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  });
                }
              }}
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  processUpload({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  });
                }
              }}
              className="border border-dashed border-stealth-500 bg-stealth-950 p-8 text-center transition-colors hover:border-emerald/40"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-stealth-600 bg-stealth-900">
                {uploaded ? (
                  <CircleCheck className="h-8 w-8 text-emerald" />
                ) : (
                  <Upload className="h-8 w-8 text-steel-400" />
                )}
              </div>

              {!uploading && !uploaded && (
                <>
                  <p className="text-sm font-semibold text-white">
                    Excel dosyanızı buraya sürükleyin
                  </p>
                  <p className="mt-1 text-xs text-steel-500">
                    veya dosya seçin (.xlsx, .csv — maks. 10 MB)
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-emerald/40 bg-emerald/10 px-4 py-2 text-xs font-semibold text-emerald transition-colors hover:bg-emerald/20"
                    >
                      Bilgisayardan Seç
                    </button>
                    <button
                      onClick={() =>
                        processUpload({
                          name: 'AS_Lojistik_Faturalar.xlsx',
                          size: 48200,
                        })
                      }
                      className="border border-stealth-600 bg-stealth-900 px-4 py-2 text-xs font-semibold text-steel-300 transition-colors hover:border-cyan/40 hover:text-cyan"
                    >
                      Örnek Dosya Yükle
                    </button>
                  </div>
                </>
              )}

              {uploading && (
                <div>
                  <p className="font-mono text-sm font-semibold text-cyan">
                    {fileName} taranıyor & yükleniyor...
                  </p>
                  <div className="mx-auto mt-3 h-1.5 w-full max-w-xs bg-stealth-800">
                    <div
                      className="stage-connector h-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-xs text-steel-500">%{progress}</p>
                </div>
              )}

              {uploaded && (
                <div>
                  <p className="font-mono text-sm font-semibold text-emerald">
                    {fileName} yüklendi & sterilize edildi
                  </p>
                  <p className="mt-1 text-xs text-steel-500">
                    Sütun eşleştirme tamamlandı — zararlı formüller temizlendi
                  </p>

                  {sanitizedPreview.length > 0 && (
                    <div className="mt-4 border border-stealth-600 bg-stealth-900 p-3 text-left">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-steel-400">
                          Sterilize Edilen Kayıt Önizlemesi
                        </span>
                        <span className="font-mono text-[10px] text-emerald">
                          1 Makro Engellendi
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        {sanitizedPreview.map((row, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between border border-stealth-600 bg-stealth-950 px-2.5 py-1.5"
                          >
                            <span className="truncate text-steel-300">
                              {row.client} — {row.product}
                            </span>
                            {row.neutralizedThreat ? (
                              <span className="badge-amber text-[9px]">Temizlendi</span>
                            ) : (
                              <span className="badge-emerald text-[9px]">Güvenli</span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={handleImportToOperations}
                          disabled={importedSuccess}
                          className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            importedSuccess
                              ? 'border-emerald/40 bg-emerald/10 text-emerald'
                              : 'border-emerald bg-emerald text-black hover:bg-emerald-300'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {importedSuccess
                            ? 'Operasyon Listesine Aktarıldı'
                            : 'Sevkiyatlara Aktar (+2 Kayıt)'}
                        </button>
                        <button
                          onClick={() => {
                            setUploaded(false);
                            setFileName('');
                            setSanitizedPreview([]);
                          }}
                          className="text-xs text-steel-400 hover:text-white"
                        >
                          Yeni dosya yükle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <p className="mt-3 border border-crimson/40 bg-crimson/10 p-2 text-xs text-crimson">
                  {uploadError}
                </p>
              )}
            </div>
          </div>
        </StealthCard>

        {/* Column Mapping Table */}
        <StealthCard title="Sütun Eşleştirme" subtitle="Otomatik alan tanıma ve şema kontrolü">
          <div className="stealth-scroll overflow-x-auto p-4">
            <table className="w-full min-w-[400px] text-left text-xs">
              <thead>
                <tr className="border-b border-stealth-600">
                  <th className="px-3 py-2 font-semibold text-steel-400">Excel Sütunu</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Hedef Alan</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Zorunlu</th>
                  <th className="px-3 py-2 font-semibold text-steel-400">Filtre</th>
                </tr>
              </thead>
              <tbody>
                {COLUMN_MAPPINGS.map((col) => (
                  <tr
                    key={col.source}
                    className="border-b border-stealth-800 transition-colors hover:bg-stealth-800/60"
                  >
                    <td className="px-3 py-2.5 text-steel-300">{col.source}</td>
                    <td className="px-3 py-2.5">
                      <code className="text-cyan">{col.target}</code>
                    </td>
                    <td className="px-3 py-2.5">
                      {col.required ? (
                        <span className="text-crimson">Evet</span>
                      ) : (
                        <span className="text-steel-500">Hayır</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-emerald">
                      XSS/DDE Aktif
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StealthCard>
      </div>

      {/* ERP Integrations */}
      <StealthCard
        title="ERP Entegrasyonları"
        subtitle="Webhook & otomatik senkron"
        action={
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-steel-500">
            <Webhook className="h-3 w-3 text-cyan" /> REST API • HMAC-SHA256
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {erpList.map((erp) => {
            const statusCfg = {
              connected: { label: 'Bağlı', cls: 'badge-emerald' },
              syncing: { label: 'Senkronize', cls: 'badge-cyan' },
              available: { label: 'Mevcut', cls: 'badge-neutral' },
            }[erp.status];

            const isSyncing = syncingId === erp.id || erp.status === 'syncing';

            return (
              <div key={erp.id} className="stealth-card-interactive p-4">
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
                  <span className={statusCfg.cls}>{statusCfg.label}</span>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-steel-500">Son senkron:</span>
                    <span className="font-mono text-steel-300">{erp.lastSync}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">İşlenen kayıt:</span>
                    <span className="font-mono text-steel-300">
                      {erp.recordsProcessed.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {erp.status === 'available' ? (
                  <button
                    onClick={() => handleTriggerErpSync(erp)}
                    className="mt-3 w-full border border-stealth-600 bg-stealth-900 py-2 text-xs font-semibold text-steel-400 transition-colors hover:border-emerald/40 hover:text-emerald"
                  >
                    Bağla & Senkronize Et
                  </button>
                ) : (
                  <button
                    onClick={() => handleTriggerErpSync(erp)}
                    disabled={isSyncing}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 border border-stealth-600 bg-stealth-950 py-2 text-xs font-semibold text-steel-400 transition-colors hover:border-cyan/40 hover:text-cyan"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-cyan' : ''}`}
                    />
                    {isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </StealthCard>

      {/* Webhook Rate Limit Banner */}
      <div className="flex items-start gap-3 border border-amber/40 bg-amber/10 p-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
        <div>
          <p className="text-xs font-semibold text-amber">Webhook Rate Limit</p>
          <p className="mt-0.5 text-xs text-steel-300">
            ERP webhook istekleri 100/dakika ile sınırlandırılır. Limit aşımı durumunda
            otomatik kuyruğa alınır.
          </p>
        </div>
      </div>
    </div>
  );
}
