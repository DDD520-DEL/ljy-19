export type UserStatus = "pending" | "active";

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: "user" | "admin";
  joinDate: string;
  email?: string;
  monthlyBudget: number;
  status: UserStatus;
}

export type InvitationCodeStatus = "active" | "used" | "expired";

export interface InvitationCode {
  id: string;
  code: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: InvitationCodeStatus;
  usedBy?: string;
  usedAt?: string;
  registeredUserName?: string;
  registeredUserEmail?: string;
}

export interface UserMonthlyBudget {
  id: string;
  userId: string;
  year: number;
  month: number;
  budget: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserBudgetInfo {
  userId: string;
  totalBudget: number;
  usedAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  year: number;
  month: number;
}

export type MaterialCategory = "coffee" | "tea" | "dairy" | "snack";

export interface Batch {
  id: string;
  materialId: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  remainingQuantity: number;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  stock: number;
  threshold: number;
  unitPrice: number;
  unit: string;
  icon: string;
  color: string;
  description?: string;
  batches: Batch[];
  defaultShelfLifeDays?: number;
}

export interface Consumption {
  id: string;
  userId: string;
  materialId: string;
  quantity: number;
  timestamp: string;
}

export interface Restock {
  id: string;
  materialId: string;
  quantity: number;
  operatorId: string;
  timestamp: string;
  cost: number;
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface VoteOption {
  id: string;
  voteId: string;
  name: string;
  icon: string;
  votes: number;
}

export interface VoteRecord {
  id: string;
  voteId: string;
  userId: string;
  optionIds: string[];
  timestamp: string;
}

export interface DutySchedule {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  isCurrent: boolean;
  handoverCompleted: boolean;
  handoverCompletedAt?: string;
}

export interface DutyHandoverRecord {
  id: string;
  scheduleId: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  tasks: {
    inventoryCheck: boolean;
    pantryCleanup: boolean;
    equipmentCheck: boolean;
    otherTasks: string;
  };
  notes: string;
  confirmedAt: string;
  nextUserId: string;
}

export interface DutySingleBanner {
  visible: boolean;
  message: string;
  dismissed: boolean;
}

export interface DutyBannerState {
  update: DutySingleBanner;
  pending: DutySingleBanner;
}

export type StockStatus = "sufficient" | "low" | "critical";
export type BatchExpiryStatus = "normal" | "expiring_soon" | "expired";

export interface BatchExpiryInfo {
  status: BatchExpiryStatus;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export type RestockRequestStatus = "pending" | "approved" | "rejected";

export interface RestockRequest {
  id: string;
  materialId: string;
  quantity: number;
  estimatedCost: number;
  applicantId: string;
  reason: string;
  status: RestockRequestStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approverId?: string;
  rejectReason?: string;
}

export interface VoteSuggestion {
  id: string;
  voteId: string;
  voteTitle: string;
  optionId: string;
  optionName: string;
  optionIcon: string;
  votes: number;
  suggestedQuantity: number;
  materialId?: string;
  status: 'pending' | 'processed';
  createdAt: string;
  processedAt?: string;
  restockRequestId?: string;
}

export type GroupPurchaseStatus = "active" | "closed" | "settled";

export interface GroupPurchaseParticipantItem {
  materialId: string;
  quantity: number;
}

export interface GroupPurchaseParticipant {
  userId: string;
  items: GroupPurchaseParticipantItem[];
  joinedAt: string;
}

export interface GroupPurchase {
  id: string;
  creatorId: string;
  materialIds: string[];
  participants: GroupPurchaseParticipant[];
  deadline: string;
  status: GroupPurchaseStatus;
  shareCode: string;
  createdAt: string;
  closedAt?: string;
  settledAt?: string;
}

export type GroupBuyReservationStatus = "active" | "succeeded" | "cancelled";

export interface GroupBuyParticipant {
  userId: string;
  quantity: number;
  joinedAt: string;
}

export interface GroupBuyReservation {
  id: string;
  creatorId: string;
  materialId: string;
  title: string;
  unitPrice: number;
  targetQuantity: number;
  deadline: string;
  status: GroupBuyReservationStatus;
  participants: GroupBuyParticipant[];
  shareCode: string;
  createdAt: string;
  settledAt?: string;
  cancelledAt?: string;
  restockRequestId?: string;
}

export interface UserStats {
  userId: string;
  totalConsumptions: number;
  totalCost: number;
  byCategory: Record<MaterialCategory, number>;
}

export interface MonthlyStats {
  month: string;
  totalCups: number;
  totalCost: number;
  activeUsers: number;
  byMaterial: Record<string, number>;
}

export interface Review {
  id: string;
  userId: string;
  materialId: string;
  consumptionId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  timestamp: string;
}

export interface MaterialRatingSummary {
  materialId: string;
  averageRating: number;
  reviewCount: number;
}

export interface MonthlyConsumption {
  month: string;
  totalQuantity: number;
}

export interface MaterialConsumptionTrend {
  materialId: string;
  monthlyConsumptions: MonthlyConsumption[];
  threeMonthAverage: number;
  dailyAverage: number;
  coefficientOfVariation: number;
  isVolatile: boolean;
}

export interface RestockSuggestion {
  materialId: string;
  materialName: string;
  materialIcon: string;
  materialColor: string;
  materialUnit: string;
  unitPrice: number;
  category: MaterialCategory;
  currentStock: number;
  threshold: number;
  threeMonthAverage: number;
  dailyAverage: number;
  suggestedQuantity: number;
  estimatedDays: number;
  isVolatile: boolean;
  trendData: MonthlyConsumption[];
  estimatedCost: number;
}

export const categoryLabels: Record<MaterialCategory, string> = {
  coffee: "咖啡豆",
  tea: "茶包",
  dairy: "奶制品",
  snack: "零食",
};

export const categoryColors: Record<MaterialCategory, string> = {
  coffee: "#6F4E37",
  tea: "#88B04B",
  dairy: "#FFE4A8",
  snack: "#E67E22",
};

export type AnnouncementType = "general" | "stock" | "maintenance" | "holiday";
export type AnnouncementStatus = "active" | "expired" | "archived";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isPinned: boolean;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
  status: AnnouncementStatus;
  viewCount: number;
}

export const announcementTypeLabels: Record<AnnouncementType, string> = {
  general: "一般通知",
  stock: "库存通知",
  maintenance: "设备维护",
  holiday: "节假日",
};

export const announcementTypeColors: Record<AnnouncementType, string> = {
  general: "#6B7280",
  stock: "#10B981",
  maintenance: "#F59E0B",
  holiday: "#EF4444",
};

export type WishStatus = "pending" | "purchased" | "declined";

export interface Wish {
  id: string;
  name: string;
  recommendLink?: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  likes: string[];
  status: WishStatus;
  adminNote?: string;
  processedAt?: string;
  processedBy?: string;
}

export const wishStatusLabels: Record<WishStatus, string> = {
  pending: "待处理",
  purchased: "已采购",
  declined: "暂不采购",
};

export const wishStatusColors: Record<WishStatus, string> = {
  pending: "#F59E0B",
  purchased: "#10B981",
  declined: "#6B7280",
};

export interface CheckInRecord {
  id: string;
  userId: string;
  date: string;
  timestamp: string;
}

export type BadgeType = "drink_master" | "monthly_drinker";

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
  month?: string;
}

export interface PointsRecord {
  id: string;
  userId: string;
  points: number;
  amount: number;
  consumptionId: string;
  year: number;
  month: number;
  timestamp: string;
}

export interface MonthlyPoints {
  userId: string;
  year: number;
  month: number;
  totalPoints: number;
  totalAmount: number;
  rank?: number;
}

export interface LeaderboardEntry {
  userId: string;
  user: User;
  totalPoints: number;
  totalAmount: number;
  rank: number;
  hasTitle: boolean;
}

export interface MonthlyDrinkerTitle {
  userId: string;
  year: number;
  month: number;
  rank: number;
  awardedAt: string;
}

export const DRINKER_TITLE_RANKS = [1, 2, 3] as const;
export const POINTS_PER_YUAN = 1;

export interface UserCheckInStats {
  userId: string;
  totalCheckIns: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  lastCheckInDate: string | null;
}

export const badgeConfigs: Record<BadgeType, Omit<Badge, "unlockedAt" | "month">> = {
  drink_master: {
    type: "drink_master",
    name: "饮者达人",
    description: "连续签到 7 天解锁",
    icon: "🏆",
    color: "#F59E0B",
  },
  monthly_drinker: {
    type: "monthly_drinker",
    name: "本月饮者",
    description: "月度积分排行榜前三名获得",
    icon: "👑",
    color: "#E67E22",
  },
};

export const STREAK_FOR_DRINK_MASTER = 7;
