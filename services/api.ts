import {
  ForecastRecord,
  AuditLog,
  Client,
  Product,
  Supplier,
  PurchaseOrder,
  CRMActivity,
  ActionItem,
  User,
  Permission,
} from '../types';

const BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL)
  ? (import.meta as any).env.VITE_API_BASE_URL
  : 'http://localhost:8000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// Forecast Records
export const getForecastRecords = () =>
  request<ForecastRecord[]>('/forecasts');

export const updateForecastRecord = (id: string, record: ForecastRecord) =>
  request<ForecastRecord>(`/forecasts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  });

export const deleteForecastRecord = (id: string) =>
  request<void>(`/forecasts/${id}`, { method: 'DELETE' });

export const saveForecastBatch = (records: ForecastRecord[]) =>
  request<ForecastRecord[]>('/forecasts/batch', {
    method: 'POST',
    body: JSON.stringify(records),
  });

// Audit Logs
export const getAuditLogs = () =>
  request<AuditLog[]>('/audit-logs');

export const createAuditLog = (log: AuditLog) =>
  request<AuditLog>('/audit-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  });

export const saveAuditLogBatch = (logs: AuditLog[]) =>
  request<AuditLog[]>('/audit-logs/batch', {
    method: 'POST',
    body: JSON.stringify(logs),
  });

// Clients
export const getClients = () =>
  request<Client[]>('/clients');

export const createClient = (client: Client) =>
  request<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });

export const updateClient = (id: string, client: Client) =>
  request<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  });

export const deleteClient = (id: string) =>
  request<void>(`/clients/${id}`, { method: 'DELETE' });

// Products
export const getProducts = () =>
  request<Product[]>('/products');

export const createProduct = (product: Product) =>
  request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });

export const updateProduct = (id: string, product: Product) =>
  request<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });

export const deleteProduct = (id: string) =>
  request<void>(`/products/${id}`, { method: 'DELETE' });

// Suppliers
export const getSuppliers = () =>
  request<Supplier[]>('/suppliers');

export const createSupplier = (supplier: Supplier) =>
  request<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });

export const updateSupplier = (id: string, supplier: Supplier) =>
  request<Supplier>(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplier),
  });

export const deleteSupplier = (id: string) =>
  request<void>(`/suppliers/${id}`, { method: 'DELETE' });

// Purchase Orders
export const getPurchaseOrders = () =>
  request<PurchaseOrder[]>('/purchase-orders');

export const createPurchaseOrder = (po: PurchaseOrder) =>
  request<PurchaseOrder>('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(po),
  });

export const updatePurchaseOrder = (id: string, po: PurchaseOrder) =>
  request<PurchaseOrder>(`/purchase-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(po),
  });

export const deletePurchaseOrder = (id: string) =>
  request<void>(`/purchase-orders/${id}`, { method: 'DELETE' });

// CRM Activities
export const getCrmActivities = () =>
  request<CRMActivity[]>('/crm-activities');

export const createCrmActivity = (activity: CRMActivity) =>
  request<CRMActivity>('/crm-activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });

export const updateCrmActivity = (id: string, activity: CRMActivity) =>
  request<CRMActivity>(`/crm-activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activity),
  });

// Action Items
export const getActionItems = () =>
  request<ActionItem[]>('/action-items');

export const createActionItem = (item: ActionItem) =>
  request<ActionItem>('/action-items', {
    method: 'POST',
    body: JSON.stringify(item),
  });

export const updateActionItem = (id: number, item: ActionItem) =>
  request<ActionItem>(`/action-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });

export const deleteActionItem = (id: number) =>
  request<void>(`/action-items/${id}`, { method: 'DELETE' });

// Users
export const getUsers = () =>
  request<User[]>('/users');

export const createUser = (user: User) =>
  request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });

export const updateUser = (id: string, user: User) =>
  request<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });

export const deleteUser = (id: string) =>
  request<void>(`/users/${id}`, { method: 'DELETE' });

// Permissions
export const getPermissions = () =>
  request<Permission[]>('/permissions');

export const updatePermission = (userId: string, canEdit: number) =>
  request<Permission>(`/permissions/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId, can_edit: canEdit }),
  });
