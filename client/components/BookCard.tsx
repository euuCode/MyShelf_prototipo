import { Book, Recommendation } from "@shared/api";
import { Button } from "@/components/ui/button";

export function BookCard({
  item,
  cta,
  onAction,
}: {
  item: Book | Recommendation;
  cta?: string;
  onAction?: () => void;
}) {
  const isBook = (i: any): i is Book => "status" in i;
  const Card = (
    <div className="group rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      {item.coverUrl && (
        <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
          <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="text-sm text-muted-foreground">{item.author}</div>
        <div className="font-semibold leading-tight line-clamp-2">{item.title}</div>
        <div className="text-xs text-muted-foreground">{item.genre}</div>
        {isBook(item) && item.totalPages ? (
          <div className="text-xs text-muted-foreground">{Math.min(100, Math.round(((item.currentPage || 0) / item.totalPages) * 100))}% lido</div>
        ) : null}
        {cta && onAction && (
          <Button className="w-full mt-2" onClick={onAction}>{cta}</Button>
        )}
      </div>
    </div>
  );
  if (isBook(item)) {
    return (
      <a href={`/read/${item.id}`} className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
        {Card}
      </a>
    );
  }
  return Card;
}

export function StatCard({ title, value, desc }: { title: string; value: string; desc?: string }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {desc && <div className="text-xs text-muted-foreground mt-1">{desc}</div>}
    </div>
  );
}
