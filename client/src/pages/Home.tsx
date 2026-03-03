import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, MapPin, Package, Users, ArrowRight, HandHeart, Search, Shield, Mail, Github, Code, Bot, Clock, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380155469/bY2zkmax4x7K9B5D6rJvxB/hero-jf-aerial-Ecr4NjYFHgrp5mWp879JcQ.png";
const SOLIDARITY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380155469/bY2zkmax4x7K9B5D6rJvxB/hero-solidarity-K4PEE88hTjovS7Tiiheq2n.webp";
const VOLUNTEERS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380155469/bY2zkmax4x7K9B5D6rJvxB/section-volunteers-DvK6PuYJVYtNzRyJQdkC4y.webp";

function StatsSection() {
  const { data: stats } = trpc.pontos.getStats.useQuery();

  const items = [
    { label: "Pontos de Doação", value: stats?.totalPontos ?? 0, icon: MapPin, color: "from-emerald-500 to-emerald-600" },
    { label: "Itens Urgentes", value: stats?.totalUrgentes ?? 0, icon: Package, color: "from-red-500 to-red-600" },
    { label: "Bairros Atendidos", value: stats?.totalBairros ?? 0, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Necessidades Cadastradas", value: stats?.totalNecessidades ?? 0, icon: Heart, color: "from-amber-500 to-amber-600" },
  ];

  return (
    <section className="py-16 bg-white relative">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground">Números da solidariedade</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Dados atualizados diariamente com auxílio de inteligência artificial.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <Card key={item.label} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
              <CardContent className="p-0">
                <div className={`h-1.5 bg-gradient-to-r ${item.color}`} />
                <div className="p-5 md:p-6 text-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl md:text-4xl font-extrabold text-foreground">{item.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1.5 font-medium">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Encontre um ponto",
      description: "Busque pontos de doação próximos a você usando o mapa interativo ou os filtros por bairro e categoria.",
      step: "01",
    },
    {
      icon: Package,
      title: "Veja as necessidades",
      description: "Cada ponto lista exatamente o que precisa receber, com indicadores de urgência para priorizar sua ajuda.",
      step: "02",
    },
    {
      icon: HandHeart,
      title: "Faça sua doação",
      description: "Leve suas doações diretamente ao ponto escolhido, sabendo que sua ajuda chegará onde mais precisa.",
      step: "03",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-emerald-50/80 to-white relative overflow-hidden">
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: image */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={SOLIDARITY_IMG}
                alt="Voluntários organizando doações em Juiz de Fora"
                className="w-full h-[300px] md:h-[400px] object-cover"
                loading="lazy"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -right-2 md:-right-6 bg-white rounded-xl shadow-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Atualizado via IA</p>
                  <p className="text-sm font-semibold text-foreground">Todo dia às 9h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: steps */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Simples e direto
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Como funciona
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg">
              Em três passos simples, você direciona sua doação para onde ela é mais necessária.
            </p>
            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-emerald-700 transition-colors">
                      {step.step}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="w-0.5 h-full bg-emerald-200 mt-2" />
                    )}
                  </div>
                  <div className="pb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesPreview() {
  const categories = [
    { name: "Alimentos", emoji: "🍚", color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
    { name: "Roupas", emoji: "👕", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
    { name: "Produtos de Higiene", emoji: "🧴", color: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" },
    { name: "Material de Limpeza", emoji: "🧹", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
    { name: "Colchões e Cobertores", emoji: "🛏️", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
    { name: "Água", emoji: "💧", color: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" },
    { name: "Medicamentos", emoji: "💊", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
    { name: "Outros", emoji: "📦", color: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground">Categorias de necessidades</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Os pontos de doação organizam suas necessidades por categoria para facilitar a sua contribuição.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {categories.map((cat) => (
            <Link key={cat.name} href="/pontos">
              <div className={`rounded-xl border p-4 text-center transition-all cursor-pointer ${cat.color}`}>
                <span className="text-2xl block mb-2">{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="py-20 bg-emerald-900 text-white relative overflow-hidden">
      {/* Background image overlay */}
      <div className="absolute inset-0">
        <img
          src={VOLUNTEERS_IMG}
          alt=""
          className="w-full h-full object-cover opacity-15"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-900/95 to-emerald-900/80" />
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6 text-emerald-200">
              <MapPin className="w-4 h-4" />
              De todo o Brasil para Juiz de Fora
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
              Sua doação pode vir de{" "}
              <span className="text-emerald-300">qualquer lugar do país</span>
            </h2>
            <p className="text-emerald-200 text-lg leading-relaxed mb-6">
              Não importa onde você esteja. Através da nossa plataforma, você pode identificar
              exatamente o que cada ponto de arrecadação em Juiz de Fora precisa e enviar sua
              contribuição de forma direcionada e eficiente.
            </p>
            <p className="text-emerald-300 text-base leading-relaxed mb-8">
              As informações são atualizadas diariamente com auxílio de inteligência artificial,
              garantindo que você sempre saiba onde sua ajuda é mais necessária.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/pontos">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold shadow-lg">
                  Ver pontos de doação
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/sugerir">
                <Button size="lg" variant="outline" className="border-emerald-400 text-emerald-200 hover:bg-white/10 font-semibold">
                  <HandHeart className="w-5 h-5 mr-2" />
                  Sugerir um ponto
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats highlight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
              <Bot className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">IA Diária</h3>
              <p className="text-sm text-emerald-300 mt-1">Dados atualizados todo dia às 9h por inteligência artificial</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
              <Shield className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">IA com validação humana</h3>
              <p className="text-sm text-emerald-300 mt-1">Parte das atualizações são revisadas por humanos antes de publicar</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
              <MapPin className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Mapa Interativo</h3>
              <p className="text-sm text-emerald-300 mt-1">Localize pontos de doação no mapa com endereço e rotas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
              <Heart className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Código Aberto</h3>
              <p className="text-sm text-emerald-300 mt-1">Projeto open-source para que qualquer um possa contribuir</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
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
              <Button variant="ghost" size="sm">Pontos de Doação</Button>
            </Link>
            <Link href="/mapa">
              <Button variant="ghost" size="sm">Mapa</Button>
            </Link>
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
            )}
            {isAuthenticated ? (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Shield className="w-4 h-4 mr-1" />
                  Painel
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Entrar
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero with background image */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt="Vista aérea de Juiz de Fora, Minas Gerais"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-800/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-emerald-950/30" />
        </div>

        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-5 py-2 text-sm font-medium mb-8 text-white border border-white/20">
              <Heart className="w-4 h-4 text-emerald-300 fill-emerald-300" />
              Juiz de Fora precisa da sua ajuda
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
              Direcionando{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                solidariedade
              </span>{" "}
              de todo o Brasil para Juiz de Fora e região
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl">
              Saiba exatamente o que cada ponto de arrecadação em Juiz de Fora precisa.
              De qualquer lugar do país, direcione sua doação para onde ela faz mais diferença.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/pontos">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg shadow-emerald-900/30 h-12 px-8 text-base">
                  Ver pontos de doação
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/mapa">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold h-12 px-8 text-base backdrop-blur-sm">
                  <MapPin className="w-5 h-5 mr-2" />
                  Abrir mapa
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center gap-6 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>Atualizado por IA diariamente</span>
              </div>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Curadoria humana</span>
              </div>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Código aberto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      <StatsSection />
      <HowItWorks />
      <CategoriesPreview />
      <MissionSection />

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-200">
        {/* Sobre o projeto */}
        <div className="border-b border-emerald-800/50">
          <div className="container py-12">
            <div className="grid md:grid-cols-2 gap-10">
              {/* Sobre os dados */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Sobre os dados</h3>
                </div>
                <p className="text-sm text-emerald-300 leading-relaxed mb-4">
                  As informações são atualizadas via modelo de Inteligência Artificial com base nas atualizações
                  diárias da web e também podem ser cadastradas manualmente.
                </p>
                <p className="text-sm text-emerald-300 leading-relaxed mb-4">
                  Se quiser contribuir com informações, envie e-mail para{" "}
                  <a href="mailto:thaissalzer@gmail.com" className="text-emerald-400 hover:text-white transition-colors underline underline-offset-2">
                    thaissalzer@gmail.com
                  </a>
                </p>
                <Link href="/sugerir">
                  <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-300 hover:bg-emerald-800 hover:text-white">
                    <HandHeart className="w-4 h-4 mr-1.5" />
                    Sugerir ponto de coleta
                  </Button>
                </Link>
              </div>

              {/* Convite para devs */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">É Desenvolvedor?</h3>
                </div>
                <p className="text-sm text-emerald-300 leading-relaxed mb-4">
                  Toda ajuda é bem-vinda. Estamos desenvolvendo código aberto para aprimoramento contínuo
                  e tornar a ferramenta estratégica e sem validade. Ajude a acelerar o desenvolvimento dessa ferramenta.
                </p>
                <a
                  href="https://github.com/thaissalzer/doacao-inteligente-jf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-white transition-colors font-medium"
                >
                  <Github className="w-4 h-4" />
                  Ver repositório no GitHub
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Créditos */}
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400" />
              <span className="font-semibold text-white">Doação Inteligente JF</span>
            </div>
            <p className="text-sm text-emerald-400 text-center">
              Desenvolvedora: <span className="text-white font-medium">Thais Salzer Procópio</span>{" "}
              <a
                href="https://instagram.com/thais_salzer"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                @thais_salzer
              </a>
            </p>
            <div className="flex gap-4 text-sm">
              <Link href="/pontos" className="hover:text-white transition-colors">Pontos</Link>
              <Link href="/mapa" className="hover:text-white transition-colors">Mapa</Link>
              <a href="mailto:thaissalzer@gmail.com" className="hover:text-white transition-colors flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
