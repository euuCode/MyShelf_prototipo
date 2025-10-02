import {
  AuthCredentials,
  AuthResponse,
  Book,
  DashboardData,
  ID,
  Recommendation,
  RegisterPayload,
  UserProfile,
  BookFilters,
  BookCreate,
  BookUpdate,
  UserProfileFull,
  HistoryEntry,
} from "@shared/api";

// UUID utility using Web Crypto when available
function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-expect-error randomUUID exists in modern browsers
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// localStorage keys
const LS_USERS = "myshelf.users";
const LS_SESSIONS = "myshelf.sessions"; // token -> userId
const LS_BOOKS = "myshelf.books"; // userId -> Book[]
const LS_WISHLIST = "myshelf.wishlist"; // userId -> Recommendation[]

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

type UsersMap = Record<
  string,
  UserProfile & {
    password: string;
    preferences?: {
      notifications: boolean;
      favoriteGenres: string[];
      reading: {
        light: "claro" | "escuro" | "sepia";
        fontFamily: "serif" | "sans" | "dyslexic";
        fontSize: number;
      };
    };
  }
>;
type SessionsMap = Record<string, ID>;
type BooksMap = Record<string, Book[]>;
type WishlistMap = Record<string, Recommendation[]>;
const LS_HISTORY = "myshelf.history"; // userId -> HistoryEntry[]

function seedIfEmpty() {
  const users = read<UsersMap>(LS_USERS, {});
  if (Object.keys(users).length === 0) {
    const id = uid();
    const user: UsersMap[string] = {
      id,
      name: "Usuário de Teste",
      email: "testeuna@gmail.com",
      phone: "",
      createdAt: new Date().toISOString(),
      password: "Unateste123@",
      preferences: {
        notifications: true,
        favoriteGenres: ["Ficção", "Tecnologia"],
        reading: { light: "claro", fontFamily: "serif", fontSize: 16 },
      },
    };
    users[id] = user;
    write(LS_USERS, users);

    const books: Book[] = [
      {
        id: uid(),
        title: "Clean Code",
        author: "Robert C. Martin",
        genre: "Tecnologia",
        coverUrl:
          "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F63541a2cdebc4d338e9a5c26a5be0648?format=webp&width=800",
        status: "reading",
        currentPage: 120,
        totalPages: 464,
        lastUpdatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: "O Pequeno Príncipe",
        author: "Antoine de Saint-Exupéry",
        genre: "Ficção",
        coverUrl:
          "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F60b0bbe7c8b04a36903bf90fc0f41ea8?format=webp&width=800",
        status: "completed",
        currentPage: 96,
        totalPages: 96,
        lastUpdatedAt: new Date().toISOString(),
      },
    ];

    const booksMap = read<BooksMap>(LS_BOOKS, {});
    booksMap[id] = books;
    write(LS_BOOKS, booksMap);

    const wishlistMap = read<WishlistMap>(LS_WISHLIST, {});
    wishlistMap[id] = [];
    write(LS_WISHLIST, wishlistMap);
  }
}
seedIfEmpty();

// Normalize covers for existing data
const COVER_MAP: Record<string, string> = {
  Sapiens:
    "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F28bdbd85bdfa4e9397c414000978e079?format=webp&width=800",
  "Clean Code":
    "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F63541a2cdebc4d338e9a5c26a5be0648?format=webp&width=800",
  "O Pequeno Príncipe":
    "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F60b0bbe7c8b04a36903bf90fc0f41ea8?format=webp&width=800",
  "Hábitos Atômicos":
    "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2Fbb6e9e87addf4dd9a0fcecf3c8498980?format=webp&width=800",
  "O Hobbit":
    "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F4e9c8248cb4c4d99a42e7717c6c3d8ea?format=webp&width=800",
};

(function upgradeCovers() {
  const booksMap = read<BooksMap>(LS_BOOKS, {});
  let changed = false;
  for (const [uid, list] of Object.entries(booksMap)) {
    const updated = (list || []).map((b) => {
      const url = COVER_MAP[b.title];
      if (url && b.coverUrl !== url) {
        changed = true;
        return { ...b, coverUrl: url } as Book;
      }
      return b;
    });
    booksMap[uid] = updated;
  }
  if (changed) write(LS_BOOKS, booksMap);
})();

function filterBooks(list: Book[], filters?: BookFilters) {
  let result = [...list];
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
    );
  }
  if (filters?.title)
    result = result.filter((b) =>
      b.title.toLowerCase().includes(filters.title!.toLowerCase()),
    );
  if (filters?.author)
    result = result.filter((b) =>
      b.author.toLowerCase().includes(filters.author!.toLowerCase()),
    );
  if (filters?.genre)
    result = result.filter(
      (b) => b.genre.toLowerCase() === filters.genre!.toLowerCase(),
    );
  if (filters?.sort === "alpha")
    result.sort((a, b) => a.title.localeCompare(b.title));
  if (filters?.sort === "date")
    result.sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
  return result;
}

export const MockApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const users = read<UsersMap>(LS_USERS, {});
    const exists = Object.values(users).some(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (exists) {
      throw new Error("E-mail já cadastrado");
    }
    // Password policy: at least 1 uppercase, 1 number and 1 special char
    const policy = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!policy.test(payload.password)) {
      throw new Error(
        "A senha deve ter letra maiúscula, número e caractere especial (mín. 8).",
      );
    }
    const id = uid();
    const user: UsersMap[string] = {
      id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      createdAt: new Date().toISOString(),
      password: payload.password,
    };
    users[id] = user;
    write(LS_USERS, users);

    const booksMap = read<BooksMap>(LS_BOOKS, {});
    booksMap[id] = [];
    write(LS_BOOKS, booksMap);

    const token = uid();
    const sessions = read<SessionsMap>(LS_SESSIONS, {});
    sessions[token] = id;
    write(LS_SESSIONS, sessions);
    return { user, token };
  },

  async login(creds: AuthCredentials): Promise<AuthResponse> {
    const users = read<UsersMap>(LS_USERS, {});
    const user = Object.values(users).find(
      (u) => u.email.toLowerCase() === creds.email.toLowerCase(),
    );
    if (!user || user.password !== creds.password) {
      throw new Error("Credenciais inválidas");
    }
    const token = uid();
    const sessions = read<SessionsMap>(LS_SESSIONS, {});
    sessions[token] = user.id;
    write(LS_SESSIONS, sessions);
    const { password, ...safe } = user;
    return { user: safe as UserProfile, token };
  },

  async getCurrentUser(token: string | null): Promise<UserProfile | null> {
    if (!token) return null;
    const sessions = read<SessionsMap>(LS_SESSIONS, {});
    const userId = sessions[token];
    if (!userId) return null;
    const users = read<UsersMap>(LS_USERS, {});
    const user = users[userId];
    if (!user) return null;
    const { password, ...safe } = user;
    return safe as UserProfile;
  },

  async getDashboard(userId: ID): Promise<DashboardData> {
    const booksMap = read<BooksMap>(LS_BOOKS, {});
    const list = booksMap[userId] || [];
    const totalBooks = list.length;
    const reading = list.filter((b) => b.status === "reading").length;
    const completed = list.filter((b) => b.status === "completed").length;
    const wishlistCount =
      read<WishlistMap>(LS_WISHLIST, {})[userId]?.length ?? 0;
    const progressSum = list.reduce((acc, b) => {
      if (!b.totalPages || !b.currentPage) return acc;
      return acc + Math.min(100, (b.currentPage / b.totalPages) * 100);
    }, 0);
    const overallProgressPct =
      totalBooks > 0 ? Math.round(progressSum / totalBooks) : 0;

    const suggestions: Recommendation[] = await MockApi.getRecommendations(
      userId,
      "quick",
    );

    const recentBooks = [...list]
      .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt))
      .slice(0, 4);

    return {
      summary: {
        totalBooks,
        reading,
        completed,
        wishlistCount,
        overallProgressPct,
      },
      suggestions,
      recentBooks,
    };
  },

  getRecommendations(_userId: ID): Recommendation[] {
    return [
      {
        id: uid(),
        title: "Hábitos Atômicos",
        author: "James Clear",
        genre: "Desenvolvimento Pessoal",
        coverUrl:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: uid(),
        title: "Sapiens",
        author: "Yuval Noah Harari",
        genre: "História",
        coverUrl:
          "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: uid(),
        title: "O Hobbit",
        author: "J. R. R. Tolkien",
        genre: "Fantasia",
        coverUrl:
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: uid(),
        title: "Mindset",
        author: "Carol S. Dweck",
        genre: "Psicologia",
        coverUrl:
          "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop",
      },
    ];
  },

  async addBook(userId: ID, book: BookCreate): Promise<Book> {
    const booksMap = read<BooksMap>(LS_BOOKS, {});
    const list = booksMap[userId] || [];
    const newBook: Book = {
      ...book,
      id: uid(),
      lastUpdatedAt: new Date().toISOString(),
    };
    list.unshift(newBook);
    booksMap[userId] = list;
    write(LS_BOOKS, booksMap);
    return newBook;
  },

  async listBooks(userId: ID, filters?: BookFilters): Promise<Book[]> {
    const booksMap = read<BooksMap>(LS_BOOKS, {});
    return filterBooks(booksMap[userId] || [], filters);
  },

  async updateBook(userId: ID, id: ID, patch: BookUpdate): Promise<Book> {
    const booksMap = read<BooksMap>(LS_BOOKS, {});
    const list = booksMap[userId] || [];
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Livro não encontrado");
    const updated: Book = {
      ...list[idx],
      ...patch,
      lastUpdatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    booksMap[userId] = list;
    write(LS_BOOKS, booksMap);
    return updated;
  },

  async deleteBook(userId: ID, id: ID): Promise<void> {
    const booksMap = read<BooksMap>(LS_BOOKS, {});
    booksMap[userId] = (booksMap[userId] || []).filter((b) => b.id !== id);
    write(LS_BOOKS, booksMap);
  },

  async setProgress(userId: ID, id: ID, currentPage: number): Promise<Book> {
    return this.updateBook(userId, id, { currentPage });
  },

  async addToWishlist(userId: ID, rec: Recommendation): Promise<void> {
    const wl = read<WishlistMap>(LS_WISHLIST, {});
    const list = wl[userId] || [];
    if (!list.find((r) => r.id === rec.id)) list.push(rec);
    wl[userId] = list;
    write(LS_WISHLIST, wl);
  },

  async getWishlist(userId: ID): Promise<Recommendation[]> {
    const wl = read<WishlistMap>(LS_WISHLIST, {});
    return wl[userId] || [];
  },

  async removeFromWishlist(userId: ID, recId: ID): Promise<void> {
    const wl = read<WishlistMap>(LS_WISHLIST, {});
    wl[userId] = (wl[userId] || []).filter((r) => r.id !== recId);
    write(LS_WISHLIST, wl);
  },

  async getRecommendations(
    userId: ID,
    type: "quick" | "personal" | "trending" = "quick",
    filters?: { genre?: string; author?: string },
  ): Promise<Recommendation[]> {
    const base = this.getRecommendationsBase(userId);
    let data = base;
    if (type === "personal") {
      const users = read<UsersMap>(LS_USERS, {});
      const prefs = users[userId]?.preferences?.favoriteGenres || [];
      data = base.filter((r) => prefs.length === 0 || prefs.includes(r.genre));
    } else if (type === "trending") {
      data = [...base].reverse();
    }
    if (filters?.genre) data = data.filter((r) => r.genre === filters.genre);
    if (filters?.author) data = data.filter((r) => r.author === filters.author);
    return data;
  },

  getRecommendationsBase(_userId: ID): Recommendation[] {
    return [
      {
        id: uid(),
        title: "Sapiens",
        author: "Yuval Noah Harari",
        genre: "História",
        coverUrl:
          "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F28bdbd85bdfa4e9397c414000978e079?format=webp&width=800",
      },
      {
        id: uid(),
        title: "Clean Code",
        author: "Robert C. Martin",
        genre: "Tecnologia",
        coverUrl:
          "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F63541a2cdebc4d338e9a5c26a5be0648?format=webp&width=800",
      },
      {
        id: uid(),
        title: "O Pequeno Príncipe",
        author: "Antoine de Saint-Exupéry",
        genre: "Ficção",
        coverUrl:
          "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F60b0bbe7c8b04a36903bf90fc0f41ea8?format=webp&width=800",
      },
      {
        id: uid(),
        title: "Hábitos Atômicos",
        author: "James Clear",
        genre: "Desenvolvimento Pessoal",
        coverUrl:
          "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2Fbb6e9e87addf4dd9a0fcecf3c8498980?format=webp&width=800",
      },
      {
        id: uid(),
        title: "O Hobbit",
        author: "J. R. R. Tolkien",
        genre: "Fantasia",
        coverUrl:
          "https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F4e9c8248cb4c4d99a42e7717c6c3d8ea?format=webp&width=800",
      },
    ];
  },

  async getProfile(userId: ID): Promise<UserProfileFull> {
    const users = read<UsersMap>(LS_USERS, {});
    const {
      password,
      preferences = {
        notifications: true,
        favoriteGenres: [],
        reading: { light: "claro", fontFamily: "serif", fontSize: 16 },
      },
      ...rest
    } = users[userId];
    const fullPrefs = {
      notifications: preferences.notifications ?? true,
      favoriteGenres: preferences.favoriteGenres ?? [],
      reading: preferences.reading ?? {
        light: "claro",
        fontFamily: "serif",
        fontSize: 16,
      },
    };
    return {
      ...(rest as UserProfile),
      preferences: fullPrefs,
    } as UserProfileFull;
  },

  async updateProfile(
    userId: ID,
    data: Partial<UserProfile> & {
      preferences?: Partial<UsersMap[string]["preferences"]>;
    },
  ): Promise<UserProfileFull> {
    const users = read<UsersMap>(LS_USERS, {});
    const current = users[userId];
    const mergedPrefs = {
      notifications:
        data.preferences?.notifications ??
        current.preferences?.notifications ??
        true,
      favoriteGenres:
        data.preferences?.favoriteGenres ??
        current.preferences?.favoriteGenres ??
        [],
      reading: {
        ...(current.preferences?.reading ?? {
          light: "claro",
          fontFamily: "serif",
          fontSize: 16,
        }),
        ...(data.preferences?.reading ?? {}),
      },
    };
    users[userId] = {
      ...current,
      ...data,
      preferences: mergedPrefs,
    } as UsersMap[string];
    write(LS_USERS, users);
    return this.getProfile(userId);
  },

  async changePassword(
    userId: ID,
    current: string,
    next: string,
  ): Promise<void> {
    const users = read<UsersMap>(LS_USERS, {});
    const user = users[userId];
    if (!user || user.password !== current)
      throw new Error("Senha atual incorreta");
    const policy = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!policy.test(next)) throw new Error("Nova senha não atende à política");
    user.password = next;
    write(LS_USERS, users);
  },

  async getHistory(userId: ID): Promise<HistoryEntry[]> {
    const map = read<Record<string, HistoryEntry[]>>(LS_HISTORY, {});
    return map[userId] || [];
  },

  async pushHistory(userId: ID, entry: HistoryEntry): Promise<void> {
    const map = read<Record<string, HistoryEntry[]>>(LS_HISTORY, {});
    const list = map[userId] || [];
    list.unshift(entry);
    map[userId] = list;
    write(LS_HISTORY, map);
  },

  async deleteAccount(userId: ID): Promise<void> {
    const users = read<UsersMap>(LS_USERS, {});
    delete users[userId];
    write(LS_USERS, users);
    const books = read<BooksMap>(LS_BOOKS, {});
    delete books[userId];
    write(LS_BOOKS, books);
    const wl = read<WishlistMap>(LS_WISHLIST, {});
    delete wl[userId];
    write(LS_WISHLIST, wl);
    const hist = read<Record<string, HistoryEntry[]>>(LS_HISTORY, {});
    delete hist[userId];
    write(LS_HISTORY, hist);
    // remove sessions of this user
    const sessions = read<SessionsMap>(LS_SESSIONS, {});
    for (const [t, uid] of Object.entries(sessions))
      if (uid === userId) delete sessions[t];
    write(LS_SESSIONS, sessions);
  },
};
