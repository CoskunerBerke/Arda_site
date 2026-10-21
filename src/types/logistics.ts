export type RoleType = 'admin' | 'seller' | 'customer';

export type NavSectionId =
  | 'operation'
  | 'data'
  | 'finance'
  | 'sales'
  | 'upgrade'
  | 'admin';

export type TierId = 'basic' | 'pro' | 'enterprise';

export type ShipmentStatus =
  | 'Yolda'
  | 'Gecikti'
  | 'Teslim Edildi'
  | 'Yükleme'
  | 'Hazırlanıyor';

export type RouteStepStatus = 'completed' | 'current' | 'upcoming';

export interface RouteStop {
  label: string;
  location: string;
  time: string;
  status: RouteStepStatus;
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  client: string;
  product: string;
  units: number;
  unitLabel: string;
  origin: string;
  destination: string;
  vehicle: string;
  plate: string;
  driverName: string;
  driverPhone: string;
  status: ShipmentStatus;
  currentLocation: string;
  etaText: string;
  remainingKm: number;
  totalKm: number;
  temperature: number;
  humidity: number;
  speed: number;
  tempMin: number;
  tempMax: number;
  progressPct: number;
  stage: number;
  departureDate: string;
  currentLat: number;
  currentLng: number;
  hasPOD: boolean;
  podSignedBy: string;
  podDate: string;
  exceptionAlert?: string;
  route: RouteStop[];
}

export interface WeeklyFinancial {
  week: string;
  weekNum: number;
  revenue: number;
  freight: number;
  packaging: number;
  cogs: number;
  netProfit: number;
  margin: number;
  targetHours: number;
  actualHours: number;
  shipmentCount: number;
}

export interface WeeklyShipmentBreakdown {
  id: string;
  client: string;
  product: string;
  sellPrice: number;
  buyPrice: number;
  freight: number;
  packaging: number;
  netProfit: number;
  deliveryTime: string;
  deliveredAt: string;
  margin: number;
}

export interface CompanySubscription {
  id: string;
  name: string;
  plan: 'Enterprise' | 'Pro' | 'Basic';
  subscriptionDate: string;
  expiration: string;
  status: 'active' | 'expiring' | 'inactive';
  monthlyVolume: number;
  contact: string;
  mrr: number;
}

export interface CustomerRevenueSlice {
  name: string;
  revenue: number;
  color: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
  status: 'in-stock' | 'low' | 'critical';
  location: string;
}

export interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

export interface ErpIntegration {
  id: string;
  name: string;
  status: 'connected' | 'syncing' | 'available';
  lastSync: string;
  recordsProcessed: number;
}

export interface PricingTier {
  id: TierId;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  locked: string[];
  popular: boolean;
}

export interface SmsLogItem {
  id: string;
  shipmentId: string;
  recipient: 'driver' | 'customer';
  phone: string;
  message: string;
  timestamp: string;
  status: 'delivered' | 'read' | 'sent';
}

export interface ColumnMapping {
  source: string;
  target: string;
  required: boolean;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  category: 'RBAC' | 'UPLOAD_SANITIZE' | 'WEBHOOK_HMAC' | 'SMS_DISPATCH' | 'CSP_SHIELD';
  actor: string;
  message: string;
  severity: 'ok' | 'warn' | 'blocked';
}
