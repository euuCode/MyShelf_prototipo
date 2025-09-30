import { useEffect, useState } from "react";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { MockApi } from "@/mocks/api";
import { Recommendation } from "@shared/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { toast } from "sonner";

export default function Recommendations() {
  return (
    <ProtectedRoute>
      <RecsInner />
    </ProtectedRoute>
  );
}

function RecsInner() {
  const { user } = useAuth();
  const [genre, setGenre] = useState<string | undefined>(undefined);
  const [author, setAuthor] = useState<string | undefined>(undefined);
  const [personal, setPersonal] = useState<Recommendation[]>([]);
  const [trending, setTrending] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!user) return;
    MockApi.getRecommendations(user.id, "personal", { genre, author }).then(setPersonal);
    MockApi.getRecommendations(user.id, "trending", { genre, author }).then(setTrending);
  }, [user, genre, author]);

  if (!user) return null;

  const authors = Array.from(new Set([...personal, ...trending].map((r) => r.author)));
  const genres = Array.from(new Set([...personal, ...trending].map((r) => r.genre)));

  return (
    <div className="container pt-24 pb-10 space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm text-muted-foreground">Gênero</label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {genres.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Autor</label>
          <Select value={author} onValueChange={setAuthor}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {authors.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Baseadas no seu histórico</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {personal.map((s) => (
            <BookCard key={s.id} item={s} cta="Adicionar à Biblioteca" onAction={async () => {
              await MockApi.addBook(user.id, { title: s.title, author: s.author, genre: s.genre, coverUrl: s.coverUrl, status: "not_started", currentPage: 0, totalPages: 200 });
              toast.success("Adicionado à biblioteca");
            }} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Novidades em alta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {trending.map((s) => (
            <BookCard key={s.id} item={s} cta="Adicionar à Biblioteca" onAction={async () => {
              await MockApi.addBook(user.id, { title: s.title, author: s.author, genre: s.genre, coverUrl: s.coverUrl, status: "not_started", currentPage: 0, totalPages: 200 });
              toast.success("Adicionado à biblioteca");
            }} />
          ))}
        </div>
      </section>
    </div>
  );
}
