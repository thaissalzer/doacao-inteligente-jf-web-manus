import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Heart, MapPin, Package, Plus, Pencil, Trash2, Shield, LogOut,
  AlertTriangle, Info, CheckCircle, LayoutDashboard, Users, BarChart3,
  RefreshCw, CalendarClock, Play,
} from "lucide-react";
import { Link } from "wouter";

const CATEGORIAS = [
  "Alimentos", "Roupas", "Produtos de Higiene", "Material de Limpeza",
  "Colchões e Cobertores", "Água", "Medicamentos", "Outros",
] as const;

const TIPOS = ["Ponto de arrecadação", "Abrigo"] as const;
const STATUS_OPTIONS = ["URGENTE", "PRECISA", "OK"] as const;

function StatusBadge({ status }: { status: string }) {
  if (status === "URGENTE") return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100"><AlertTriangle className="w-3 h-3 mr-1" />Urgente</Badge>;
  if (status === "PRECISA") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"><Info className="w-3 h-3 mr-1" />Precisa</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>;
}

// ==================== PONTO FORM ====================

function PontoForm({ ponto, onSuccess }: { ponto?: any; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const createMutation = trpc.pontos.create.useMutation({
    onSuccess: () => {
      utils.pontos.list.invalidate();
      utils.pontos.getStats.invalidate();
      toast.success("Ponto criado com sucesso!");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.pontos.update.useMutation({
    onSuccess: () => {
      utils.pontos.list.invalidate();
      toast.success("Ponto atualizado!");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    nome: ponto?.nome ?? "",
    tipo: ponto?.tipo ?? "Ponto de arrecadação",
    bairro: ponto?.bairro ?? "",
    endereco: ponto?.endereco ?? "",
    horario: ponto?.horario ?? "",
    descricao: ponto?.descricao ?? "",
    contatoNome: ponto?.contatoNome ?? "",
    contatoWhats: ponto?.contatoWhats ?? "",
    contatoEmail: ponto?.contatoEmail ?? "",
    latitude: ponto?.latitude ?? "",
    longitude: ponto?.longitude ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ponto) {
      updateMutation.mutate({ id: ponto.id, ...form });
    } else {
      createMutation.mutate(form as any);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Nome *</Label>
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
        </div>
        <div>
          <Label>Tipo *</Label>
          <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Bairro *</Label>
          <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} required />
        </div>
        <div className="sm:col-span-2">
          <Label>Endereço</Label>
          <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </div>
        <div>
          <Label>Horário</Label>
          <Input value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} placeholder="Ex: 8h às 17h" />
        </div>
        <div>
          <Label>Contato (Nome)</Label>
          <Input value={form.contatoNome} onChange={(e) => setForm({ ...form, contatoNome: e.target.value })} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input value={form.contatoWhats} onChange={(e) => setForm({ ...form, contatoWhats: e.target.value })} placeholder="(32) 99999-9999" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.contatoEmail} onChange={(e) => setForm({ ...form, contatoEmail: e.target.value })} />
        </div>
        <div>
          <Label>Latitude</Label>
          <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-21.7610" />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-43.3500" />
        </div>
        <div className="sm:col-span-2">
          <Label>Descrição</Label>
          <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
          {isPending ? "Salvando..." : ponto ? "Atualizar" : "Criar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ==================== NECESSIDADE FORM ====================

function NecessidadeForm({ pontoId, necessidade, onSuccess }: { pontoId: number; necessidade?: any; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const createMutation = trpc.necessidades.create.useMutation({
    onSuccess: () => {
      utils.necessidades.list.invalidate();
      utils.necessidades.getByPonto.invalidate();
      utils.pontos.getStats.invalidate();
      toast.success("Necessidade adicionada!");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.necessidades.update.useMutation({
    onSuccess: () => {
      utils.necessidades.list.invalidate();
      utils.necessidades.getByPonto.invalidate();
      utils.pontos.getStats.invalidate();
      toast.success("Necessidade atualizada!");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    categoria: necessidade?.categoria ?? "Alimentos",
    item: necessidade?.item ?? "",
    status: necessidade?.status ?? "PRECISA",
    observacao: necessidade?.observacao ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (necessidade) {
      updateMutation.mutate({ id: necessidade.id, ...form } as any);
    } else {
      createMutation.mutate({ pontoId, ...form } as any);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Categoria *</Label>
        <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Item *</Label>
        <Input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} required placeholder="Ex: Arroz, feijão e óleo" />
      </div>
      <div>
        <Label>Status *</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Observação</Label>
        <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={2} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
          {isPending ? "Salvando..." : necessidade ? "Atualizar" : "Adicionar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ==================== ADMIN PANEL ====================

function PontosTab() {
  const { data: pontos, isLoading } = trpc.pontos.list.useQuery({});
  const utils = trpc.useUtils();
  const [editPonto, setEditPonto] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const deleteMutation = trpc.pontos.delete.useMutation({
    onSuccess: () => {
      utils.pontos.list.invalidate();
      utils.pontos.getStats.invalidate();
      toast.success("Ponto removido!");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.pontos.update.useMutation({
    onSuccess: () => {
      utils.pontos.list.invalidate();
      toast.success("Status atualizado!");
    },
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pontos de Doação ({pontos?.length ?? 0})</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Ponto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Ponto de Doação</DialogTitle>
            </DialogHeader>
            <PontoForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Bairro</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pontos?.map((ponto: any) => (
              <TableRow key={ponto.id}>
                <TableCell className="font-medium">{ponto.nome}</TableCell>
                <TableCell className="hidden md:table-cell">{ponto.bairro}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="text-xs">{ponto.tipo}</Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={ponto.ativo}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: ponto.id, ativo: checked })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Dialog open={editPonto?.id === ponto.id} onOpenChange={(open) => !open && setEditPonto(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditPonto(ponto)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Ponto</DialogTitle>
                        </DialogHeader>
                        <PontoForm ponto={editPonto} onSuccess={() => setEditPonto(null)} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Remover "${ponto.nome}"?`)) {
                          deleteMutation.mutate({ id: ponto.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NecessidadesTab() {
  const { data: pontos } = trpc.pontos.list.useQuery({});
  const [selectedPontoId, setSelectedPontoId] = useState<number | null>(null);
  const { data: necessidades, isLoading } = trpc.necessidades.getByPonto.useQuery(
    { pontoId: selectedPontoId! },
    { enabled: !!selectedPontoId }
  );
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [editNec, setEditNec] = useState<any>(null);

  const deleteMutation = trpc.necessidades.delete.useMutation({
    onSuccess: () => {
      utils.necessidades.getByPonto.invalidate();
      utils.necessidades.list.invalidate();
      utils.pontos.getStats.invalidate();
      toast.success("Necessidade removida!");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold">Necessidades por Ponto</h2>
        {selectedPontoId && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Necessidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Necessidade</DialogTitle>
              </DialogHeader>
              <NecessidadeForm pontoId={selectedPontoId} onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-6">
        <Label className="mb-2 block">Selecione um ponto</Label>
        <Select
          value={selectedPontoId?.toString() ?? ""}
          onValueChange={(v) => setSelectedPontoId(Number(v))}
        >
          <SelectTrigger className="w-full sm:w-[400px]">
            <SelectValue placeholder="Escolha um ponto de doação" />
          </SelectTrigger>
          <SelectContent>
            {pontos?.map((p: any) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.nome} – {p.bairro}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPontoId && (
        <>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : necessidades && necessidades.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {necessidades.map((nec: any) => (
                    <TableRow key={nec.id}>
                      <TableCell className="font-medium">{nec.item}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{nec.categoria}</Badge>
                      </TableCell>
                      <TableCell><StatusBadge status={nec.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={editNec?.id === nec.id} onOpenChange={(open) => !open && setEditNec(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditNec(nec)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Necessidade</DialogTitle>
                              </DialogHeader>
                              <NecessidadeForm pontoId={selectedPontoId} necessidade={editNec} onSuccess={() => setEditNec(null)} />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Remover esta necessidade?")) {
                                deleteMutation.mutate({ id: nec.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma necessidade cadastrada para este ponto.</p>
              <p className="text-sm mt-1">Clique em "Nova Necessidade" para adicionar.</p>
            </div>
          )}
        </>
      )}

      {!selectedPontoId && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Selecione um ponto de doação para gerenciar suas necessidades.</p>
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UpdatesTab() {
  const { data: logs, isLoading } = trpc.updates.logs.useQuery({ limit: 20 });
  const utils = trpc.useUtils();
  const triggerMutation = trpc.updates.triggerUpdate.useMutation({
    onSuccess: () => {
      toast.success("Atualização iniciada! Aguarde alguns minutos.");
      // Poll for updates
      setTimeout(() => {
        utils.updates.logs.invalidate();
        utils.updates.lastUpdate.invalidate();
      }, 10000);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Atualizações Automáticas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            O sistema busca automaticamente informações atualizadas sobre pontos de doação em JF a cada 24 horas.
          </p>
        </div>
        <Button
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
        >
          {triggerMutation.isPending ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Iniciando...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" />Atualizar Agora</>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : logs && logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <Card key={log.id} className={`border-l-4 ${
              log.status === "running" ? "border-l-blue-500" :
              log.status === "error" ? "border-l-red-500" : "border-l-emerald-500"
            }`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {log.status === "running" ? (
                      <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : log.status === "error" ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {log.status === "running" ? "Em andamento..." :
                         log.status === "error" ? "Falhou" : "Concluída com sucesso"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <CalendarClock className="w-3 h-3 inline mr-1" />
                        {formatDate(log.startedAt)}
                        {log.finishedAt && ` — ${formatDate(log.finishedAt)}`}
                      </p>
                    </div>
                  </div>
                  {log.status === "success" && (
                    <div className="flex items-center gap-3 text-xs">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {log.pontosAtualizados ?? 0} pontos
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        +{log.necessidadesAdicionadas ?? 0} novas
                      </Badge>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {log.necessidadesAtualizadas ?? 0} atualizadas
                      </Badge>
                    </div>
                  )}
                </div>
                {log.resumo && (
                  <p className="text-sm text-muted-foreground mt-2 pl-8">{log.resumo}</p>
                )}
                {log.erro && (
                  <p className="text-sm text-red-600 mt-2 pl-8">{log.erro}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Nenhuma atualização realizada ainda.</p>
          <p className="text-sm mt-1">Clique em "Atualizar Agora" para iniciar a primeira busca.</p>
        </div>
      )}
    </div>
  );
}

function DashboardTab() {
  const { data: stats } = trpc.pontos.getStats.useQuery();

  const items = [
    { label: "Pontos Ativos", value: stats?.totalPontos ?? 0, icon: MapPin, color: "text-emerald-600 bg-emerald-100" },
    { label: "Itens Urgentes", value: stats?.totalUrgentes ?? 0, icon: AlertTriangle, color: "text-red-600 bg-red-100" },
    { label: "Total de Necessidades", value: stats?.totalNecessidades ?? 0, icon: Package, color: "text-blue-600 bg-blue-100" },
    { label: "Bairros Atendidos", value: stats?.totalBairros ?? 0, icon: Users, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Visão Geral</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-700" />
            </div>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
            <p className="text-muted-foreground mt-2">Faça login para acessar o painel administrativo.</p>
          </CardHeader>
          <CardContent className="text-center">
            <a href={getLoginUrl()}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">Fazer Login</Button>
            </a>
            <Link href="/">
              <Button variant="ghost" className="mt-3 w-full">Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-amber-700" />
            </div>
            <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            <p className="text-muted-foreground mt-2">Você não tem permissão de administrador. Entre em contato com o responsável pela plataforma.</p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-emerald-100 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:block">Doação Inteligente JF</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Olá, <strong>{user?.name || "Admin"}</strong>
            </span>
            <Link href="/pontos">
              <Button variant="ghost" size="sm">Ver Site</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie pontos de doação e suas necessidades.</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-emerald-50 border border-emerald-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="pontos" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Pontos
            </TabsTrigger>
            <TabsTrigger value="necessidades" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Necessidades
            </TabsTrigger>
            <TabsTrigger value="updates" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="pontos">
            <PontosTab />
          </TabsContent>
          <TabsContent value="necessidades">
            <NecessidadesTab />
          </TabsContent>
          <TabsContent value="updates">
            <UpdatesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
