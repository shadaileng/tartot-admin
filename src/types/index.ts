export interface ServiceInfo {
  service: string
  version: string
  status: string
  endpoints: Record<string, string>
}

export interface HealthResponse {
  status: string
  worker: string
  gemini: string
  model: string | null
  detail?: string
  exhaustedModels?: string[]
  cache: {
    size: number
    maxSize: number
    hitRate: number
  }
  pool: {
    available: number
    active: number
    waiting: number
    maxPages: number
  }
  metrics: {
    totalRequests: number
    errors: number
    avgTotalMs: number
  }
}

export interface LogEntry {
  id: string
  created_at: string
  method: string
  path: string
  target: string
  status_code: number
  duration_ms: number
  template_ms: number | null
  resource_ms: number | null
  screenshot_ms: number | null
  cache_hit: number
  ip_address: string | null
  is_error: number
  error_msg: string | null
  user_id: string | null
  user_nickname: string | null
  user_email: string | null
  user_avatar: string | null
  login_type: string | null
}

export interface LogListResponse {
  total: number
  page: number
  limit: number
  data: LogEntry[]
}

export interface ReadingLogEntry {
  id: string
  created_at: string
  user_id: string | null
  question: string | null
  cards_json: string | null
  reading: string | null
  model: string | null
  incomplete: number | null
  user_nickname: string | null
  user_email: string | null
  user_avatar: string | null
  login_type: string | null
}

export interface ReadingLogListResponse {
  total: number
  page: number
  limit: number
  data: ReadingLogEntry[]
}

export interface MetricsSnapshot {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  errorCount: number
  avgTotalMs: number
  avgTemplateMs: number
  avgResourceMs: number
  avgScreenshotMs: number
  totalP50: number
  totalP95: number
  totalP99: number
  templateP50: number
  templateP95: number
  templateP99: number
  resourceP50: number
  resourceP95: number
  resourceP99: number
  screenshotP50: number
  screenshotP95: number
  screenshotP99: number
  sampleCount: number
  nonCacheSampleCount: number
}

export interface AdminInfo {
  id: string
  username: string
  displayName: string
  role: string
  mustChangePassword: boolean
}

export interface AuthResponse {
  token: string
  admin: AdminInfo
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ConfigItem {
  key: string
  label: string
  value: string
  source: 'env' | 'user'
  editable: boolean
  type: 'string' | 'number'
}

export interface ConfigGroup {
  name: string
  items: ConfigItem[]
}

export interface ConfigResponse {
  groups: ConfigGroup[]
}

export interface UserEntry {
  id: string
  openid: string
  nickname: string
  avatar_url: string | null
  email: string | null
  phone: string | null
  created_at: string
  last_login_at: string | null
  request_count: number
  last_request_at: string | null
  deleted_at: string | null
}

export interface UserListResponse {
  total: number
  page: number
  limit: number
  data: UserEntry[]
}

export interface AdminEntry {
  id: string
  username: string
  displayName: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminListResponse {
  list: AdminEntry[]
  total: number
  page: number
  pageSize: number
}

export interface CreateAdminRequest {
  username: string
  displayName: string
  password: string
  role: string
}

export interface UpdateAdminRequest {
  displayName?: string
  role?: string
  isActive?: boolean
}

export interface ResetPasswordRequest {
  password: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// ========== 积分等级体系 ==========

export interface LevelDefinitionEntry {
  level: number
  title: string
  points_required: number
  daily_quota: number
  max_extra_quota: number
}

export interface TaskDefinitionEntry {
  id: string
  title: string
  description: string | null
  type: string
  requirement_type: string
  requirement_count: number
  points_reward: number
  extra_quota_reward: number
  icon: string | null
  sort_order: number
  is_active: number
}

export interface CreateTaskDefinitionRequest {
  title: string
  description?: string | null
  type: string
  requirement_type: string
  requirement_count: number
  points_reward: number
  extra_quota_reward: number
  icon?: string | null
  sort_order?: number
}

export interface UpdateTaskDefinitionRequest {
  title?: string
  description?: string | null
  type?: string
  requirement_type?: string
  requirement_count?: number
  points_reward?: number
  extra_quota_reward?: number
  icon?: string | null
  sort_order?: number
  is_active?: number
}

export interface UserStatsEntry {
  user_id: string
  nickname: string
  email: string | null
  points: number
  level: number
  level_title: string
  extra_quota: number
  total_readings: number
  daily_quota_used: number
  consecutive_checkins: number
  referral_code: string
  created_at: string
}

// ========== 数据维护 ==========

export interface TrendPoint {
  date: string
  count: number
}

export interface LevelDistribution {
  level: number
  count: number
  title: string
}

export interface TrendResponse {
  registration: TrendPoint[]
  checkin: TrendPoint[]
  reading: TrendPoint[]
  invite: TrendPoint[]
  levelDistribution: LevelDistribution[]
  summary: {
    totalUsers: number
    todayCheckins: number
    totalReadings: number
    totalInvites: number
  }
}

export interface AdminInviteRecord {
  id: string
  inviter_id: string
  invitee_id: string
  status: string
  completed_at: string | null
  created_at: string
  inviter_name: string | null
  inviter_avatar: string | null
  invitee_name: string | null
  invitee_avatar: string | null
}

export interface AdminInviteListResponse {
  total: number
  page: number
  limit: number
  data: AdminInviteRecord[]
}

export interface CheckinStatsResponse {
  todayCheckins: number
  total: number
  avgPoints: number
  page?: number
  limit?: number
  data?: CheckinRecordEntry[]
}

export interface CheckinRecordEntry {
  id: string
  user_id: string
  checkin_date: string
  points_earned: number
  streak_bonus: number
  created_at: string
  nickname: string | null
  avatar_url: string | null
}

// ========== 意见反馈 ==========

export interface FeedbackItem {
  id: string
  userId: string
  userNickname: string
  userAvatar: string | null
  category: string
  content: string
  images: string[]
  status: string
  adminReply: string | null
  repliedAt: string | null
  repliedBy: string | null
  createdAt: string
}

export interface FeedbackListResponse {
  total: number
  page: number
  limit: number
  data: FeedbackItem[]
}

export interface FeedbackDetail extends FeedbackItem {
  user: {
    nickname: string
    avatarUrl: string | null
    email: string | null
  } | null
}

// ========== 审计日志 ==========

export interface AuditLogEntry {
  id: string
  created_at: string
  actor_type: string
  actor_id: string | null
  actor_name: string | null
  action: string
  target_type: string | null
  target_id: string | null
  target_name: string | null
  old_value: string | null
  new_value: string | null
  ip_address: string | null
}

export interface AuditLogListResponse {
  total: number
  page: number
  limit: number
  data: AuditLogEntry[]
}

// ========== 菜单系统 ==========

export interface MenuItem {
  id: string
  parentId: string | null
  routeName: string
  label: string
  icon: string | null
  sortOrder: number
  isVisible: boolean
  requireRole: string | null
  createdAt: string
  updatedAt: string
}

export interface MenuTreeItem {
  id: string
  routeName: string | null
  label: string
  icon: string | null
  sortOrder: number
  children: MenuTreeItem[]
}

export interface CreateMenuRequest {
  parentId?: string | null
  routeName: string
  label: string
  icon?: string | null
  sortOrder?: number
  isVisible?: boolean
  requireRole?: string | null
}

export interface UpdateMenuRequest {
  parentId?: string | null
  routeName?: string
  label?: string
  icon?: string | null
  sortOrder?: number
  isVisible?: boolean
  requireRole?: string | null
}

// ========== 页面管理 ==========

export interface PageSectionEntry {
  id: string
  pageKey: string
  sectionKey: string
  label: string
  visible: boolean
  updatedAt: string
}

export interface PageSectionsResponse {
  sections: PageSectionEntry[]
}
