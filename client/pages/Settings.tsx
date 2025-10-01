import { useEffect, useState } from "react";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { MockApi } from "@/mocks/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HistoryEntry, UserProfileFull } from "@shared/api";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsInner />
    </ProtectedRoute>
  );
}

function SettingsInner() {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileFull | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    MockApi.getProfile(user.id).then(setProfile);
    MockApi.getHistory(user.id).then(setHistory);
  }, [user]);

  if (!user || !profile) return <div className="container pt-24">Carregando...</div>;

  return (
    <div className="container pt-24 pb-10 space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações pessoais</CardTitle>
            <CardDescription>Gerencie seus dados de conta</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={profile.name} readOnly />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={profile.email} readOnly />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={profile.phone || ""} readOnly />
            </div>
            <EditProfileModal profile={profile} onSave={async (data) => {
              const updated = await MockApi.updateProfile(user.id, data);
              setProfile(updated);
              updateUser(updated);
              toast.success("Perfil atualizado");
            }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>Notificações e gêneros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notificações</div>
                <div className="text-sm text-muted-foreground">Receber avisos e sugestões</div>
              </div>
              <Switch checked={profile.preferences.notifications} onCheckedChange={async (v) => {
                const updated = await MockApi.updateProfile(user.id, { preferences: { notifications: v } });
                setProfile(updated);
              }} />
            </div>
            <div>
              <Label>Gêneros favoritos</Label>
              <Select value={profile.preferences.favoriteGenres[0]} onValueChange={async (v) => {
                const updated = await MockApi.updateProfile(user.id, { preferences: { favoriteGenres: [v] } });
                setProfile(updated);
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["Ficção","Fantasia","Tecnologia","História","Psicologia","Negócios","Romance"].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Opções para leitura</CardTitle>
            <CardDescription>Ajuste o conforto de leitura</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Tipo de luz</Label>
              <Select value={profile.preferences.reading.light} onValueChange={async (v) => {
                const updated = await MockApi.updateProfile(user.id, { preferences: { reading: { light: v as any } } });
                setProfile(updated);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="claro">Claro</SelectItem>
                  <SelectItem value="escuro">Escuro</SelectItem>
                  <SelectItem value="sepia">Sépia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estilo da fonte</Label>
              <Select value={profile.preferences.reading.fontFamily} onValueChange={async (v) => {
                const updated = await MockApi.updateProfile(user.id, { preferences: { reading: { fontFamily: v as any } } });
                setProfile(updated);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="sans">Sans-serif</SelectItem>
                  <SelectItem value="dyslexic">Dyslexic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tamanho da fonte: {profile.preferences.reading.fontSize}px</Label>
              <Slider value={[profile.preferences.reading.fontSize]} min={12} max={24} step={1} onValueChange={async (v) => {
                const updated = await MockApi.updateProfile(user.id, { preferences: { reading: { fontSize: v[0] } } });
                setProfile(updated);
              }} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Histórico de leituras</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Livro</th>
                <th className="p-2">Finalizado em</th>
                <th className="p-2">Nota</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="p-2">{h.title}</td>
                  <td className="p-2">{new Date(h.finishedAt).toLocaleDateString()}</td>
                  <td className="p-2">{h.rating ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex gap-3">
        <ChangePassword />
        <Button variant="destructive" onClick={async () => { await MockApi.deleteAccount(user.id); toast.success("Conta excluída"); logout(); }}>Excluir conta</Button>
      </section>
    </div>
  );
}

function EditProfileModal({ profile, onSave }: { profile: UserProfileFull; onSave: (data: Partial<UserProfileFull>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-1">Editar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={async () => { await onSave({ name, phone }); setOpen(false); }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePassword() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Alterar senha</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Senha atual</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div>
            <Label>Nova senha</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            <p className="text-xs text-muted-foreground">Deve conter letra maiúscula, número e caractere especial (mín. 8).</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={async () => {
            try { await MockApi.changePassword(user.id, current, next); toast.success("Senha alterada"); setOpen(false); }
            catch (e: any) { toast.error(e.message || "Erro ao alterar senha"); }
          }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
