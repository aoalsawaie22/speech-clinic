// Minimal raw fetch helpers for the new endpoints (notifications, achievements, messages, reports).
// The auto-generated react-query client handles the rest.

const BASE = "/api";

async function http<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Notifications
export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  type: "info" | "success" | "warning" | "appointment" | "session" | "achievement" | "message";
  link: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: (userId: number) => http<AppNotification[]>(`/notifications/${userId}`),
  markRead: (id: number) => http(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: (userId: number) => http(`/notifications/user/${userId}/read-all`, { method: "PATCH" }),
  remove: (id: number) => http(`/notifications/${id}`, { method: "DELETE" }),
  create: (data: { userId: number; title: string; titleEn?: string; message: string; messageEn?: string; type?: string; link?: string }) =>
    http<AppNotification>("/notifications", { method: "POST", body: JSON.stringify(data) }),
};

// Achievements
export interface Achievement {
  id: number;
  code: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  emoji: string;
  points: number;
  threshold: number;
  category: "sessions" | "exercises" | "streak" | "score" | "special";
  earnedAt?: string;
}

export interface ChildAchievementsResp {
  earned: Achievement[];
  available: Achievement[];
  totalEarned: number;
  totalAvailable: number;
  totalPoints: number;
}

export const achievementsApi = {
  childAchievements: (childId: number) => http<ChildAchievementsResp>(`/achievements/child/${childId}`),
  award: (childId: number, code: string) =>
    http<{ alreadyEarned: boolean; achievement: Achievement }>(`/achievements/child/${childId}/award/${code}`, { method: "POST" }),
  check: (childId: number) => http<{ newlyEarned: Achievement[] }>(`/achievements/check/${childId}`, { method: "POST" }),
};

// Messages
export interface MessageItem {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  read: boolean;
  createdAt: string;
  isMine: boolean;
}

export interface Conversation {
  otherUserId: number;
  otherUserName: string;
  otherUserRole: string;
  lastMessage: string;
  lastDate: string;
  unreadCount: number;
  messages: MessageItem[];
}

export const messagesApi = {
  conversations: (userId: number) => http<Conversation[]>(`/messages/${userId}`),
  send: (data: { fromUserId: number; toUserId: number; content: string }) =>
    http<MessageItem>("/messages", { method: "POST", body: JSON.stringify(data) }),
  markRead: (userId: number, otherId: number) =>
    http(`/messages/conversation/${userId}/${otherId}/read`, { method: "PATCH" }),
  unreadCount: (userId: number) => http<{ count: number }>(`/messages/unread-count/${userId}`),
};

// Reports
export interface SessionsTrendItem { date: string; sessions: number; avgScore: number }
export interface CategoryItem { category: string; completed: number; total: number; avgScore: number }
export interface AppointmentStatusItem { status: string; count: number }
export interface TopChild { id: number; name: string; age: number; progressLevel: number; totalSessions: number }

export const reportsApi = {
  sessionsTrend: (params: { specialistId?: number; childId?: number; days?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.specialistId) q.set("specialistId", String(params.specialistId));
    if (params.childId) q.set("childId", String(params.childId));
    if (params.days) q.set("days", String(params.days));
    const s = q.toString();
    return http<SessionsTrendItem[]>(`/reports/sessions-trend${s ? `?${s}` : ""}`);
  },
  categories: (childId?: number) => {
    const q = childId ? `?childId=${childId}` : "";
    return http<CategoryItem[]>(`/reports/categories${q}`);
  },
  appointmentsStatus: (specialistId?: number) => {
    const q = specialistId ? `?specialistId=${specialistId}` : "";
    return http<AppointmentStatusItem[]>(`/reports/appointments-status${q}`);
  },
  topChildren: (specialistId?: number) => {
    const q = specialistId ? `?specialistId=${specialistId}` : "";
    return http<TopChild[]>(`/reports/top-children${q}`);
  },
};
