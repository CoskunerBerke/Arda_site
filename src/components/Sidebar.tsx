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
import type { NavSectionId, RoleType } from '../types/logistics';

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

const ROLES: { id: RoleType; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'seller', label: 'Satıcı' },
  { id: 'customer', label: 'Müşteri' },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeItem,
  onItemChange,
  role,
  onRoleChange,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeItem: NavSectionId;
  onItemChange: (item: NavSectionId) => void;
  role: RoleType;
  onRoleChange: (role: RoleType) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((d) => d.roles.includes(role));

  const renderNav = () => (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {visibleItems.map((d) => {
        const isActive = activeItem === d.id;
        const Icon = d.icon;
        return (
          <button
            key={d.id}
            onClick={() => {
              onItemChange(d.id);
              setMobileOpen(false);
            }}
            className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-emerald bg-emerald/10 text-emerald'
                : 'border-transparent text-steel-400 hover:bg-stealth-800 hover:text-white'
            } ${collapsed ? 'justify-center lg:justify-center' : ''}`}
            title={collapsed ? d.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{d.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  const renderRoles = () => (
    <div
      className={`border-t border-stealth-600 px-3 py-4 ${
        collapsed ? 'hidden lg:block' : ''
      }`}
    >
      {!collapsed && (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-steel-600">
          Rol
        </p>
      )}
      <div
        className={
          collapsed
            ? 'hidden lg:flex lg:justify-center lg:flex-col'
            : 'flex flex-col gap-1'
        }
      >
        {ROLES.map((d) => (
          <button
            key={d.id}
            onClick={() => onRoleChange(d.id)}
            className={`px-3 py-2 text-left text-xs font-medium transition-colors ${
              role === d.id ? 'text-cyan' : 'text-steel-500 hover:text-white'
            }`}
          >
            {collapsed ? d.label[0] : d.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderHeader = () => (
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
          className="ml-auto hidden h-8 w-8 items-center justify-center border border-stealth-600 text-steel-500 hover:text-white lg:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`fixed left-0 top-0 z-30 hidden h-full border-r border-stealth-600 bg-stealth-950 transition-all duration-300 lg:block ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderHeader()}
        {renderNav()}
        {renderRoles()}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center border border-stealth-600 bg-stealth-900 text-steel-500 hover:text-white lg:flex"
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </button>
        )}
      </div>

      <div className="fixed left-0 top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stealth-600 bg-stealth-950 px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center border border-emerald/40 bg-emerald/10">
            <Shield className="h-5 w-5 text-emerald" />
          </div>
          <p className="text-sm font-bold text-white">AS LOJİSTİK</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center border border-stealth-600 text-steel-400"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-slide-in-left absolute left-0 top-0 h-full w-72 border-r border-stealth-600 bg-stealth-950">
            <div className="flex h-16 items-center justify-between border-b border-stealth-600 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center border border-emerald/40 bg-emerald/10">
                  <Shield className="h-5 w-5 text-emerald" />
                </div>
                <p className="text-sm font-bold text-white">AS LOJİSTİK</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center border border-stealth-600 text-steel-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav()}
            {renderRoles()}
          </div>
        </div>
      )}
    </>
  );
}
