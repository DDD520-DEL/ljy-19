export interface User {
  id: string;
  name: string;
  avatar: string;
  role: "user" | "admin";
  joinDate: string;
  email?: string;
  monthlyBudget: number;
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
}

export type StockStatus = "sufficient" | "low" | "critical";

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
