import React, { useState } from 'react';
import {
  ChevronLeft,
  Crown,
  DollarSign,
  LayoutGrid,
  Menu,
  Package,
  Shield,
  Upload,
  X,
} from 'lucide-react';
import type { NavSectionId, RoleType, TierId } from '../types/logistics';

interface NavItemConfig {
  id: NavSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: RoleType[];
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'operation',
    label: 'Operasyon',
    icon: LayoutGrid,
    roles: ['admin', 'seller', 'customer'],
  },
  {
    id: 'data',
    label: 'Veri Yükleme',
    icon: Upload,
    roles: ['admin', 'seller'],
  },
  {
    id: 'finance',
    label: 'Finans',
    icon: DollarSign,
    roles: ['admin', 'seller'],
  },
  {
    id: 'sales',
    label: 'Satış / Stok',
    icon: Package,
    roles: ['admin', 'seller'],
  },
  {
    id: 'upgrade',
    label: 'Paketler',
    icon: Crown,
    roles: ['admin', 'seller', 'customer'],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    roles: ['admin'],
  },
];

const ROLES: { id: RoleType; label: string; desc: string }[] = [
  { id: 'admin', label: 'Admin', desc: 'Tam Yetki' },
  { id: 'seller', label: 'Satıcı', desc: 'Lojistik & Finans' },
  { id: 'customer', label: 'Müşteri', desc: 'Canlı Takip' },
];

const TIER_LABELS: Record<TierId, { name: string; cls: string }> = {
  basic: { name: 'Standart KOBİ', cls: 'border-cyan/40 text-cyan bg-cyan/10' },
  pro: { name: 'Pro Otomasyon', cls: 'border-emerald/40 text-emerald bg-emerald/10' },
  enterprise: { name: 'Enterprise VIP', cls: 'border-amber/40 text-amber bg-amber/10' },
};

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeItem,
  onItemChange,
  role,
  onRoleChange,
  currentTier,
  onOpenSecurityLog,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeItem: NavSectionId;
  onItemChange: (item: NavSectionId) => void;
  role: RoleType;
  onRoleChange: (role: RoleType) => void;
  currentTier: TierId;
  onOpenSecurityLog: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const tierInfo = TIER_LABELS[currentTier];

  const renderNavLinks = () => (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {visibleNavItems.map((item) => {
        const isActive = activeItem === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              onItemChange(item.id);
              setMobileOpen(false);
            }}
            title={collapsed ? item.label : undefined}
            className={`group flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'border-emerald bg-emerald/10 text-emerald'
                : 'border-transparent text-steel-400 hover:bg-stealth-800 hover:text-white'
            } ${collapsed ? 'justify-center lg:justify-center' : ''}`}
          >
            <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  const renderRoleSelector = () => (
    <div
      className={`border-t border-stealth-600 px-3 py-4 ${
        collapsed ? 'hidden lg:block' : ''
      }`}
    >
      {!collapsed && (
        <div className="mb-2 flex items-center justify-between px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-steel-600">
            Rol & Erişim
          </p>
          <span className="font-mono text-[9px] text-emerald">RBAC Aktif</span>
        </div>
      )}
      <div
        className={
          collapsed
            ? 'hidden lg:flex lg:flex-col lg:justify-center'
            : 'flex flex-col gap-1'
        }
      >
        {ROLES.map((r) => {
          const isSelected = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onRoleChange(r.id)}
              title={collapsed ? `${r.label} (${r.desc})` : undefined}
              className={`flex items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-stealth-900 text-cyan'
                  : 'text-steel-500 hover:bg-stealth-900/60 hover:text-white'
              }`}
            >
              <span>{collapsed ? r.label[0] : r.label}</span>
              {!collapsed && (
                <span
                  className={`text-[10px] ${
                    isSelected ? 'text-cyan/80' : 'text-steel-600'
                  }`}
                >
                  {r.desc}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!collapsed && (
        <div className="mt-4 space-y-2 border-t border-stealth-800 px-2 pt-3">
          <button
            onClick={() => onItemChange('upgrade')}
            className={`flex w-full items-center justify-between border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${tierInfo.cls}`}
          >
            <span className="flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              {tierInfo.name}
            </span>
            <span className="font-mono text-[10px] opacity-80">Yükselt →</span>
          </button>

          <button
            onClick={() => {
              onOpenSecurityLog();
              setMobileOpen(false);
            }}
            className="flex w-full items-center justify-between border border-stealth-600 bg-stealth-900 px-2.5 py-1.5 text-[10px] text-steel-400 transition-colors hover:border-emerald/40 hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-emerald animate-pulse" />
              Güvenlik Kalkanı
            </span>
            <span className="font-mono text-emerald">AKTİF</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderBrandHeader = () => (
    <div className="flex h-16 items-center border-b border-stealth-600 px-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald/40 bg-emerald/10">
          <Shield className="h-5 w-5 text-emerald" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">AS LOJİSTİK</p>
            <p className="truncate text-[10px] text-steel-600">B2B Procurement</p>
          </div>
        )}
      </div>
      {!collapsed && (
        <button
          onClick={onToggleCollapse}
          aria-label="Menüyü Daralt"
          className="ml-auto hidden h-8 w-8 items-center justify-center border border-stealth-600 text-steel-500 transition-colors hover:border-stealth-500 hover:text-white lg:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-full border-r border-stealth-600 bg-stealth-950 transition-all duration-300 lg:flex lg:flex-col lg:justify-between ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div>
          {renderBrandHeader()}
          {renderNavLinks()}
        </div>
        {renderRoleSelector()}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Menüyü Genişlet"
            className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center border border-stealth-600 bg-stealth-900 text-steel-500 transition-colors hover:text-white lg:flex"
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </button>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stealth-600 bg-stealth-950/95 px-4 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center border border-emerald/40 bg-emerald/10">
            <Shield className="h-5 w-5 text-emerald" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">AS LOJİSTİK</p>
            <p className="text-[10px] text-steel-500">B2B Procurement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`border px-2 py-0.5 text-[10px] font-semibold ${tierInfo.cls}`}>
            {tierInfo.name}
          </span>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menüyü Aç"
            className="flex h-9 w-9 items-center justify-center border border-stealth-600 text-steel-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-slide-in-left absolute left-0 top-0 flex h-full w-72 flex-col justify-between border-r border-stealth-600 bg-stealth-950">
            <div>
              <div className="flex h-16 items-center justify-between border-b border-stealth-600 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center border border-emerald/40 bg-emerald/10">
                    <Shield className="h-5 w-5 text-emerald" />
                  </div>
                  <p className="text-sm font-bold text-white">AS LOJİSTİK</p>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Menüyü Kapat"
                  className="flex h-9 w-9 items-center justify-center border border-stealth-600 text-steel-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderNavLinks()}
            </div>
            {renderRoleSelector()}
          </div>
        </div>
      )}
    </>
  );
}
