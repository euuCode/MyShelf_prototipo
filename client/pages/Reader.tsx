import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { MockApi } from "@/mocks/api";
import type { Book, ReadingState, Bookmark } from "@shared/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function Reader() {
  return (
    <ProtectedRoute>
      <ReaderInner />
    </ProtectedRoute>
  );
}

// Deterministic pseudo-random generator based on string seed
function seedRand(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Chapter = { title: string; pages: number };

function generateChapters(book: Book): Chapter[] {
  const rand = seedRand(book.id + book.title);
  const words = book.title.split(/\s+/).filter(Boolean);
  const chaptersCount = 8 + Math.floor(rand() * 5); // 8..12
  const chapters: Chapter[] = [];
  for (let i = 0; i < chaptersCount; i++) {
    const w1 = words[i % words.length] || "Capítulo";
    const w2 = words[(i + 1) % words.length] || "Extra";
    const pages = 8 + Math.floor(rand() * 13); // 8..20
    chapters.push({ title: `${i + 1}. ${w1} ${w2}`.trim(), pages });
  }
  return chapters;
}

function totalPages(chs: Chapter[]) {
  return chs.reduce((a, c) => a + c.pages, 0);
}

function linearIndex(chs: Chapter[], chapterIndex: number, pageIndex: number) {
  let sum = 0;
  for (let i = 0; i < chapterIndex; i++) sum += chs[i].pages;
  return sum + pageIndex;
}

function formatPage(ch: number, pg: number) {
  return `Capítulo ${ch + 1} — Página ${pg + 1}`;
}

function ReaderInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [state, setState] = useState<ReadingState>({ chapterIndex: 0, pageIndex: 0, bookmarks: [] });
  const [loading, setLoading] = useState(true);

  const chapters = useMemo(() => (book ? generateChapters(book) : []), [book]);
  const pagesTotal = useMemo(() => totalPages(chapters), [chapters]);

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      const list = await MockApi.listBooks(user.id);
      const found = list.find((b) => b.id === id) || null;
      setBook(found);
      const st = await MockApi.getReadingState(user.id, id);
      setState(st as ReadingState);
      setLoading(false);
      if (found) {
        // keep overall progress synced
        const chs = generateChapters(found);
        const current = linearIndex(chs, st.chapterIndex, st.pageIndex);
        const total = totalPages(chs);
        await MockApi.updateBook(user.id, found.id, { totalPages: total, currentPage: current });
      }
    })();
  }, [user, id]);

  useEffect(() => {
    // sync progress on state changes
    (async () => {
      if (!user || !book) return;
      await MockApi.setReadingPosition(user.id, book.id, state.chapterIndex, state.pageIndex);
      const current = linearIndex(chapters, state.chapterIndex, state.pageIndex);
      await MockApi.updateBook(user.id, book.id, { totalPages: pagesTotal || 0, currentPage: current });
    })();
  }, [state.chapterIndex, state.pageIndex]);

  if (!user) return null;
  if (loading) return <div className="container pt-24 pb-10">Carregando…</div>;
  if (!book) return (
    <div className="container pt-24 pb-10 space-y-4">
      <div className="text-2xl font-semibold">Livro não encontrado</div>
      <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
    </div>
  );

  const ch = chapters[state.chapterIndex];
  const atBookmark = state.bookmarks.some((b) => b.chapterIndex === state.chapterIndex && b.pageIndex === state.pageIndex);

  const goto = (chapterIndex: number, pageIndex: number) => {
    chapterIndex = Math.max(0, Math.min(chapters.length - 1, chapterIndex));
    pageIndex = Math.max(0, Math.min(chapters[chapterIndex].pages - 1, pageIndex));
    setState((s) => ({ ...s, chapterIndex, pageIndex }));
  };

  const nextPage = () => {
    const lastPage = chapters[state.chapterIndex].pages - 1;
    if (state.pageIndex < lastPage) goto(state.chapterIndex, state.pageIndex + 1);
    else if (state.chapterIndex < chapters.length - 1) goto(state.chapterIndex + 1, 0);
  };
  const prevPage = () => {
    if (state.pageIndex > 0) goto(state.chapterIndex, state.pageIndex - 1);
    else if (state.chapterIndex > 0) goto(state.chapterIndex - 1, chapters[state.chapterIndex - 1].pages - 1);
  };

  const toggleMark = async () => {
    if (!user) return;
    const added = await MockApi.toggleBookmark(user.id, book.id, state.chapterIndex, state.pageIndex);
    const st = await MockApi.getReadingState(user.id, book.id);
    setState(st as ReadingState);
    toast.success(added ? "Marcador adicionado" : "Marcador removido");
  };

  // Simulated page content
  const content = useMemo(() => {
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.";
    const blocks = 6;
    return Array.from({ length: blocks }).map((_, i) => (
      <p key={i} className="text-sm leading-7 text-muted-foreground">{lorem} {formatPage(state.chapterIndex, state.pageIndex)} — {book.title} — {book.author}</p>
    ));
  }, [state.chapterIndex, state.pageIndex, book.title, book.author]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container pt-24 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Lendo</div>
            <h1 className="text-2xl font-semibold leading-tight">{book.title}</h1>
            <div className="text-sm text-muted-foreground">{book.author}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/library")}>Biblioteca</Button>
            <Button onClick={() => navigate(-1)}>Voltar</Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[280px,1fr] mt-4">
          <aside className="rounded-lg border bg-card">
            <ScrollArea className="h-[calc(100vh-240px)] p-3">
              <div className="mb-3 text-sm font-medium px-1">Capítulos</div>
              <div className="space-y-1">
                {chapters.map((c, i) => (
                  <button key={i} className={`w-full text-left rounded px-2 py-2 text-sm hover:bg-muted ${i === state.chapterIndex ? "bg-muted" : ""}`} onClick={() => goto(i, 0)}>
                    {c.title}
                    <span className="block text-xs text-muted-foreground">{c.pages} páginas</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 mb-2 text-sm font-medium px-1">Marcadores</div>
              <div className="space-y-1">
                {state.bookmarks.length === 0 && <div className="text-xs text-muted-foreground px-2">Nenhum marcador</div>}
                {state.bookmarks.map((b, i) => (
                  <button key={`${b.chapterIndex}-${b.pageIndex}-${i}`} className="w-full text-left rounded px-2 py-2 text-sm hover:bg-muted" onClick={() => goto(b.chapterIndex, b.pageIndex)}>
                    {formatPage(b.chapterIndex, b.pageIndex)}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <section className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">{formatPage(state.chapterIndex, state.pageIndex)}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={toggleMark}>{atBookmark ? "Remover marcador" : "Adicionar marcador"}</Button>
                <Button variant="outline" onClick={prevPage}>Página anterior</Button>
                <Button onClick={nextPage}>Próxima página</Button>
              </div>
            </div>
            <ScrollArea className="mt-4 h-[calc(100vh-300px)] pr-3">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {content}
              </div>
            </ScrollArea>
            <div className="mt-3 text-xs text-muted-foreground text-right">
              {linearIndex(chapters, state.chapterIndex, state.pageIndex) + 1} de {pagesTotal} páginas
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
