import { useEffect, useState } from "react";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { MockApi } from "@/mocks/api";
import { Book, DashboardData } from "@shared/api";
import { StatCard, BookCard } from "@/components/BookCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Index() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const d = await MockApi.getDashboard(user.id);
      setData(d);
      setLoading(false);
    })();
  }, [user]);

  if (loading || !data) return <div className="min-h-screen pt-24 container">Carregando...</div>;

  const { summary, suggestions, recentBooks } = data;

  return (
    <div className="min-h-screen bg-background">
      <main className="container pt-24 pb-10 space-y-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground">Aqui está um resumo da sua biblioteca e sugestões para a próxima leitura.</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Livros" value={String(summary.totalBooks)} />
          <StatCard title="Em leitura" value={String(summary.reading)} />
          <StatCard title="Concluídos" value={String(summary.completed)} />
          <StatCard title="Lista de desejos" value={String(summary.wishlistCount)} />
        </section>

        <section className="rounded-xl border p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Progresso geral</h2>
            <span className="text-sm text-muted-foreground">{summary.overallProgressPct}%</span>
          </div>
          <Progress value={summary.overallProgressPct} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Leituras recentes</h2>
            <Button variant="outline" asChild>
              <a href="/library">Ver biblioteca</a>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentBooks.map((b: Book) => (
              <BookCard key={b.id} item={b} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sugestões de leitura</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestions.map((s) => (
              <BookCard
                key={s.id}
                item={s}
                cta="Adicionar à Biblioteca"
                onAction={async () => {
                  if (!user) return;
                  await MockApi.addBook(user.id, {
                    title: s.title,
                    author: s.author,
                    genre: s.genre,
                    coverUrl: s.coverUrl,
                    status: "not_started",
                    currentPage: 0,
                    totalPages: 200,
                  });
                  toast.success("Adicionado à sua biblioteca");
                  const d = await MockApi.getDashboard(user.id);
                  setData(d);
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
