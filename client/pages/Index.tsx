import { useEffect, useState } from "react";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { MockApi } from "@/mocks/api";
import { Book, DashboardData } from "@shared/api";
import { StatCard, BookCard } from "@/components/BookCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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

  if (loading || !data)
    return (
      <div className="min-h-screen pt-24 container space-y-8">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-24" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );

  const { summary, suggestions, recentBooks } = data;
  const last = recentBooks[0];

  return (
    <div className="min-h-screen bg-background">
      <main className="container pt-24 pb-10 space-y-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground">Aqui está um resumo da sua biblioteca e sugestões para a próxima leitura.</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total de livros" value={String(summary.totalBooks)} />
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5">
            <div className="text-sm text-muted-foreground">Leituras em andamento</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-2xl font-bold">{summary.reading}</div>
              <span className="text-xs text-muted-foreground">{summary.overallProgressPct}%</span>
            </div>
            <div className="mt-3">
              <Progress value={summary.overallProgressPct} />
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5">
            <div className="text-sm text-muted-foreground">Última atividade</div>
            <div className="text-2xl font-bold mt-1">{last ? last.title : "Sem atividades"}</div>
            {last && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(last.lastUpdatedAt), { addSuffix: true, locale: ptBR })}
              </div>
            )}
          </div>
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
            <h2 className="text-xl font-semibold">Sugestões rápidas</h2>
          </div>
          <Carousel className="w-full" opts={{ align: "start" }}>
            <CarouselContent>
              {suggestions.slice(0, 5).map((s) => (
                <CarouselItem key={s.id} className="basis-2/3 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <BookCard
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
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
      </main>
    </div>
  );
}
