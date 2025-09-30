import {
  AuthCredentials,
  AuthResponse,
  Book,
  DashboardData,
  ID,
  Recommendation,
  RegisterPayload,
  UserProfile,
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

type UsersMap = Record<string, UserProfile & { password: string }>;
type SessionsMap = Record<string, ID>;
type BooksMap = Record<string, Book[]>;
type WishlistMap = Record<string, Recommendation[]>;

function seedIfEmpty() {
  const users = read<UsersMap>(LS_USERS, {});
  if (Object.keys(users).length === 0) {
    const id = uid();
    const user: UserProfile & { password: string } = {
      id,
      name: "Demo User",
      email: "demo@myshelf.app",
      phone: "",
      createdAt: new Date().toISOString(),
      password: "demo1234",
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
          "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop",
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
          "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop",
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

export const MockApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const users = read<UsersMap>(LS_USERS, {});
    const exists = Object.values(users).some(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (exists) {
      throw new Error("E-mail já cadastrado");
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
    const wishlistCount = read<WishlistMap>(LS_WISHLIST, {})[userId]?.length ?? 0;
    const progressSum = list.reduce((acc, b) => {
      if (!b.totalPages || !b.currentPage) return acc;
      return acc + Math.min(100, (b.currentPage / b.totalPages) * 100);
    }, 0);
    const overallProgressPct = totalBooks > 0 ? Math.round(progressSum / totalBooks) : 0;

    const suggestions: Recommendation[] = MockApi.getRecommendations(userId);

    const recentBooks = [...list]
      .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt))
      .slice(0, 4);

    return {
      summary: { totalBooks, reading, completed, wishlistCount, overallProgressPct },
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

  async addBook(userId: ID, book: Omit<Book, "id" | "lastUpdatedAt">): Promise<Book> {
    const booksMap = read<BooksMap>(LS_BOOKS, {});
    const list = booksMap[userId] || [];
    const newBook: Book = { ...book, id: uid(), lastUpdatedAt: new Date().toISOString() };
    list.unshift(newBook);
    booksMap[userId] = list;
    write(LS_BOOKS, booksMap);
    return newBook;
  },
};
