import { create } from "zustand";
import type {
  Message,
  MessageType,
  MessageSortBy,
  MessageReply,
  WeeklyKeywordSummary,
} from "../types";
import { storage } from "../utils/storage";
import { generateId, getStartOfWeek, getEndOfWeek } from "../utils/date";
import { mockUsers } from "../data/mockData";

const STOP_WORDS = new Set([
  "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去",
  "你", "会", "着", "没有", "看", "好", "自己", "这", "那", "啊", "哦", "嗯", "呀", "呢", "吧", "吗",
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "can", "need", "dare", "ought", "used",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into",
  "through", "during", "before", "after", "above", "below", "between",
  "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
  "not", "only", "own", "same", "than", "too", "very", "just",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "her", "its", "our", "their", "this", "that", "these", "those",
]);

const generateMockMessages = (): Message[] => {
  const now = new Date();
  const users = mockUsers;

  const mockContents: { type: MessageType; content: string; daysAgo: number }[] = [
    { type: "suggestion", content: "希望能增加一些无咖啡因的饮品选项，比如花草茶或者脱因咖啡，让晚上也能放心喝", daysAgo: 0 },
    { type: "thanks", content: "感谢采购负责人这周补充了燕麦奶，做燕麦拿铁太好喝了！", daysAgo: 1 },
    { type: "complaint", content: "咖啡机最近出水有点慢，不知道是不是需要清洗了？", daysAgo: 1 },
    { type: "suggestion", content: "建议在茶水间放一个小冰箱，夏天可以冰一些饮料和水果", daysAgo: 2 },
    { type: "thanks", content: "今天的咖啡豆很香，是新买的吗？口感特别好！", daysAgo: 2 },
    { type: "complaint", content: "昨天用完的杯子没人洗，都堆在水槽里了，希望大家用完能顺手洗一下", daysAgo: 3 },
    { type: "suggestion", content: "能不能增加一些健康零食？比如坚果、水果干之类的", daysAgo: 3 },
    { type: "thanks", content: "看到茶水间新增了蜂蜜和柠檬，太贴心了！喝柠檬水很方便", daysAgo: 4 },
    { type: "complaint", content: "空调温度有点低，泡茶一会儿就凉了，能不能放个保温垫？", daysAgo: 5 },
    { type: "suggestion", content: "建议定期组织咖啡品鉴活动，大家可以一起交流冲煮技巧", daysAgo: 6 },
    { type: "thanks", content: "感谢上周采购的抹茶粉，做抹茶拿铁超赞！", daysAgo: 7 },
    { type: "suggestion", content: "希望能提供可重复使用的吸管，减少塑料浪费", daysAgo: 8 },
  ];

  const messages: Message[] = mockContents.map((item, index) => {
    const isAnonymous = index % 3 === 0;
    const user = users[index % users.length];
    const createdAt = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 8 * 60 * 60 * 1000);

    return {
      id: generateId(),
      type: item.type,
      content: item.content,
      isAnonymous,
      userId: isAnonymous ? undefined : user.id,
      userName: isAnonymous ? undefined : user.name,
      userAvatar: isAnonymous ? undefined : user.avatar,
      likes: users.slice(0, Math.floor(Math.random() * 5)).map((u) => u.id),
      isPinned: index === 0,
      createdAt: createdAt.toISOString(),
      reply: index === 0 ? {
        id: generateId(),
        messageId: "",
        content: "感谢您的建议！我们已经在考虑采购脱因咖啡豆和更多花草茶选项，预计下周就能上架~",
        adminId: users[2].id,
        adminName: users[2].name,
        createdAt: new Date(now.getTime() - (item.daysAgo - 0.5) * 24 * 60 * 60 * 1000).toISOString(),
      } : undefined,
    };
  });

  return messages.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

const extractKeywords = (text: string): string[] => {
  const cleanText = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ");

  const words: string[] = [];

  const chineseChars = cleanText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  words.push(...chineseChars);

  const englishWords = cleanText.match(/[a-zA-Z]{3,}/g) || [];
  words.push(...englishWords);

  return words.filter((word) => !STOP_WORDS.has(word) && word.length >= 2);
};

const generateWeeklySummary = (
  messages: Message[],
  weekStart: Date,
  weekEnd: Date
): WeeklyKeywordSummary | null => {
  const weekMessages = messages.filter((m) => {
    const date = new Date(m.createdAt);
    return date >= weekStart && date <= weekEnd;
  });

  if (weekMessages.length === 0) return null;

  const keywordCount: Record<string, number> = {};
  weekMessages.forEach((message) => {
    const keywords = extractKeywords(message.content);
    keywords.forEach((word) => {
      keywordCount[word] = (keywordCount[word] || 0) + 1;
    });
  });

  const keywords = Object.entries(keywordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topMessages = [...weekMessages]
    .sort((a, b) => b.likes.length - a.likes.length)
    .slice(0, 3)
    .map((m) => ({
      messageId: m.id,
      content: m.content.length > 50 ? m.content.slice(0, 50) + "..." : m.content,
      likes: m.likes.length,
    }));

  return {
    id: generateId(),
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    keywords,
    topMessages,
    totalMessages: weekMessages.length,
    generatedAt: new Date().toISOString(),
    viewedByAdmin: false,
  };
};

interface MessageBoardState {
  messages: Message[];
  weeklySummaries: WeeklyKeywordSummary[];
  lastSummaryWeek: string | null;

  addMessage: (
    type: MessageType,
    content: string,
    isAnonymous: boolean,
    userId?: string,
    userName?: string,
    userAvatar?: string
  ) => string;

  toggleLike: (messageId: string, userId: string) => void;
  hasUserLiked: (messageId: string, userId: string) => boolean;

  pinMessage: (messageId: string) => void;
  unpinMessage: (messageId: string) => void;

  replyToMessage: (
    messageId: string,
    content: string,
    adminId: string,
    adminName: string
  ) => void;

  deleteMessage: (messageId: string) => void;

  getMessages: (sortBy: MessageSortBy, filterType?: MessageType | "all") => Message[];
  getPinnedMessages: () => Message[];
  getMessageById: (id: string) => Message | undefined;

  getWeeklySummary: (date?: Date) => WeeklyKeywordSummary | null;
  getUnviewedSummaryCount: () => number;
  markSummaryAsViewed: (summaryId: string) => void;

  checkAndGenerateWeeklySummary: () => WeeklyKeywordSummary | null;

  initMessageBoard: () => void;
}

export const useMessageBoardStore = create<MessageBoardState>((set, get) => ({
  messages: [],
  weeklySummaries: [],
  lastSummaryWeek: null,

  addMessage: (type, content, isAnonymous, userId, userName, userAvatar) => {
    const newMessage: Message = {
      id: generateId(),
      type,
      content,
      isAnonymous,
      userId: isAnonymous ? undefined : userId,
      userName: isAnonymous ? undefined : userName,
      userAvatar: isAnonymous ? undefined : userAvatar,
      likes: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newMessage, ...get().messages];
    set({ messages: updated });
    storage.set("messages", updated);
    return newMessage.id;
  },

  toggleLike: (messageId, userId) => {
    const updated = get().messages.map((m) => {
      if (m.id !== messageId) return m;
      const hasLiked = m.likes.includes(userId);
      return {
        ...m,
        likes: hasLiked ? m.likes.filter((id) => id !== userId) : [...m.likes, userId],
      };
    });
    set({ messages: updated });
    storage.set("messages", updated);
  },

  hasUserLiked: (messageId, userId) => {
    const message = get().messages.find((m) => m.id === messageId);
    return message ? message.likes.includes(userId) : false;
  },

  pinMessage: (messageId) => {
    const updated = get().messages.map((m) =>
      m.id === messageId ? { ...m, isPinned: true } : m
    );
    set({ messages: updated });
    storage.set("messages", updated);
  },

  unpinMessage: (messageId) => {
    const updated = get().messages.map((m) =>
      m.id === messageId ? { ...m, isPinned: false } : m
    );
    set({ messages: updated });
    storage.set("messages", updated);
  },

  replyToMessage: (messageId, content, adminId, adminName) => {
    const reply: MessageReply = {
      id: generateId(),
      messageId,
      content,
      adminId,
      adminName,
      createdAt: new Date().toISOString(),
    };

    const updated = get().messages.map((m) =>
      m.id === messageId ? { ...m, reply } : m
    );
    set({ messages: updated });
    storage.set("messages", updated);
  },

  deleteMessage: (messageId) => {
    const updated = get().messages.filter((m) => m.id !== messageId);
    set({ messages: updated });
    storage.set("messages", updated);
  },

  getMessages: (sortBy, filterType = "all") => {
    let result = [...get().messages];

    if (filterType !== "all") {
      result = result.filter((m) => m.type === filterType);
    }

    const pinned = result.filter((m) => m.isPinned);
    const unpinned = result.filter((m) => !m.isPinned);

    if (sortBy === "latest") {
      unpinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "popular") {
      unpinned.sort((a, b) => b.likes.length - a.likes.length);
    } else if (sortBy === "oldest") {
      unpinned.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return [...pinned, ...unpinned];
  },

  getPinnedMessages: () => {
    return get().messages.filter((m) => m.isPinned);
  },

  getMessageById: (id) => {
    return get().messages.find((m) => m.id === id);
  },

  getWeeklySummary: (date = new Date()) => {
    const weekStart = getStartOfWeek(date);
    const weekEnd = getEndOfWeek(date);
    const weekKey = `${weekStart.toISOString()}_${weekEnd.toISOString()}`;

    const existing = get().weeklySummaries.find((s) => {
      const sWeekStart = getStartOfWeek(new Date(s.weekStart));
      const sWeekEnd = getEndOfWeek(new Date(s.weekEnd));
      const sWeekKey = `${sWeekStart.toISOString()}_${sWeekEnd.toISOString()}`;
      return sWeekKey === weekKey;
    });

    if (existing) return existing;

    const summary = generateWeeklySummary(get().messages, weekStart, weekEnd);
    if (summary) {
      const updated = [...get().weeklySummaries, summary];
      set({ weeklySummaries: updated });
      storage.set("weeklySummaries", updated);
      return summary;
    }

    return null;
  },

  getUnviewedSummaryCount: () => {
    return get().weeklySummaries.filter((s) => !s.viewedByAdmin).length;
  },

  markSummaryAsViewed: (summaryId) => {
    const updated = get().weeklySummaries.map((s) =>
      s.id === summaryId ? { ...s, viewedByAdmin: true } : s
    );
    set({ weeklySummaries: updated });
    storage.set("weeklySummaries", updated);
  },

  checkAndGenerateWeeklySummary: () => {
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekKey = weekStart.toISOString();

    if (get().lastSummaryWeek === weekKey) return null;

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

    const summary = generateWeeklySummary(get().messages, prevWeekStart, prevWeekEnd);

    if (summary) {
      const updated = [...get().weeklySummaries, summary];
      set({
        weeklySummaries: updated,
        lastSummaryWeek: weekKey,
      });
      storage.set("weeklySummaries", updated);
      storage.set("lastSummaryWeek", weekKey);
      return summary;
    }

    set({ lastSummaryWeek: weekKey });
    storage.set("lastSummaryWeek", weekKey);
    return null;
  },

  initMessageBoard: () => {
    const savedMessages = storage.get<Message[] | null>("messages", null);
    const savedSummaries = storage.get<WeeklyKeywordSummary[] | null>("weeklySummaries", null);
    const savedLastWeek = storage.get<string | null>("lastSummaryWeek", null);

    if (savedMessages) {
      set({
        messages: savedMessages,
        weeklySummaries: savedSummaries || [],
        lastSummaryWeek: savedLastWeek,
      });
    } else {
      const mockMessages = generateMockMessages();
      const mockSummaries: WeeklyKeywordSummary[] = [];

      for (let i = 0; i < 2; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const summary = generateWeeklySummary(mockMessages, weekStart, weekEnd);
        if (summary) {
          mockSummaries.push({ ...summary, viewedByAdmin: i > 0 });
        }
      }

      set({
        messages: mockMessages,
        weeklySummaries: mockSummaries,
        lastSummaryWeek: savedLastWeek,
      });
      storage.set("messages", mockMessages);
      storage.set("weeklySummaries", mockSummaries);
    }

    setTimeout(() => {
      get().checkAndGenerateWeeklySummary();
    }, 200);
  },
}));
