import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, Send, CheckCircle, ArrowLeft, Phone, Mail, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function SugerirPonto() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "Ponto de arrecadação" as "Ponto de arrecadação" | "Abrigo",
    bairro: "",
    cidade: "Juiz de Fora",
    endereco: "",
    descricao: "",
    necessidades: "",
    contatoNome: "",
    contatoEmail: "",
    contatoWhats: "",
    fonte: "",
  });

  const submitMutation = trpc.sugestoes.submit.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar sugestão. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.bairro.trim()) {
      toast.error("Nome e bairro são obrigatórios.");
      return;
    }
    submitMutation.mutate(form);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        {/* Header */}
        <header className="bg-white border-b border-emerald-100 sticky top-0 z-50">
          <div className="container flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-bold text-emerald-700 text-lg">
              <Heart className="w-6 h-6 fill-emerald-500 text-emerald-500" />
              Doação Inteligente JF
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/pontos" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
                Pontos de Doação
              </Link>
              <Link href="/mapa" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
                Mapa
              </Link>
            </nav>
          </div>
        </header>

        <main className="container py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sugestão enviada!</h1>
            <p className="text-gray-600 mb-2">
              Obrigado por contribuir com a plataforma. Sua sugestão será revisada pela equipe antes de ser publicada.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Você receberá uma confirmação quando o ponto for aprovado e adicionado ao site.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    nome: "", tipo: "Ponto de arrecadação", bairro: "", cidade: "Juiz de Fora",
                    endereco: "", descricao: "", necessidades: "", contatoNome: "",
                    contatoEmail: "", contatoWhats: "", fonte: "",
                  });
                }}
              >
                Sugerir outro ponto
              </Button>
              <Link href="/pontos">
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  Ver pontos de doação
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-emerald-700 text-lg">
            <Heart className="w-6 h-6 fill-emerald-500 text-emerald-500" />
            Doação Inteligente JF
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pontos" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
              Pontos de Doação
            </Link>
            <Link href="/mapa" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
              Mapa
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Voltar */}
          <Link href="/pontos" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar para pontos de doação
          </Link>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Sugerir novo ponto de coleta
            </h1>
            <p className="text-gray-600">
              Conhece um ponto de arrecadação ou abrigo que ainda não está na nossa lista? 
              Preencha o formulário abaixo e ajude a manter a plataforma atualizada.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
              Sua sugestão será revisada pela equipe antes de ser publicada no site.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Informações do Ponto */}
            <Card className="mb-6 border-emerald-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Informações do Ponto
                </CardTitle>
                <CardDescription>Dados básicos sobre o ponto de coleta ou abrigo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do ponto *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Igreja São José, Escola Municipal..."
                    value={form.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={form.tipo} onValueChange={(v) => updateField("tipo", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ponto de arrecadação">Ponto de arrecadação</SelectItem>
                        <SelectItem value="Abrigo">Abrigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="Juiz de Fora"
                      value={form.cidade}
                      onChange={(e) => updateField("cidade", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    placeholder="Ex: Centro, São Mateus, Benfica..."
                    value={form.bairro}
                    onChange={(e) => updateField("bairro", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço completo</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, complemento..."
                    value={form.endereco}
                    onChange={(e) => updateField("endereco", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Informações adicionais sobre o ponto (horário de funcionamento, observações...)"
                    value={form.descricao}
                    onChange={(e) => updateField("descricao", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="necessidades">Necessidades / Itens aceitos</Label>
                  <Textarea
                    id="necessidades"
                    placeholder="Quais itens estão sendo aceitos? Ex: alimentos não perecíveis, roupas, água mineral..."
                    value={form.necessidades}
                    onChange={(e) => updateField("necessidades", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card className="mb-6 border-emerald-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  Contato (opcional)
                </CardTitle>
                <CardDescription>Informações de contato do ponto ou de quem está sugerindo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contatoNome" className="flex items-center gap-1.5">
                    Seu nome
                  </Label>
                  <Input
                    id="contatoNome"
                    placeholder="Como podemos te chamar?"
                    value={form.contatoNome}
                    onChange={(e) => updateField("contatoNome", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contatoEmail" className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      E-mail
                    </Label>
                    <Input
                      id="contatoEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={form.contatoEmail}
                      onChange={(e) => updateField("contatoEmail", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contatoWhats" className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </Label>
                    <Input
                      id="contatoWhats"
                      placeholder="(32) 99999-9999"
                      value={form.contatoWhats}
                      onChange={(e) => updateField("contatoWhats", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fonte">Fonte da informação</Label>
                  <Input
                    id="fonte"
                    placeholder="Link de rede social, notícia, ou como soube do ponto..."
                    value={form.fonte}
                    onChange={(e) => updateField("fonte", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botão de envio */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link href="/pontos">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar sugestão
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
