export default function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-3">
      <div className="text-2xl font-semibold">{title}</div>
      <p className="max-w-lg text-muted-foreground">{description}</p>
    </div>
  );
}
