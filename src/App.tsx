import React, { useState } from 'react';
import { Crown, Lock, Shield, Zap } from 'lucide-react';
import { AdminView } from './components/AdminView';
import { DataIntegrationView } from './components/DataIntegrationView';
import { FinanceSalesView } from './components/FinanceSalesView';
import { OperationView } from './components/OperationView';
import { Sidebar } from './components/Sidebar';
import { UpgradeModal } from './components/UpgradeModal';
import { SlideDrawer } from './components/ui/Primitives';
import {
  INITIAL_COMPANIES,
  INITIAL_ERP_LIST,
  INITIAL_INVENTORY,
  INITIAL_SECURITY_EVENTS,
  INITIAL_SHIPMENTS,
  INITIAL_SMS_LOGS,
} from './data/mockData';
import type {
  CompanySubscription,
  ErpIntegration,
  InventoryItem,
  NavSectionId,
  RoleType,
  SecurityAuditEvent,
  Shipment,
  SmsLogItem,
  TierId,
} from './types/logistics';
import { canAccessSection } from './utils/security';

const SECTION_TITLES: Record<NavSectionId, string> = {
  operation: 'Operasyon Merkezi',
  data: 'Veri Yükleme & ERP',
  finance: 'Finans Analitiği',
  sales: 'Satış & Stok Envanteri',
  upgrade: 'Paketler',
  admin: 'Super Admin Panel',
};

const ROLE_NAMES: Record<RoleType, string> = {
  admin: 'Admin',
  seller: 'Satıcı',
  customer: 'Müşteri',
};

export function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState<NavSectionId>('operation');
  const [role, setRole] = useState<RoleType>('seller');
  const [currentTier, setCurrentTier] = useState<TierId>('basic');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [securityDrawerOpen, setSecurityDrawerOpen] = useState(false);

  // Interactive Platform State
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>(INITIAL_SMS_LOGS);
  const [erpList, setErpList] = useState<ErpIntegration[]>(INITIAL_ERP_LIST);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [companies, setCompanies] = useState<CompanySubscription[]>(INITIAL_COMPANIES);
  const [securityEvents, setSecurityEvents] = useState<SecurityAuditEvent[]>(
    INITIAL_SECURITY_EVENTS
  );

  const appendSecurityEvent = (
    category: SecurityAuditEvent['category'],
    actor: string,
    message: string,
    severity: SecurityAuditEvent['severity'] = 'ok'
  ) => {
    setSecurityEvents((prev) => [
      {
        id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Şimdi — Canlı',
        category,
        actor,
        message,
        severity,
      },
      ...prev,
    ]);
  };

  const handleNavChange = (item: NavSectionId) => {
    if (item === 'upgrade') {
      setUpgradeOpen(true);
      return;
    }
    if (!canAccessSection(role, item)) {
      appendSecurityEvent(
        'RBAC',
        `Rol: ${ROLE_NAMES[role]}`,
        `Yetkisiz bölüm erişim isteği (${item}) engellendi ve Operasyon ekranına yönlendirildi.`,
        'blocked'
      );
      setActiveItem('operation');
      return;
    }
    setActiveItem(item);
  };

  const handleRoleChange = (nextRole: RoleType) => {
    setRole(nextRole);
    appendSecurityEvent(
      'RBAC',
      'Oturum Yöneticisi',
      `Aktif çalışma rolü "${ROLE_NAMES[nextRole]}" olarak güncellendi. Yetki matrisi uygulandı.`,
      'ok'
    );
    if (!canAccessSection(nextRole, activeItem)) {
      setActiveItem('operation');
    }
  };

  const handleAddShipment = (newShipment: Shipment) => {
    setShipments((prev) => [newShipment, ...prev]);
  };

  const handleImportShipments = (imported: Shipment[]) => {
    setShipments((prev) => [...imported, ...prev]);
  };

  const handleSendSms = (newItems: SmsLogItem[]) => {
    setSmsLogs((prev) => [...newItems, ...prev]);
    appendSecurityEvent(
      'SMS_DISPATCH',
      `Operasyon (${newItems[0]?.shipmentId || 'Sevkiyat'})`,
      `${newItems.length} adet SMS bildirimi XSS filtresinden geçirilerek iletildi.`,
      'ok'
    );
  };

  const handleUpdateErp = (id: string, patch: Partial<ErpIntegration>) => {
    setErpList((prev) =>
      prev.map((erp) => (erp.id === id ? { ...erp, ...patch } : erp))
    );
  };

  const handleRestockItem = (id: string, addedQty: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStock = item.stock + addedQty;
        const nextStatus: InventoryItem['status'] =
          nextStock <= item.reorderLevel * 0.5
            ? 'critical'
            : nextStock <= item.reorderLevel
            ? 'low'
            : 'in-stock';
        return {
          ...item,
          stock: nextStock,
          status: nextStatus,
        };
      })
    );
  };

  const handleRenewCompany = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const restoredMrr =
          c.plan === 'Enterprise' ? 18000 : c.plan === 'Pro' ? 7500 : 3500;
        return {
          ...c,
          status: 'active',
          mrr: restoredMrr,
          expiration: '2027-10-21',
        };
      })
    );
  };

  const renderMainView = () => {
    if (activeItem === 'admin' && role === 'admin') {
      return (
        <AdminView
          companies={companies}
          onRenewCompany={handleRenewCompany}
          securityEvents={securityEvents}
        />
      );
    }
    if (activeItem === 'data' && canAccessSection(role, 'data')) {
      return (
        <DataIntegrationView
          erpList={erpList}
          onUpdateErp={handleUpdateErp}
          onImportShipments={handleImportShipments}
          onLogSecurityEvent={appendSecurityEvent}
        />
      );
    }
    if (
      (activeItem === 'finance' || activeItem === 'sales') &&
      canAccessSection(role, activeItem)
    ) {
      return (
        <FinanceSalesView
          mode={activeItem}
          currentTier={currentTier}
          inventory={inventory}
          onRestockItem={handleRestockItem}
          onTriggerUpgrade={() => setUpgradeOpen(true)}
        />
      );
    }
    return (
      <OperationView
        shipments={shipments}
        onAddShipment={handleAddShipment}
        smsLogs={smsLogs}
        onSendSms={handleSendSms}
        role={role}
      />
    );
  };

  return (
    <div className="min-h-screen bg-stealth-950 text-steel-200">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        activeItem={activeItem}
        onItemChange={handleNavChange}
        role={role}
        onRoleChange={handleRoleChange}
        currentTier={currentTier}
        onOpenSecurityLog={() => setSecurityDrawerOpen(true)}
      />

      <main
        className={`pt-16 transition-all duration-300 lg:pt-0 ${
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Desktop Top Status & Security Bar */}
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-stealth-600 bg-stealth-950/90 px-8 backdrop-blur-md lg:flex">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-steel-500">AS LOJİSTİK</span>
            <span className="text-stealth-500">/</span>
            <span className="text-xs font-bold text-white">
              {SECTION_TITLES[activeItem]}
            </span>
            <span className="badge-cyan text-[10px]">Rol: {ROLE_NAMES[role]}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSecurityDrawerOpen(true)}
              className="flex items-center gap-2 border border-stealth-600 bg-stealth-900 px-3 py-1.5 text-xs text-steel-300 transition-colors hover:border-emerald/40 hover:text-white"
            >
              <Shield className="h-3.5 w-3.5 text-emerald" />
              <span>Güvenlik:</span>
              <span className="font-mono text-[11px] font-semibold text-emerald">
                CSP + Sterilizasyon Aktif
              </span>
            </button>

            <button
              onClick={() => setUpgradeOpen(true)}
              className="flex items-center gap-1.5 border border-emerald/40 bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald transition-colors hover:bg-emerald/20"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>
                {currentTier === 'enterprise'
                  ? 'Enterprise VIP'
                  : currentTier === 'pro'
                  ? 'Pro Otomasyon'
                  : 'Paket Yükselt'}
              </span>
            </button>
          </div>
        </header>

        <div className="p-4 pb-8 md:p-6 lg:p-8">
          <div key={`${role}-${activeItem}`} className="animate-view-enter">
            {renderMainView()}
          </div>
        </div>
      </main>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentTier={currentTier}
        onSelectTier={(tier) => {
          setCurrentTier(tier);
          appendSecurityEvent(
            'RBAC',
            'Abonelik Motoru',
            `Platform altyapı paketi "${tier.toUpperCase()}" seviyesine yükseltildi.`,
            'ok'
          );
        }}
      />

      {/* Security & Architecture SlideDrawer */}
      <SlideDrawer
        open={securityDrawerOpen}
        onClose={() => setSecurityDrawerOpen(false)}
        title="Güvenlik Mimari Kalkanı"
        subtitle="Sıfır Güvenlik Açığı (Zero-Trust B2B Koruma Katmanı)"
      >
        <div className="space-y-4 text-xs">
          <div className="border border-emerald/40 bg-emerald/10 p-3.5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald" />
              <p className="font-bold text-emerald">
                Tüm Güvenlik Kontrolleri Doğrulandı
              </p>
            </div>
            <p className="mt-1 text-steel-300">
              Üçüncü parti izleme betikleri (bolt.new badge vb.) kaldırıldı. Katı
              Content-Security-Policy (CSP) ve girdi sterilizasyonu devrede.
            </p>
          </div>

          <div className="space-y-2">
            <div className="border border-stealth-600 bg-stealth-900 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  1. Content-Security-Policy (CSP) & Başlıklar
                </span>
                <span className="font-mono text-[10px] text-emerald">AKTİF</span>
              </div>
              <p className="mt-1 text-steel-400">
                X-Frame-Options: DENY, X-Content-Type-Options: nosniff ve strict CSP
                kuralları ile clickjacking ve XSS sızıntıları engellenir.
              </p>
            </div>

            <div className="border border-stealth-600 bg-stealth-900 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  2. CSV / Excel Formül Enjeksiyonu Koruması
                </span>
                <span className="font-mono text-[10px] text-emerald">AKTİF</span>
              </div>
              <p className="mt-1 text-steel-400">
                Yüklenen tablolardaki <code>=</code>, <code>+</code>, <code>-</code>,{' '}
                <code>@</code> ile başlayan DDE/Makro komutları otomatik temizlenir.
              </p>
            </div>

            <div className="border border-stealth-600 bg-stealth-900 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  3. RBAC & Rate-Limiter Koruması
                </span>
                <span className="font-mono text-[10px] text-emerald">AKTİF</span>
              </div>
              <p className="mt-1 text-steel-400">
                Rol bazlı erişim kontrolü (Admin, Satıcı, Müşteri) ve SMS / Webhook
                isteklerinde kayan pencere hız sınırlaması uygulanır.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-steel-500">
              <Lock className="h-3 w-3 text-cyan" /> Canlı Güvenlik Denetim Günlüğü
            </p>
            <div className="space-y-2">
              {securityEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="border border-stealth-600 bg-stealth-950 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-cyan">
                      {ev.category}
                    </span>
                    <span className="font-mono text-[10px] text-steel-500">
                      {ev.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-steel-300">{ev.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SlideDrawer>
    </div>
  );
}

export default App;
