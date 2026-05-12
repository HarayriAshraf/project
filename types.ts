export enum AppView {
  LOGIN,
  DASHBOARD,
  EXECUTIVE_DASHBOARD,
  FORECAST_SELECTION,
  FORECAST_REVIEW,
  FORECAST_CONFIRMATION,
  CLIENTS,
  SUPPLIERS,
  PRODUCTS,
  MRP,
  FORECASTER,
  CRM,
  ACTION_ITEMS,
  AUDIT_DASHBOARD,
  GAP_ANALYSIS,
  SCENARIO_PLANNING,
  NPI_PROMOTIONS,
  DETAILED_CHARTS,
  SUPPLY_REVIEW,
  PO_TRACKING,
  USER_MANAGEMENT,
  SUPPLIER_ANALYSIS,
}

export enum ForecastStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  ARCHIVED = 'Archived',
}

export enum RecordStatus {
  DRAFT = 'Draft',
  BOOKED = 'Booked',
  ACTIVE = 'Active',
  CANCELLED = 'Cancelled',
}

export enum POStatus {
  PENDING = 'Pending',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export enum CRMStage {
  CONTACTED = 'Contacted',
  MEETING = 'Meeting',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  CLOSED = 'Closed',
  REJECTED = 'Rejected',
}

export enum CRMVisitPurpose {
  POTENTIAL_CLIENT = 'Potential Client',
  FOLLOW_UP = 'Follow Up',
  PRICE_NEGOTIATION = 'Price Negotiation',
  COMPLAINT = 'Complaint',
  GENERAL_MEETING = 'General Meeting',
  DEMO = 'Demo',
}

export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role?: string;
  subsidiary?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  authorities: AppView[];
}

export interface BudgetRatio {
  salesPerMT: number;
  gpPerMT: number;
}

export interface BOMItem {
  productId: string;
  qty: number;
}

export interface ForecastRecord {
  id: string;
  section: string;
  client: string;
  country: string;
  product: string;
  category: string;
  month: number;
  year: number;
  version: string;
  qty: number;
  sales: number;
  gp: number;
  salesPerson: string;
  salesPersonEmail: string;
  status: string;
  workflowStatus: ForecastStatus;
  subsidiary: string;
  invoicingMonth?: number;
  invoicingYear?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  recordId: string;
  product: string;
  actionType: 'AMEND' | 'DELETE' | 'SUBMIT';
  reasonCode: string;
  details: string;
  client: string;
  subsidiary: string;
  section?: string;
  salesRep?: string;
  month: number;
  year: number;
  previousMonth?: number;
  previousYear?: number;
  previousQty: number;
  newQty: number;
  previousSales: number;
  newSales: number;
  previousGP: number;
  newGP: number;
}

export interface Client {
  id: string;
  name: string;
  country: string;
  salesRepName: string;
  salesRepEmail: string;
  subsidiary: string;
  section: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  hasBOM: boolean;
  bom?: BOMItem[];
  leadTimeWeeks: number;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  productId: string;
  quantity: number;
  orderDate: string;
  leadTimeWeeks: number;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: POStatus;
}

export interface CRMUpdate {
  id: string;
  date: string;
  stage: CRMStage;
  purpose: CRMVisitPurpose;
  notes: string;
  material?: string;
  clientPrice?: number;
  supplierPrice?: number;
  clientPaymentTerm?: string;
  supplierPaymentTerm?: string;
  supplierName?: string;
}

export interface CRMActivity {
  id: string;
  clientId: string;
  clientName: string;
  contactPerson: string;
  contactInfo: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  salesRepName: string;
  salesRepEmail: string;
  subsidiary?: string;
  clientSector?: string;
  country: string;
  date: string;
  timestamp: string;
  stage: CRMStage;
  purpose: CRMVisitPurpose;
  notes: string;
  leadSource: string;
  potentialValue: number;
  material?: string;
  clientPrice?: number;
  supplierPrice?: number;
  clientPaymentTerm?: string;
  supplierPaymentTerm?: string;
  supplierName?: string;
  updates: CRMUpdate[];
}

export interface ActionItemUpdate {
  id: string;
  date: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Changed' | 'Cancelled';
  notes: string;
  timestamp: string;
}

export interface ActionItem {
  id: number;
  title: string;
  description?: string;
  company?: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Changed' | 'Cancelled';
  date_opened: string;
  due_date: string;
  meeting_topic?: string;
  assignee_email: string;
  assignee_name: string;
  subsidiary?: string;
  notes?: string;
  updates?: ActionItemUpdate[];
}
