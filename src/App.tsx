import { useState } from 'react';
import { AdminView } from './components/AdminView';
import { DataIntegrationView } from './components/DataIntegrationView';
import { FinanceSalesView } from './components/FinanceSalesView';
import { OperationView } from './components/OperationView';
import { Sidebar } from './components/Sidebar';
import { UpgradeModal } from './components/UpgradeModal';
import type { NavSectionId, RoleType } from './types/logistics';
import { canAccessSection } from './utils/security';

export function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState<NavSectionId>('operation');
  const [role, setRole] = useState<RoleType>('seller');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleItemChange = (c: NavSectionId) => {
    if (c === 'upgrade') {
      setUpgradeOpen(true);
      return;
    }
    if (!canAccessSection(role, c)) {
      setActiveItem('operation');
      return;
    }
    setActiveItem(c);
  };

  const handleRoleChange = (c: RoleType) => {
    setRole(c);
    if (c === 'customer' || (c === 'seller' && activeItem === 'admin')) {
      setActiveItem('operation');
    }
  };

  const renderView = () => {
    if (activeItem === 'admin' && role === 'admin') {
      return <AdminView />;
    }
    if (activeItem === 'data') {
      return <DataIntegrationView />;
    }
    if (activeItem === 'finance' || activeItem === 'sales') {
      return <FinanceSalesView onTriggerUpgrade={() => setUpgradeOpen(true)} />;
    }
    return <OperationView />;
  };

  return (
    <div className="min-h-screen bg-stealth-950 text-steel-200">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        activeItem={activeItem}
        onItemChange={handleItemChange}
        role={role}
        onRoleChange={handleRoleChange}
      />
      <main
        className={`pt-16 transition-all duration-300 lg:pt-0 ${
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <div className="p-4 pb-8 md:p-6 lg:p-8">
          <div key={`${role}-${activeItem}`} className="animate-fade-in">
            {renderView()}
          </div>
        </div>
      </main>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentTier="basic"
      />
    </div>
  );
}

export default App;
