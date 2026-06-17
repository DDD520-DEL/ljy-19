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
