import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Heart, MapPin, Clock, Phone, Search, Filter,
  AlertTriangle, CheckCircle, Info, Shield, RefreshCw, CalendarClock,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Nunca";
  const d = new Date(date);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return "ontem";
  return `há ${diffDays} dias`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "URGENTE") {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Urgente
      </Badge>
    );
  }
  if (status === "PRECISA") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        <Info className="w-3 h-3 mr-1" />
        Precisa
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
      <CheckCircle className="w-3 h-3 mr-1" />
      OK
    </Badge>
  );
}

function CategoryBadge({ categoria }: { categoria: string }) {
  const colors: Record<string, string> = {
    "Alimentos": "bg-orange-50 text-orange-700 border-orange-200",
    "Roupas": "bg-blue-50 text-blue-700 border-blue-200",
    "Produtos de Higiene": "bg-pink-50 text-pink-700 border-pink-200",
    "Material de Limpeza": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Colchões e Cobertores": "bg-purple-50 text-purple-700 border-purple-200",
    "Água": "bg-sky-50 text-sky-700 border-sky-200",
    "Medicamentos": "bg-red-50 text-red-700 border-red-200",
    "Outros": "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <Badge variant="outline" className={colors[categoria] || "bg-gray-50 text-gray-700"}>
      {categoria}
    </Badge>
  );
}

function UpdateStatusBanner() {
  const { data: lastUpdate, isLoading } = trpc.updates.lastUpdate.useQuery();

  if (isLoading) return null;

  const isRunning = lastUpdate?.status === "running";
  const isError = lastUpdate?.status === "error";
  const isSuccess = lastUpdate?.status === "success";
  const finishedAt = lastUpdate?.finishedAt ?? lastUpdate?.startedAt;

  return (
    <div className={`rounded-xl border px-4 py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 ${
      isRunning
        ? "bg-blue-50 border-blue-200"
        : isError
        ? "bg-red-50 border-red-200"
        : "bg-emerald-50 border-emerald-200"
    }`}>
      <div className="flex items-center gap-2">
        {isRunning ? (
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
        ) : (
          <CalendarClock className={`w-4 h-4 ${isError ? "text-red-600" : "text-emerald-600"}`} />
        )}
        <span className={`text-sm font-medium ${
          isRunning ? "text-blue-700" : isError ? "text-red-700" : "text-emerald-700"
        }`}>
          {isRunning
            ? "Atualização em andamento..."
            : isError
            ? "Última atualização falhou"
            : "Dados atualizados automaticamente"}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {finishedAt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                {formatRelativeTime(finishedAt)} ({formatDate(finishedAt)})
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Horário da última atualização automática</p>
            </TooltipContent>
          </Tooltip>
        )}
        {isSuccess && lastUpdate?.resumo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="hidden md:inline cursor-default max-w-[300px] truncate">
                {lastUpdate.resumo}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>{lastUpdate.resumo}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function PontoCard({ ponto }: { ponto: any }) {
  const { data: necessidades } = trpc.necessidades.getByPonto.useQuery({ pontoId: ponto.id });

  const urgentCount = necessidades?.filter((n: any) => n.status === "URGENTE").length ?? 0;
  const precisaCount = necessidades?.filter((n: any) => n.status === "PRECISA").length ?? 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-emerald-100 group flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-emerald-700 transition-colors">
              {ponto.nome}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs font-normal bg-emerald-50 text-emerald-700 border-emerald-200">
                {ponto.tipo}
              </Badge>
              <span className="text-xs">•</span>
              <span className="text-xs">{ponto.bairro}</span>
            </div>
          </div>
          {urgentCount > 0 && (
            <Badge className="bg-red-500 text-white hover:bg-red-500 text-xs shrink-0">
              {urgentCount} urgente{urgentCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 flex-1 flex flex-col">
        {ponto.endereco && ponto.endereco !== "—" && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{ponto.endereco}</span>
          </div>
        )}
        {ponto.horario && ponto.horario !== "—" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{ponto.horario}</span>
          </div>
        )}
        {ponto.contatoWhats && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{ponto.contatoWhats}</span>
          </div>
        )}

        {/* Necessidades */}
        {necessidades && necessidades.length > 0 ? (
          <div className="pt-3 border-t border-emerald-50 flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Necessidades</p>
            <div className="space-y-2">
              {necessidades.slice(0, 5).map((nec: any) => (
                <div key={nec.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryBadge categoria={nec.categoria} />
                    <span className="truncate text-foreground">{nec.item}</span>
                  </div>
                  <StatusBadge status={nec.status} />
                </div>
              ))}
              {necessidades.length > 5 && (
                <p className="text-xs text-muted-foreground">+{necessidades.length - 5} mais itens</p>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-emerald-50 flex-1">
            <p className="text-sm text-muted-foreground italic">Nenhuma necessidade cadastrada ainda.</p>
          </div>
        )}

        {/* Footer: last update + summary */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-emerald-50">
          <div className="flex items-center gap-3">
            {urgentCount > 0 && (
              <span className="text-xs text-red-600 font-medium">{urgentCount} urgente{urgentCount > 1 ? "s" : ""}</span>
            )}
            {precisaCount > 0 && (
              <span className="text-xs text-amber-600 font-medium">{precisaCount} necessário{precisaCount > 1 ? "s" : ""}</span>
            )}
          </div>
          {ponto.lastAutoUpdate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 cursor-default">
                  <RefreshCw className="w-3 h-3" />
                  {formatRelativeTime(ponto.lastAutoUpdate)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Última atualização automática: {formatDate(ponto.lastAutoUpdate)}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Pontos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBairro, setSelectedBairro] = useState<string>("all");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const { user, isAuthenticated } = useAuth();

  const { data: pontos, isLoading } = trpc.pontos.list.useQuery({ ativo: true });
  const { data: bairros } = trpc.pontos.getBairros.useQuery();
  const { data: allNecessidades } = trpc.necessidades.list.useQuery({});

  const filteredPontos = useMemo(() => {
    if (!pontos) return [];
    let result = pontos;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p: any) =>
          p.nome.toLowerCase().includes(term) ||
          p.bairro.toLowerCase().includes(term) ||
          (p.endereco && p.endereco.toLowerCase().includes(term))
      );
    }

    if (selectedBairro && selectedBairro !== "all") {
      result = result.filter((p: any) => p.bairro === selectedBairro);
    }

    if (selectedCategoria && selectedCategoria !== "all" && allNecessidades) {
      const pontoIdsWithCategoria = new Set(
        allNecessidades
          .filter((n: any) => n.categoria === selectedCategoria)
          .map((n: any) => n.pontoId)
      );
      result = result.filter((p: any) => pontoIdsWithCategoria.has(p.id));
    }

    return result;
  }, [pontos, searchTerm, selectedBairro, selectedCategoria, allNecessidades]);

  const categorias = [
    "Alimentos", "Roupas", "Produtos de Higiene", "Material de Limpeza",
    "Colchões e Cobertores", "Água", "Medicamentos", "Outros",
  ];

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
          <nav className="flex items-center gap-2">
            <Link href="/pontos">
              <Button variant="ghost" size="sm" className="text-emerald-700 bg-emerald-50">Pontos de Doação</Button>
            </Link>
            <Link href="/mapa">
              <Button variant="ghost" size="sm">Mapa</Button>
            </Link>
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Shield className="w-4 h-4 mr-1" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="container py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Pontos de Doação</h1>
          <p className="text-muted-foreground mt-2">
            Encontre o ponto mais próximo e veja o que cada um precisa receber.
          </p>
        </div>

        {/* Last update banner */}
        <UpdateStatusBanner />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, bairro ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedBairro} onValueChange={setSelectedBairro}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os bairros</SelectItem>
              {bairros?.map((b: string) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${filteredPontos.length} ponto${filteredPontos.length !== 1 ? "s" : ""} encontrado${filteredPontos.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-emerald-100">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPontos.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhum ponto encontrado</h3>
            <p className="text-muted-foreground mt-2">Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPontos.map((ponto: any) => (
              <PontoCard key={ponto.id} ponto={ponto} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
