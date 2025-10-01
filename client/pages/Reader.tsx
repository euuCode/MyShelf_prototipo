import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { MockApi } from "@/mocks/api";
import { Book } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Reader() {
  return (
    <ProtectedRoute>
      <ReaderInner />
    </ProtectedRoute>
  );
}

function ReaderInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      const list = await MockApi.listBooks(user.id);
      const found = list.find((b) => b.id === id) || null;
      setBook(found);
      setPdfUrl(found?.pdfUrl || "");
      setLoading(false);
    })();
  }, [user, id]);

  const canSave = useMemo(() => !!book && pdfUrl !== (book.pdfUrl || ""), [book, pdfUrl]);

  if (!user) return null;
  if (loading) return <div className="container pt-24 pb-10">Carregando…</div>;
  if (!book) return (
    <div className="container pt-24 pb-10 space-y-4">
      <div className="text-2xl font-semibold">Livro não encontrado</div>
      <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container pt-20 pb-6 space-y-4">
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

        <div className="grid gap-4 sm:grid-cols-[1fr,320px]">
          <div className="rounded-lg border bg-card overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
            {book.pdfUrl ? (
              <iframe title={book.title} src={book.pdfUrl} className="w-full h-full" />
            ) : (
              <div className="h-full w-full flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-3">
                  <div className="text-lg font-medium">Nenhum arquivo anexado</div>
                  <p className="text-sm text-muted-foreground">Cole abaixo a URL de um PDF para ler este livro dentro do aplicativo.</p>
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border p-4 bg-card">
              <div className="space-y-2">
                <Label htmlFor="pdf">Link do PDF</Label>
                <Input id="pdf" placeholder="https://…/arquivo.pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
                <div className="flex gap-2">
                  <Button disabled={!canSave} onClick={async () => {
                    if (!user || !book) return;
                    await MockApi.updateBook(user.id, book.id, { pdfUrl });
                    const list = await MockApi.listBooks(user.id);
                    const updated = list.find((b) => b.id === book.id) || null;
                    setBook(updated);
                    toast.success("Link salvo");
                  }}>Salvar</Button>
                  {book.pdfUrl && <Button variant="secondary" onClick={() => window.open(book.pdfUrl!, "_blank")}>Abrir em nova aba</Button>}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
