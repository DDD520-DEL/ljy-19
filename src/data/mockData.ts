import type {
  User,
  Material,
  Consumption,
  Vote,
  VoteOption,
  VoteRecord,
  DutySchedule,
  Restock,
  UserMonthlyBudget,
  Batch,
} from "../types";
import { generateId, getStartOfWeek, getEndOfWeek, formatDate, addDays } from "../utils/date";

const avatarColors = [
  "#6F4E37",
  "#88B04B",
  "#E67E22",
  "#3498DB",
  "#9B59B6",
  "#1ABC9C",
  "#E74C3C",
  "#F39C12",
  "#2ECC71",
  "#34495E",
];

const getAvatar = (name: string, index: number): string => {
  const color = avatarColors[index % avatarColors.length];
  const initial = name.charAt(0);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='white' font-size='20' font-weight='600' font-family='sans-serif'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

export const mockUsers: User[] = [
  { id: "user-1", name: "张小明", avatar: getAvatar("张", 0), role: "user", joinDate: "2024-01-15", monthlyBudget: 200 },
  { id: "user-2", name: "李小红", avatar: getAvatar("李", 1), role: "user", joinDate: "2024-02-01", monthlyBudget: 200 },
  { id: "user-3", name: "王小华", avatar: getAvatar("王", 2), role: "admin", joinDate: "2023-12-01", monthlyBudget: 300 },
  { id: "user-4", name: "赵小刚", avatar: getAvatar("赵", 3), role: "user", joinDate: "2024-03-10", monthlyBudget: 200 },
  { id: "user-5", name: "陈小美", avatar: getAvatar("陈", 4), role: "user", joinDate: "2024-01-20", monthlyBudget: 200 },
  { id: "user-6", name: "刘大勇", avatar: getAvatar("刘", 5), role: "user", joinDate: "2024-02-15", monthlyBudget: 250 },
  { id: "user-7", name: "周小芳", avatar: getAvatar("周", 6), role: "user", joinDate: "2024-04-01", monthlyBudget: 200 },
  { id: "user-8", name: "吴小伟", avatar: getAvatar("吴", 7), role: "user", joinDate: "2024-03-20", monthlyBudget: 200 },
];

const generateMonthlyBudgets = (): UserMonthlyBudget[] => {
  const budgets: UserMonthlyBudget[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  mockUsers.forEach((user) => {
    for (let monthOffset = 0; monthOffset >= -2; monthOffset--) {
      const date = new Date(currentYear, currentMonth + monthOffset, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      budgets.push({
        id: generateId(),
        userId: user.id,
        year,
        month,
        budget: user.monthlyBudget,
        createdAt: new Date(year, month, 1).toISOString(),
        updatedAt: new Date(year, month, 1).toISOString(),
      });
    }
  });

  return budgets;
};

export const mockMonthlyBudgets: UserMonthlyBudget[] = generateMonthlyBudgets();

const generateBatch = (
  materialId: string,
  productionDaysAgo: number,
  shelfLifeDays: number,
  totalQuantity: number,
  remainingQuantity: number
): Batch => {
  const now = new Date();
  const productionDate = addDays(now, -productionDaysAgo);
  const expiryDate = addDays(productionDate, shelfLifeDays);

  return {
    id: generateId(),
    materialId,
    productionDate: formatDate(productionDate, "YYYY-MM-DD"),
    expiryDate: formatDate(expiryDate, "YYYY-MM-DD"),
    quantity: totalQuantity,
    remainingQuantity: remainingQuantity,
    createdAt: productionDate.toISOString(),
  };
};

export const mockMaterials: Material[] = [
  {
    id: "mat-1",
    name: "意式拼配咖啡豆",
    category: "coffee",
    stock: 45,
    threshold: 20,
    unitPrice: 2.5,
    unit: "杯",
    icon: "☕",
    color: "#6F4E37",
    description: "深度烘焙，浓郁醇厚",
    defaultShelfLifeDays: 90,
    batches: [
      generateBatch("mat-1", 15, 90, 30, 20),
      generateBatch("mat-1", 60, 90, 30, 15),
      generateBatch("mat-1", 85, 90, 20, 10),
    ],
  },
  {
    id: "mat-2",
    name: "埃塞俄比亚单品豆",
    category: "coffee",
    stock: 15,
    threshold: 15,
    unitPrice: 4.0,
    unit: "杯",
    icon: "🫘",
    color: "#8B6340",
    description: "果酸花香，浅度烘焙",
    defaultShelfLifeDays: 90,
    batches: [
      generateBatch("mat-2", 88, 90, 25, 8),
      generateBatch("mat-2", 30, 90, 10, 7),
    ],
  },
  {
    id: "mat-3",
    name: "低因咖啡豆",
    category: "coffee",
    stock: 30,
    threshold: 10,
    unitPrice: 3.5,
    unit: "杯",
    icon: "🌙",
    color: "#A67C52",
    description: "无咖啡因，晚间友好",
    defaultShelfLifeDays: 90,
    batches: [
      generateBatch("mat-3", 5, 90, 25, 20),
      generateBatch("mat-3", 40, 90, 15, 10),
    ],
  },
  {
    id: "mat-4",
    name: "龙井绿茶",
    category: "tea",
    stock: 50,
    threshold: 20,
    unitPrice: 1.5,
    unit: "包",
    icon: "🍃",
    color: "#88B04B",
    description: "清香甘醇，明前茶",
    defaultShelfLifeDays: 540,
    batches: [
      generateBatch("mat-4", 20, 540, 30, 25),
      generateBatch("mat-4", 100, 540, 30, 25),
    ],
  },
  {
    id: "mat-5",
    name: "正山小种红茶",
    category: "tea",
    stock: 35,
    threshold: 15,
    unitPrice: 2.0,
    unit: "包",
    icon: "🫖",
    color: "#C0392B",
    description: "松烟香桂圆味",
    defaultShelfLifeDays: 540,
    batches: [
      generateBatch("mat-5", 60, 540, 20, 15),
      generateBatch("mat-5", 150, 540, 25, 20),
    ],
  },
  {
    id: "mat-6",
    name: "桂花乌龙茶",
    category: "tea",
    stock: 8,
    threshold: 15,
    unitPrice: 2.5,
    unit: "包",
    icon: "🌸",
    color: "#E67E22",
    description: "桂花香浓，回甘持久",
    defaultShelfLifeDays: 540,
    batches: [
      generateBatch("mat-6", 500, 540, 10, 3),
      generateBatch("mat-6", 530, 540, 10, 5),
    ],
  },
  {
    id: "mat-7",
    name: "洋甘菊茶",
    category: "tea",
    stock: 25,
    threshold: 10,
    unitPrice: 1.8,
    unit: "包",
    icon: "🌼",
    color: "#F1C40F",
    description: "舒缓安神，花草茶",
    defaultShelfLifeDays: 540,
    batches: [
      generateBatch("mat-7", 10, 540, 25, 25),
    ],
  },
  {
    id: "mat-8",
    name: "鲜牛奶",
    category: "dairy",
    stock: 12,
    threshold: 8,
    unitPrice: 1.0,
    unit: "份",
    icon: "🥛",
    color: "#FFF8E7",
    description: "全脂牛奶，新鲜配送",
    defaultShelfLifeDays: 7,
    batches: [
      generateBatch("mat-8", 3, 7, 10, 5),
      generateBatch("mat-8", 6, 7, 10, 7),
    ],
  },
  {
    id: "mat-9",
    name: "燕麦奶",
    category: "dairy",
    stock: 5,
    threshold: 5,
    unitPrice: 2.0,
    unit: "份",
    icon: "🌾",
    color: "#D4A574",
    description: "植物基，乳糖不耐友好",
    defaultShelfLifeDays: 30,
    batches: [
      generateBatch("mat-9", 25, 30, 10, 5),
    ],
  },
  {
    id: "mat-10",
    name: "椰奶",
    category: "dairy",
    stock: 20,
    threshold: 8,
    unitPrice: 1.5,
    unit: "份",
    icon: "🥥",
    color: "#F5DEB3",
    description: "椰香浓郁，清爽可口",
    defaultShelfLifeDays: 45,
    batches: [
      generateBatch("mat-10", 5, 45, 15, 12),
      generateBatch("mat-10", 40, 45, 10, 8),
    ],
  },
  {
    id: "mat-11",
    name: "白砂糖",
    category: "snack",
    stock: 100,
    threshold: 30,
    unitPrice: 0.2,
    unit: "包",
    icon: "🍬",
    color: "#FFFFFF",
    description: "独立小包装，方便卫生",
    defaultShelfLifeDays: 730,
    batches: [
      generateBatch("mat-11", 30, 730, 60, 55),
      generateBatch("mat-11", 100, 730, 50, 45),
    ],
  },
  {
    id: "mat-12",
    name: "黄油曲奇",
    category: "snack",
    stock: 3,
    threshold: 10,
    unitPrice: 3.0,
    unit: "块",
    icon: "🍪",
    color: "#D2691E",
    description: "酥脆香甜，下午茶伴侣",
    defaultShelfLifeDays: 60,
    batches: [
      generateBatch("mat-12", 55, 60, 5, 2),
      generateBatch("mat-12", 62, 60, 3, 1),
    ],
  },
];

const generateConsumptions = (): Consumption[] => {
  const consumptions: Consumption[] = [];
  const now = new Date();

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const consumptionsPerDay = isWeekend ? 2 : 5;

    for (let i = 0; i < consumptionsPerDay; i++) {
      const userIndex = Math.floor(Math.random() * mockUsers.length);
      const materialIndex = Math.floor(Math.random() * mockMaterials.length);
      const quantity = Math.random() > 0.8 ? 2 : 1;

      const hour = 9 + Math.floor(Math.random() * 9);
      const minute = Math.floor(Math.random() * 60);
      date.setHours(hour, minute, 0, 0);

      consumptions.push({
        id: generateId(),
        userId: mockUsers[userIndex].id,
        materialId: mockMaterials[materialIndex].id,
        quantity,
        timestamp: date.toISOString(),
      });
    }
  }

  return consumptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const mockConsumptions: Consumption[] = generateConsumptions();

const generateRestocks = (): Restock[] => {
  const restocks: Restock[] = [];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(10 + Math.floor(Math.random() * 4), 0, 0, 0);

    const materialIndex = Math.floor(Math.random() * mockMaterials.length);
    const material = mockMaterials[materialIndex];
    const quantity = 20 + Math.floor(Math.random() * 30);

    restocks.push({
      id: generateId(),
      materialId: material.id,
      quantity,
      operatorId: mockUsers[2].id,
      timestamp: date.toISOString(),
      cost: quantity * material.unitPrice * 0.8,
    });
  }

  return restocks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const mockRestocks: Restock[] = generateRestocks();

export const mockVote: Vote = {
  id: "vote-1",
  title: "下一批补货想喝什么？",
  description: "投票选择你最想补货的饮品，我们将根据投票结果采购！",
  endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockVoteOptions: VoteOption[] = [
  { id: "opt-1", voteId: "vote-1", name: "蓝山风味咖啡豆", icon: "🏔️", votes: 12 },
  { id: "opt-2", voteId: "vote-1", name: "抹茶拿铁粉", icon: "🍵", votes: 8 },
  { id: "opt-3", voteId: "vote-1", name: "伯爵红茶", icon: "🫖", votes: 6 },
  { id: "opt-4", voteId: "vote-1", name: "蜂蜜柚子茶", icon: "🍯", votes: 10 },
  { id: "opt-5", voteId: "vote-1", name: "杏仁奶", icon: "🥜", votes: 4 },
  { id: "opt-6", voteId: "vote-1", name: "可可粉", icon: "🍫", votes: 7 },
];

const generateVoteRecords = (): VoteRecord[] => {
  const records: VoteRecord[] = [];
  const votedUsers = mockUsers.slice(0, 6);

  votedUsers.forEach((user, index) => {
    const numOptions = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...mockVoteOptions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numOptions);

    const date = new Date(mockVote.createdAt);
    date.setHours(date.getHours() + index * 3);

    records.push({
      id: generateId(),
      voteId: mockVote.id,
      userId: user.id,
      optionIds: selected.map((o) => o.id),
      timestamp: date.toISOString(),
    });
  });

  return records;
};

export const mockVoteRecords: VoteRecord[] = generateVoteRecords();

const generateDutySchedule = (): DutySchedule[] => {
  const schedules: DutySchedule[] = [];
  const today = new Date();

  for (let week = -4; week < 5; week++) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() + week * 7);
    const startOfWeek = getStartOfWeek(weekStart);
    const endOfWeek = getEndOfWeek(weekStart);

    const userIndex = (week + 4 + 100) % mockUsers.length;

    schedules.push({
      id: `duty-${week}`,
      userId: mockUsers[userIndex].id,
      weekStart: formatDate(startOfWeek, "YYYY-MM-DD"),
      weekEnd: formatDate(endOfWeek, "YYYY-MM-DD"),
      isCurrent: week === 0,
      handoverCompleted: week < 0,
    });
  }

  return schedules;
};

export const mockDutySchedule: DutySchedule[] = generateDutySchedule();

export const getCurrentDutyUser = (): User | undefined => {
  const currentDuty = mockDutySchedule.find((d) => d.isCurrent);
  if (!currentDuty) return undefined;
  return mockUsers.find((u) => u.id === currentDuty.userId);
};
