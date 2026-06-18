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
  CheckInRecord,
  Announcement,
  DrinkRecipe,
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
  { id: "user-1", name: "张小明", avatar: getAvatar("张", 0), role: "user", joinDate: "2024-01-15", monthlyBudget: 200, status: "active" },
  { id: "user-2", name: "李小红", avatar: getAvatar("李", 1), role: "user", joinDate: "2024-02-01", monthlyBudget: 200, status: "active" },
  { id: "user-3", name: "王小华", avatar: getAvatar("王", 2), role: "admin", joinDate: "2023-12-01", monthlyBudget: 300, status: "active" },
  { id: "user-4", name: "赵小刚", avatar: getAvatar("赵", 3), role: "user", joinDate: "2024-03-10", monthlyBudget: 200, status: "active" },
  { id: "user-5", name: "陈小美", avatar: getAvatar("陈", 4), role: "user", joinDate: "2024-01-20", monthlyBudget: 200, status: "active" },
  { id: "user-6", name: "刘大勇", avatar: getAvatar("刘", 5), role: "user", joinDate: "2024-02-15", monthlyBudget: 250, status: "active" },
  { id: "user-7", name: "周小芳", avatar: getAvatar("周", 6), role: "user", joinDate: "2024-04-01", monthlyBudget: 200, status: "active" },
  { id: "user-8", name: "吴小伟", avatar: getAvatar("吴", 7), role: "user", joinDate: "2024-03-20", monthlyBudget: 200, status: "active" },
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

  for (let day = 89; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const monthMultiplier = day < 30 ? 1 : day < 60 ? 0.9 : 0.8;
    const baseConsumptions = isWeekend ? 2 : 5;
    const consumptionsPerDay = Math.floor(baseConsumptions * monthMultiplier);

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

const generateAnnouncements = (): Announcement[] => {
  const now = new Date();
  const adminUserId = mockUsers[2].id;

  return [
    {
      id: "ann-1",
      title: "新豆子到货！埃塞俄比亚耶加雪菲已上架",
      content: "大家好，新一批埃塞俄比亚耶加雪菲咖啡豆已经到货啦！这款豆子带有柑橘和花香的风味，口感清爽明亮，欢迎大家来品尝~ 数量有限，先到先得哦！",
      type: "stock",
      isPinned: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: adminUserId,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      viewCount: 24,
    },
    {
      id: "ann-2",
      title: "咖啡机维护通知",
      content: "本周六（6月20日）上午10:00-12:00将对咖啡机进行例行维护保养，届时咖啡机将暂停使用。请大家提前安排好时间，给您带来的不便敬请谅解。",
      type: "maintenance",
      isPinned: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: adminUserId,
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      viewCount: 42,
    },
    {
      id: "ann-3",
      title: "端午节放假通知",
      content: "根据国家法定节假日安排，6月22日（端午节）茶水间将暂停开放一天。请大家提前做好准备，祝大家节日快乐！",
      type: "holiday",
      isPinned: false,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: adminUserId,
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      viewCount: 56,
    },
    {
      id: "ann-4",
      title: "牛奶库存告急",
      content: "鲜牛奶库存即将耗尽，预计今天下午会有新的配送。如果需要加奶的同事请稍等，或者可以选择燕麦奶/椰奶代替。感谢理解！",
      type: "stock",
      isPinned: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: adminUserId,
      expiresAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "expired",
      viewCount: 31,
    },
    {
      id: "ann-5",
      title: "欢迎新同事加入！",
      content: "欢迎新同事加入我们的咖啡角大家庭！大家可以在首页浏览各种饮品，按需取用。如有任何问题，随时找管理员咨询~",
      type: "general",
      isPinned: false,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: adminUserId,
      expiresAt: undefined,
      status: "archived",
      viewCount: 67,
    },
  ];
};

export const mockAnnouncements: Announcement[] = generateAnnouncements();

const generateCheckIns = (): CheckInRecord[] => {
  const checkIns: CheckInRecord[] = [];
  const now = new Date();

  mockUsers.forEach((user) => {
    const streakDays = Math.floor(Math.random() * 15) + 1;
    const hasBreak = Math.random() > 0.5;

    for (let day = 29; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      let shouldCheckIn = false;
      if (day < streakDays) {
        shouldCheckIn = true;
      } else if (hasBreak && day >= streakDays && day < streakDays + 3) {
        shouldCheckIn = false;
      } else {
        shouldCheckIn = Math.random() > 0.35;
      }

      if (shouldCheckIn) {
        const hour = 8 + Math.floor(Math.random() * 10);
        const minute = Math.floor(Math.random() * 60);
        date.setHours(hour, minute, 0, 0);

        checkIns.push({
          id: generateId(),
          userId: user.id,
          date: formatDate(date, "YYYY-MM-DD"),
          timestamp: date.toISOString(),
        });
      }
    }
  });

  return checkIns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const mockCheckIns: CheckInRecord[] = generateCheckIns();

export const mockDrinkRecipes: DrinkRecipe[] = [
  {
    id: "recipe-1",
    name: "冰美式",
    icon: "🧊",
    color: "#3D2B1F",
    description: "经典清爽，唤醒活力的一天",
    difficulty: "easy",
    prepTime: 2,
    ingredients: [
      { materialId: "mat-1", materialName: "意式拼配咖啡豆", quantity: 2, unit: "杯" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 1, unit: "包" },
    ],
    steps: [
      "在杯中加入适量冰块",
      "萃取 2 份意式浓缩咖啡",
      "将浓缩咖啡倒入冰块上",
      "根据个人口味加入适量糖包，搅拌均匀即可享用",
    ],
    tags: ["经典", "提神", "低卡"],
  },
  {
    id: "recipe-2",
    name: "桂花拿铁",
    icon: "🌸",
    color: "#E67E22",
    description: "桂花香浓，秋日限定暖心饮品",
    difficulty: "medium",
    prepTime: 5,
    ingredients: [
      { materialId: "mat-1", materialName: "意式拼配咖啡豆", quantity: 1, unit: "杯" },
      { materialId: "mat-6", materialName: "桂花乌龙茶", quantity: 1, unit: "包" },
      { materialId: "mat-8", materialName: "鲜牛奶", quantity: 2, unit: "份" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 1, unit: "包" },
    ],
    steps: [
      "用热水冲泡桂花乌龙茶包，浸泡 3 分钟后取出茶包",
      "萃取 1 份意式浓缩咖啡",
      "将鲜牛奶加热并打发成奶泡",
      "在杯中依次加入桂花茶、浓缩咖啡",
      "缓缓倒入加热的牛奶和奶泡",
      "加入糖包搅拌均匀，表面可撒少许干桂花装饰",
    ],
    tags: ["花香", "暖心", "秋冬"],
  },
  {
    id: "recipe-3",
    name: "抹茶牛奶",
    icon: "🍵",
    color: "#88B04B",
    description: "日式抹茶与香浓牛奶的完美融合",
    difficulty: "easy",
    prepTime: 3,
    ingredients: [
      { materialId: "mat-4", materialName: "龙井绿茶", quantity: 1, unit: "包" },
      { materialId: "mat-8", materialName: "鲜牛奶", quantity: 2, unit: "份" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 2, unit: "包" },
    ],
    steps: [
      "用少量热水冲泡绿茶包，制成浓茶汁",
      "将鲜牛奶加热至温热",
      "在杯中倒入绿茶汁，加入糖包搅拌至融化",
      "缓缓倒入加热的牛奶",
      "用勺子轻轻搅拌形成渐变效果即可",
    ],
    tags: ["日式", "清新", "无咖啡"],
  },
  {
    id: "recipe-4",
    name: "燕麦拿铁",
    icon: "🌾",
    color: "#D4A574",
    description: "植物基健康选择，乳糖不耐友好",
    difficulty: "easy",
    prepTime: 3,
    ingredients: [
      { materialId: "mat-1", materialName: "意式拼配咖啡豆", quantity: 1, unit: "杯" },
      { materialId: "mat-9", materialName: "燕麦奶", quantity: 2, unit: "份" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 1, unit: "包" },
    ],
    steps: [
      "萃取 1 份意式浓缩咖啡",
      "将燕麦奶加热并稍微打发",
      "在杯中倒入浓缩咖啡",
      "加入糖包搅拌均匀",
      "缓缓倒入加热的燕麦奶即可",
    ],
    tags: ["植物基", "健康", "乳糖不耐"],
  },
  {
    id: "recipe-5",
    name: "椰香红茶",
    icon: "🥥",
    color: "#C0392B",
    description: "热带风情，椰香与红茶的奇妙邂逅",
    difficulty: "easy",
    prepTime: 4,
    ingredients: [
      { materialId: "mat-5", materialName: "正山小种红茶", quantity: 1, unit: "包" },
      { materialId: "mat-10", materialName: "椰奶", quantity: 2, unit: "份" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 1, unit: "包" },
    ],
    steps: [
      "用热水冲泡红茶包，浸泡 3-4 分钟至颜色浓郁",
      "取出茶包，加入糖包搅拌融化",
      "椰奶稍微加热",
      "将椰奶缓缓倒入红茶中",
      "轻轻搅拌即可享用，也可加入冰块做成冰饮",
    ],
    tags: ["热带", "下午茶", "无咖啡"],
  },
  {
    id: "recipe-6",
    name: "洋甘菊特调",
    icon: "🌼",
    color: "#F1C40F",
    description: "舒缓安神，工作间隙的放松时刻",
    difficulty: "easy",
    prepTime: 4,
    ingredients: [
      { materialId: "mat-7", materialName: "洋甘菊茶", quantity: 1, unit: "包" },
      { materialId: "mat-8", materialName: "鲜牛奶", quantity: 1, unit: "份" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 1, unit: "包" },
    ],
    steps: [
      "用热水冲泡洋甘菊茶包，浸泡 4 分钟",
      "取出茶包，加入糖包搅拌均匀",
      "将鲜牛奶加热",
      "将热牛奶缓缓倒入茶中",
      "搅拌均匀，静心享用这杯放松饮品",
    ],
    tags: ["舒缓", "安神", "晚间友好"],
  },
  {
    id: "recipe-7",
    name: "低因椰香拿铁",
    icon: "🌙",
    color: "#A67C52",
    description: "无咖啡因也能享受的香醇咖啡味",
    difficulty: "medium",
    prepTime: 5,
    ingredients: [
      { materialId: "mat-3", materialName: "低因咖啡豆", quantity: 1, unit: "杯" },
      { materialId: "mat-10", materialName: "椰奶", quantity: 2, unit: "份" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 1, unit: "包" },
    ],
    steps: [
      "萃取 1 份低因浓缩咖啡",
      "将椰奶加热并打发成细腻奶泡",
      "在杯中倒入浓缩咖啡",
      "加入糖包搅拌至融化",
      "缓缓倒入椰奶和奶泡，享受无咖啡因的咖啡时光",
    ],
    tags: ["低因", "椰香", "晚间友好"],
  },
  {
    id: "recipe-8",
    name: "单品手冲风格",
    icon: "🫘",
    color: "#8B6340",
    description: "品味埃塞俄比亚的果酸花香",
    difficulty: "hard",
    prepTime: 6,
    ingredients: [
      { materialId: "mat-2", materialName: "埃塞俄比亚单品豆", quantity: 2, unit: "杯" },
      { materialId: "mat-11", materialName: "白砂糖", quantity: 1, unit: "包" },
    ],
    steps: [
      "将埃塞俄比亚咖啡豆研磨成中粗粒度（类似粗砂糖）",
      "用约 92°C 的热水先润湿咖啡粉，静置 30 秒焖蒸",
      "分 3 次缓慢注入热水，总萃取时间约 2-3 分钟",
      "萃取完成后根据口味加入适量糖",
      "细细品味柑橘和花香的层次感",
    ],
    tags: ["精品", "手冲", "品鉴"],
  },
];
