import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, BookCreate } from "@shared/api";

export function AddEditBookModal({ trigger, initial, onSave }: { trigger: React.ReactNode; initial?: Partial<Book>; onSave: (data: BookCreate) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [genre, setGenre] = useState(initial?.genre || "Ficção");
  const [status, setStatus] = useState<Book["status"]>(initial?.status || "not_started");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || "");
  const [totalPages, setTotalPages] = useState<number | undefined>(initial?.totalPages || 200);

  async function handleSave() {
    await onSave({ title, author, genre, status, coverUrl, currentPage: 0, totalPages });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Livro" : "+ Adicionar Livro"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Autor</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Gênero</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Ficção','Fantasia','Tecnologia','História','Psicologia','Negócios','Romance'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Book["status"]) }>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Não iniciado</SelectItem>
                  <SelectItem value="reading">Lendo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Total de páginas</Label>
              <Input type="number" value={totalPages ?? 0} onChange={(e) => setTotalPages(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Capa (URL)</Label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProgressModal({ trigger, book, onSave }: { trigger: React.ReactNode; book: Book; onSave: (page: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(book.currentPage || 0);

  async function handleSave() {
    await onSave(page);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Progresso de leitura</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Página atual</Label>
          <Input type="number" value={page} onChange={(e) => setPage(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">Total: {book.totalPages ?? 0}</p>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
