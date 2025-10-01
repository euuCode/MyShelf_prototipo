import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { MockApi } from "@/mocks/api";
import { Book, BookFilters, Recommendation } from "@shared/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookCard } from "@/components/BookCard";
import { AddEditBookModal, ProgressModal } from "@/components/BookModals";
import { Plus, Edit2, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function Library() {
  return (
    <ProtectedRoute>
      <LibraryInner />
    </ProtectedRoute>
  );
}

function LibraryInner() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<BookFilters>({ sort: "date" });
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string | undefined>();
  const [view, setView] = useState<"library" | "wishlist">("library");
  const [books, setBooks] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!user) return;
    if (view === "library") {
      MockApi.listBooks(user.id, { ...filters, q }).then(setBooks);
    } else {
      MockApi.getWishlist(user.id).then(setWishlist);
    }
  }, [user, filters, q, view]);

  const genres = useMemo(() => Array.from(new Set(books.map((b) => b.genre))), [books]);

  if (!user) return null;

  return (
    <div className="container pt-24 pb-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Buscar</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título ou autor" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Gênero</label>
            <Select value={genre} onValueChange={(v) => { const val = v === "all" ? undefined : v; setGenre(val); setFilters((f) => ({ ...f, genre: val })); }}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Ordenar</label>
            <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="alpha">Alfabética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === "library" ? "default" : "outline"} onClick={() => setView("library")}>Biblioteca</Button>
          <Button variant={view === "wishlist" ? "default" : "outline"} onClick={() => setView("wishlist")}>Lista de desejos</Button>
          <AddEditBookModal
            trigger={<Button className="ml-2"><Plus className="mr-2 h-4 w-4" />Novo Livro</Button>}
            onSave={async (data) => {
              await MockApi.addBook(user.id, data);
              toast.success("Livro adicionado");
              const list = await MockApi.listBooks(user.id, { ...filters, q });
              setBooks(list);
            }}
          />
        </div>
      </div>

      {view === "library" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((b) => (
            <div key={b.id} className="relative group">
              <BookCard item={b} />
              <div className="absolute inset-x-2 -bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <ProgressModal
                  book={b}
                  trigger={<Button size="sm" variant="secondary" className="flex-1"><BookOpen className="h-4 w-4 mr-1" />Progresso</Button>}
                  onSave={async (page) => {
                    const nb = await MockApi.setProgress(user.id, b.id, page);
                    if (nb.totalPages && page >= nb.totalPages) {
                      await MockApi.updateBook(user.id, b.id, { status: "completed" });
                    }
                    setBooks(await MockApi.listBooks(user.id, { ...filters, q }));
                    toast.success("Progresso atualizado");
                  }}
                />
                <AddEditBookModal
                  initial={b}
                  trigger={<Button size="sm" variant="secondary" className="flex-1"><Edit2 className="h-4 w-4 mr-1" />Editar</Button>}
                  onSave={async (data) => {
                    await MockApi.updateBook(user.id, b.id, data);
                    setBooks(await MockApi.listBooks(user.id, { ...filters, q }));
                    toast.success("Livro atualizado");
                  }}
                />
                <Button size="sm" variant="destructive" onClick={async () => {
                  await MockApi.deleteBook(user.id, b.id);
                  setBooks(await MockApi.listBooks(user.id, { ...filters, q }));
                  toast.success("Livro excluído");
                }}>
                  <Trash2 className="h-4 w-4 mr-1" />Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((w) => (
            <BookCard key={w.id} item={w} cta="Adicionar à Biblioteca" onAction={async () => {
              await MockApi.addBook(user.id, { title: w.title, author: w.author, genre: w.genre, coverUrl: w.coverUrl, status: "not_started", currentPage: 0, totalPages: 200 });
              await MockApi.removeFromWishlist(user.id, w.id);
              setWishlist(await MockApi.getWishlist(user.id));
              toast.success("Adicionado à biblioteca");
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
