/**
 * TypeScript Type Definitions for Odoo Integration
 * 
 * This file contains all type definitions required for the Odoo integration
 * service layer. These types are designed to support Test-Driven Development
 * by providing clear contracts and interfaces.
 */

// ============================================================================
// Core Domain Types
// ============================================================================

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT_TO_SUPPLIER = 'SENT_TO_SUPPLIER',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export enum SyncStatus {
  NOT_SYNCED = 'NOT_SYNCED',
  PENDING_SYNC = 'PENDING_SYNC',
  SYNCED = 'SYNCED',
  SYNC_FAILED = 'SYNC_FAILED',
  CONFLICT = 'CONFLICT'
}

export enum EntityType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SUPPLIER = 'SUPPLIER',
  PRODUCT = 'PRODUCT'
}

export enum ConflictType {
  DATA_MISMATCH = 'DATA_MISMATCH',
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION'
}

// ============================================================================
// Domain Entities
// ============================================================================

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productCode?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
  requestedDeliveryDate?: Date
  approvedBy?: string
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
  syncStatus: SyncStatus
  odooOrderId?: number
  lastSyncedAt?: Date
}

export interface OdooPurchaseOrder {
  id: number
  name: string
  partner_id: [number, string] // [id, name] tuple
  date_order: string
  state: string
  amount_total: number
  amount_untaxed: number
  amount_tax: number
  order_line: Array<[number, string, any]> // Odoo's many2many format
  notes?: string
  create_date: string
  write_date: string
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreatePurchaseOrderRequest {
  orderNumber: string
  supplierId: string
  supplierName: string
  items: Array<{
    productId: string
    productName: string
    productCode?: string
    quantity: number
    unitPrice: number
    notes?: string
  }>
  notes?: string
  requestedDeliveryDate?: Date
}

export interface CreateOdooOrderRequest {
  partner_id: string
  date_order: string
  order_line: Array<{
    product_id: string
    product_qty: number
    price_unit: number
    name: string
  }>
  notes?: string
}

export interface UpdateOdooOrderRequest {
  order_line?: Array<{
    product_id: string
    product_qty: number
    price_unit: number
    name: string
  }>
  notes?: string
  state?: string
}

// ============================================================================
// Sync and Conflict Types
// ============================================================================

export interface OrderSyncMapping {
  localOrderId: string
  odooOrderId: number
  lastSyncedAt: Date
}

export interface SyncState {
  entityId: string
  entityType: EntityType
  status: SyncStatus
  lastSyncAttempt?: Date
  lastSuccessfulSync?: Date
  failureCount: number
  lastError?: SyncError
  version: number
}

export interface SyncError {
  message: string
  type: string
  timestamp: Date
}

export interface SyncConflict {
  id: string
  entityId: string
  entityType: EntityType
  conflictType: ConflictType
  localVersion: any
  remoteVersion: any
  detectedAt: Date
  resolvedAt?: Date
  resolution?: ConflictResolution
}

export interface ConflictResolution {
  strategy: 'ACCEPT_LOCAL' | 'ACCEPT_REMOTE' | 'MANUAL_MERGE'
  resolvedBy: string
  resolvedAt?: Date
  notes?: string
}

export interface Conflict {
  field: string
  localValue: any
  remoteValue: any
  type: ConflictType
}

export interface ConflictSet {
  hasConflicts: boolean
  conflicts: Conflict[]
  warnings: string[]
}

export interface ConflictingOrder {
  localOrder: PurchaseOrder
  odooOrder: OdooPurchaseOrder
  conflicts: Conflict[]
  detectedAt: Date
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface SyncResult {
  success: boolean
  localOrderId: string
  odooOrderId?: number
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  timestamp: Date
  duration: number
  error?: SyncError
  warnings: string[]
}

export interface BatchSyncResult {
  totalProcessed: number
  successful: number
  failed: number
  skipped: number
  results: SyncResult[]
  duration: number
  nextBatchToken?: string
}

export interface IntegrationHealthStatus {
  isHealthy: boolean
  lastSuccessfulSync: Date | null
  consecutiveFailures: number
  odooConnectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  cacheStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE'
  queueStatus: 'HEALTHY' | 'BACKLOGGED' | 'FAILED'
  errorRate: number
}

export interface SyncSettings {
  batchSize: number
  retryAttempts: number
  syncInterval: number
  enableRealtimeSync: boolean
  conflictResolutionStrategy: 'MANUAL' | 'ACCEPT_LOCAL' | 'ACCEPT_REMOTE'
}

export interface SyncMetrics {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  conflictingSyncs: number
  successRate: number
  averageSyncDuration: number
  lastSyncTimestamp: Date | null
  syncsByStatus: Record<SyncStatus, number>
}

// ============================================================================
// Filter and Query Types
// ============================================================================

export interface OrderFilter {
  statuses?: OrderStatus[]
  syncStatuses?: SyncStatus[]
  supplierIds?: string[]
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}

export interface TimeWindow {
  start: Date
  end: Date
}

// ============================================================================
// Service Interface Types
// ============================================================================

export interface IOdooIntegrationService {
  // Purchase Order Operations
  syncPurchaseOrderToOdoo(localOrderId: string): Promise<SyncResult>
  syncPurchaseOrderFromOdoo(odooOrderId: number): Promise<SyncResult>
  
  // Batch Operations
  batchSyncPendingOrders(batchSize?: number): Promise<BatchSyncResult>
  batchImportOrders(filters: OrderFilter): Promise<BatchSyncResult>
  
  // Real-time Sync
  startRealtimeSync(): Promise<void>
  stopRealtimeSync(): Promise<void>
  
  // Health & Monitoring
  getHealthStatus(): Promise<IntegrationHealthStatus>
  getLastSyncStatus(): Promise<SyncStatus>
  
  // Configuration
  updateSyncSettings(settings: SyncSettings): Promise<void>
  getSyncSettings(): Promise<SyncSettings>
}

export interface IPurchaseOrderRepository {
  // Local Operations
  findLocalOrder(id: string): Promise<PurchaseOrder | null>
  findLocalOrdersByStatus(status: OrderStatus[]): Promise<PurchaseOrder[]>
  createLocalOrder(order: CreatePurchaseOrderRequest): Promise<PurchaseOrder>
  updateLocalOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder>
  deleteLocalOrder(id: string): Promise<void>
  
  // Odoo Operations
  findOdooOrder(id: number): Promise<OdooPurchaseOrder | null>
  createOdooOrder(order: CreateOdooOrderRequest): Promise<number>
  updateOdooOrder(id: number, updates: Partial<OdooPurchaseOrder>): Promise<void>
  findOdooOrdersModifiedSince(timestamp: Date): Promise<OdooPurchaseOrder[]>
  
  // Sync Operations
  markOrderAsSynced(localId: string, odooId: number, syncTimestamp: Date): Promise<void>
  findOrdersRequiringSync(): Promise<PurchaseOrder[]>
  findSyncMapping(localId: string): Promise<OrderSyncMapping | null>
  
  // Conflict Detection
  detectConflicts(localOrder: PurchaseOrder, odooOrder: OdooPurchaseOrder): Promise<ConflictSet>
  findConflictingOrders(): Promise<ConflictingOrder[]>
}

export interface ISyncStateManager {
  // State Management
  getSyncState(entityId: string, entityType: EntityType): Promise<SyncState>
  updateSyncState(entityId: string, entityType: EntityType, state: SyncState): Promise<void>
  clearSyncState(entityId: string, entityType: EntityType): Promise<void>
  
  // Conflict Management
  recordConflict(conflict: SyncConflict): Promise<void>
  resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>
  getPendingConflicts(entityType?: EntityType): Promise<SyncConflict[]>
  getConflictHistory(entityId: string): Promise<SyncConflict[]>
  
  // Monitoring
  getLastSuccessfulSync(entityType: EntityType): Promise<Date | null>
  getFailedSyncCount(entityType: EntityType, timeWindow: TimeWindow): Promise<number>
  getSyncMetrics(timeWindow: TimeWindow): Promise<SyncMetrics>
}

export interface IConflictResolver {
  resolveConflict(conflict: SyncConflict, resolution: ConflictResolution): Promise<void>
  suggestResolution(conflict: SyncConflict): Promise<ConflictResolution>
  canAutoResolve(conflict: SyncConflict): Promise<boolean>
}

// ============================================================================
// Cache Service Types
// ============================================================================

export interface CacheStats {
  hitCount: number
  missCount: number
  hitRatio: number
  totalSize: number
  evictionCount: number
}

export interface ICacheService {
  // Basic Cache Operations
  get<T>(key: string, deserializer?: (data: any) => T): Promise<T | null>
  set(key: string, value: any, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  
  // Batch Operations
  getBatch<T>(keys: string[]): Promise<Map<string, T>>
  setBatch(entries: Map<string, any>, ttl?: number): Promise<void>
  deleteBatch(keys: string[]): Promise<void>
  
  // Cache Invalidation
  invalidatePattern(pattern: string): Promise<void>
  invalidateTag(tag: string): Promise<void>
  
  // Cache Statistics
  getStats(): Promise<CacheStats>
  
  // Cache Hierarchy
  warmupCache(keys: string[]): Promise<void>
  getCacheHitRatio(): Promise<number>
}

export interface IMemoryCache<K, V> {
  get(key: K): Promise<V | null>
  set(key: K, value: V, ttl?: number): Promise<void>
  delete(key: K): Promise<boolean>
  clear(): Promise<void>
  has(key: K): Promise<boolean>
  size(): number
  keys(): K[]
  values(): V[]
  entries(): [K, V][]
}

export interface IRedisCache {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<void>
  delete(key: string): Promise<number>
  exists(key: string): Promise<boolean>
  expire(key: string, ttl: number): Promise<boolean>
  ttl(key: string): Promise<number>
  keys(pattern: string): Promise<string[]>
  flushdb(): Promise<void>
  ping(): Promise<string>
  info(): Promise<string>
}

export interface IDatabaseCache {
  get(key: string): Promise<any>
  set(key: string, value: any, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  cleanup(): Promise<void>
  getStats(): Promise<CacheStats>
}

// ============================================================================
// Event Service Types
// ============================================================================

export abstract class DomainEvent {
  readonly id: string = crypto.randomUUID()
  readonly timestamp: Date = new Date()
  readonly version: number = 1
  
  abstract readonly eventType: string
  abstract readonly entityId: string
  abstract readonly entityType: string
}

export interface EventHandler<T extends DomainEvent> {
  (event: T): Promise<void> | void
}

export interface SubscriptionOptions {
  filter?: (event: DomainEvent) => boolean
  retry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export interface EventFilter {
  eventTypes?: string[]
  entityIds?: string[]
  entityTypes?: string[]
  fromDate?: Date
  toDate?: Date
}

export interface IEventService {
  // Event Publishing
  publish<T extends DomainEvent>(event: T): Promise<void>
  publishBatch(events: DomainEvent[]): Promise<void>
  
  // Event Subscription
  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: EventHandler<T>,
    options?: SubscriptionOptions
  ): Promise<string>
  
  unsubscribe(subscriptionId: string): Promise<void>
  
  // Event History
  getEventHistory(entityId: string, entityType: string): Promise<DomainEvent[]>
  
  // Event Replay
  replayEvents(filter: EventFilter): Promise<void>
}

export interface IEventStore {
  save(event: DomainEvent): Promise<void>
  getByEntityId(entityId: string, entityType?: string): Promise<DomainEvent[]>
  getByEventType(eventType: string): Promise<DomainEvent[]>
  getByDateRange(fromDate: Date, toDate: Date, eventTypes?: string[], entityIds?: string[]): Promise<DomainEvent[]>
  deleteOlderThan(date: Date): Promise<void>
  count(filter?: EventFilter): Promise<number>
}

// ============================================================================
// External Client Types
// ============================================================================

export interface IOdooClient {
  // Basic CRUD operations
  create(model: string, data: any): Promise<number>
  read(model: string, ids: number[], fields?: string[]): Promise<any[]>
  write(model: string, ids: number[], data: any): Promise<boolean>
  unlink(model: string, ids: number[]): Promise<boolean>
  
  // Search operations
  search(model: string, domain: any[], options?: any): Promise<number[]>
  searchRead(model: string, domain: any[], fields?: string[], limit?: number, offset?: number, order?: string): Promise<any[]>
  searchCount(model: string, domain: any[]): Promise<number>
  
  // Metadata operations
  fieldsGet(model: string, fields?: string[]): Promise<any>
  
  // Connection management
  getConnectionStatus(): Promise<'CONNECTED' | 'DISCONNECTED' | 'ERROR'>
  authenticate(): Promise<boolean>
  logout(): Promise<void>
}

export interface SupabaseClient {
  from(table: string): any
  // Add other Supabase methods as needed
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ILogger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
}

export interface RetryOptions {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}

// ============================================================================
// Test Helper Types
// ============================================================================
// Note: Jest types removed to prevent namespace errors in production build

// ============================================================================
// Service Implementation Classes (to be implemented)
// ============================================================================

export class OdooIntegrationService implements IOdooIntegrationService {
  constructor(
    private readonly purchaseOrderRepo: IPurchaseOrderRepository,
    private readonly syncStateManager: ISyncStateManager,
    private readonly cacheService: ICacheService,
    private readonly eventService: IEventService,
    private readonly conflictResolver: IConflictResolver,
    private readonly logger: ILogger
  ) {}

  async syncPurchaseOrderToOdoo(localOrderId: string): Promise<SyncResult> {
    throw new Error('Method not implemented.')
  }

  async syncPurchaseOrderFromOdoo(odooOrderId: number): Promise<SyncResult> {
    throw new Error('Method not implemented.')
  }

  async batchSyncPendingOrders(batchSize?: number): Promise<BatchSyncResult> {
    throw new Error('Method not implemented.')
  }

  async batchImportOrders(filters: OrderFilter): Promise<BatchSyncResult> {
    throw new Error('Method not implemented.')
  }

  async startRealtimeSync(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async stopRealtimeSync(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getHealthStatus(): Promise<IntegrationHealthStatus> {
    throw new Error('Method not implemented.')
  }

  async getLastSyncStatus(): Promise<SyncStatus> {
    throw new Error('Method not implemented.')
  }

  async updateSyncSettings(settings: SyncSettings): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getSyncSettings(): Promise<SyncSettings> {
    throw new Error('Method not implemented.')
  }
}

export class OdooPurchaseOrderService {
  constructor(
    private readonly odooClient: IOdooClient,
    private readonly repository: IPurchaseOrderRepository,
    private readonly cacheService: ICacheService,
    private readonly eventService: IEventService,
    private readonly logger: ILogger
  ) {}

  async createPurchaseOrder(request: CreateOdooOrderRequest): Promise<number> {
    throw new Error('Method not implemented.')
  }

  async getPurchaseOrder(odooOrderId: number): Promise<OdooPurchaseOrder | null> {
    throw new Error('Method not implemented.')
  }

  async updatePurchaseOrder(odooOrderId: number, updates: UpdateOdooOrderRequest): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async searchPurchaseOrders(filters: any[], limit?: number, offset?: number): Promise<OdooPurchaseOrder[]> {
    throw new Error('Method not implemented.')
  }

  async getOrdersModifiedSince(timestamp: Date): Promise<OdooPurchaseOrder[]> {
    throw new Error('Method not implemented.')
  }

  async confirmPurchaseOrder(odooOrderId: number): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async cancelPurchaseOrder(odooOrderId: number): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
}

export class OdooSyncService {
  constructor(
    private readonly odooClient: IOdooClient,
    private readonly repository: IPurchaseOrderRepository,
    private readonly syncStateManager: ISyncStateManager,
    private readonly cacheService: ICacheService,
    private readonly eventService: IEventService,
    private readonly logger: ILogger
  ) {}

  async syncOrderToOdoo(localOrderId: string): Promise<SyncResult> {
    throw new Error('Method not implemented.')
  }

  async syncOrderFromOdoo(odooOrderId: number): Promise<SyncResult> {
    throw new Error('Method not implemented.')
  }

  async batchSyncPendingOrders(batchSize?: number): Promise<BatchSyncResult> {
    throw new Error('Method not implemented.')
  }

  async resolveConflict(conflictId: string, conflict: SyncConflict, resolution: ConflictResolution): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getPendingConflicts(): Promise<SyncConflict[]> {
    throw new Error('Method not implemented.')
  }

  async getSyncMetrics(): Promise<SyncMetrics> {
    throw new Error('Method not implemented.')
  }
}

export class PurchaseOrderRepository implements IPurchaseOrderRepository {
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly odooClient: IOdooClient,
    private readonly logger: ILogger
  ) {}

  async findLocalOrder(id: string): Promise<PurchaseOrder | null> {
    throw new Error('Method not implemented.')
  }

  async findLocalOrdersByStatus(status: OrderStatus[]): Promise<PurchaseOrder[]> {
    throw new Error('Method not implemented.')
  }

  async createLocalOrder(order: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    throw new Error('Method not implemented.')
  }

  async updateLocalOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    throw new Error('Method not implemented.')
  }

  async deleteLocalOrder(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async findOdooOrder(id: number): Promise<OdooPurchaseOrder | null> {
    throw new Error('Method not implemented.')
  }

  async createOdooOrder(order: CreateOdooOrderRequest): Promise<number> {
    throw new Error('Method not implemented.')
  }

  async updateOdooOrder(id: number, updates: Partial<OdooPurchaseOrder>): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async findOdooOrdersModifiedSince(timestamp: Date): Promise<OdooPurchaseOrder[]> {
    throw new Error('Method not implemented.')
  }

  async markOrderAsSynced(localId: string, odooId: number, syncTimestamp: Date): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async findOrdersRequiringSync(): Promise<PurchaseOrder[]> {
    throw new Error('Method not implemented.')
  }

  async findSyncMapping(localId: string): Promise<OrderSyncMapping | null> {
    throw new Error('Method not implemented.')
  }

  async detectConflicts(localOrder: PurchaseOrder, odooOrder: OdooPurchaseOrder): Promise<ConflictSet> {
    throw new Error('Method not implemented.')
  }

  async findConflictingOrders(): Promise<ConflictingOrder[]> {
    throw new Error('Method not implemented.')
  }
}

export class CacheService implements ICacheService {
  constructor(
    private readonly memoryCache: IMemoryCache<string, any>,
    private readonly redisCache: IRedisCache,
    private readonly databaseCache: IDatabaseCache,
    private readonly logger: ILogger
  ) {}

  async get<T>(key: string, deserializer?: (data: any) => T): Promise<T | null> {
    throw new Error('Method not implemented.')
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async delete(key: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async exists(key: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    throw new Error('Method not implemented.')
  }

  async setBatch(entries: Map<string, any>, ttl?: number): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async deleteBatch(keys: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async invalidatePattern(pattern: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async invalidateTag(tag: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getStats(): Promise<CacheStats> {
    throw new Error('Method not implemented.')
  }

  async warmupCache(keys: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getCacheHitRatio(): Promise<number> {
    throw new Error('Method not implemented.')
  }
}

export class EventService implements IEventService {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly logger: ILogger
  ) {}

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: EventHandler<T>,
    options?: SubscriptionOptions
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getEventHistory(entityId: string, entityType: string): Promise<DomainEvent[]> {
    throw new Error('Method not implemented.')
  }

  async replayEvents(filter: EventFilter): Promise<void> {
    throw new Error('Method not implemented.')
  }
}