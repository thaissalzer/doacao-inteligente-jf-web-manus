import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, MapPin, Package, Users, ArrowRight, HandHeart, Search, Shield, Mail, Github, Code, Bot } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

function StatsSection() {
  const { data: stats } = trpc.pontos.getStats.useQuery();

  const items = [
    { label: "Pontos de Doação", value: stats?.totalPontos ?? 0, icon: MapPin },
    { label: "Itens Urgentes", value: stats?.totalUrgentes ?? 0, icon: Package },
    { label: "Bairros Atendidos", value: stats?.totalBairros ?? 0, icon: Users },
    { label: "Necessidades Cadastradas", value: stats?.totalNecessidades ?? 0, icon: Heart },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.label} className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-6 text-center">
                <item.icon className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-emerald-800">{item.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
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
      description: "Busque pontos de doação próximos a você usando o mapa ou os filtros por bairro e categoria.",
    },
    {
      icon: Package,
      title: "Veja as necessidades",
      description: "Cada ponto lista exatamente o que precisa, com indicadores de urgência para priorizar sua ajuda.",
    },
    {
      icon: HandHeart,
      title: "Faça sua doação",
      description: "Leve suas doações diretamente ao ponto escolhido, sabendo que sua ajuda chegará onde mais precisa.",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-emerald-50/50">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground">Como funciona</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Em três passos simples, você direciona sua doação para onde ela é mais necessária.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5 group-hover:bg-emerald-200 transition-colors">
                <step.icon className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesPreview() {
  const categories = [
    { name: "Alimentos", emoji: "🍚", color: "bg-orange-50 text-orange-700 border-orange-200" },
    { name: "Roupas", emoji: "👕", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "Produtos de Higiene", emoji: "🧴", color: "bg-pink-50 text-pink-700 border-pink-200" },
    { name: "Material de Limpeza", emoji: "🧹", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { name: "Colchões e Cobertores", emoji: "🛏️", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { name: "Água", emoji: "💧", color: "bg-sky-50 text-sky-700 border-sky-200" },
    { name: "Medicamentos", emoji: "💊", color: "bg-red-50 text-red-700 border-red-200" },
    { name: "Outros", emoji: "📦", color: "bg-gray-50 text-gray-700 border-gray-200" },
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
              <div className={`rounded-xl border p-4 text-center hover:shadow-md transition-all cursor-pointer ${cat.color}`}>
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              Juiz de Fora precisa da sua ajuda
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Direcionando solidariedade{" "}
              <span className="text-emerald-200">de todo o Brasil</span>{" "}
              com eficiência
            </h1>
            <p className="mt-6 text-lg md:text-xl text-emerald-100 leading-relaxed max-w-2xl">
              Saiba exatamente o que cada ponto de arrecadação em Juiz de Fora precisa.
              De qualquer lugar do país, direcione sua doação para onde ela faz mais diferença.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/pontos">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg">
                  Ver pontos de doação
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/mapa">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold">
                  <MapPin className="w-5 h-5 mr-2" />
                  Abrir mapa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StatsSection />
      <HowItWorks />
      <CategoriesPreview />

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para ajudar?</h2>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
            Cada doação faz a diferença. Encontre o ponto mais próximo e contribua com o que puder.
          </p>
          <Link href="/pontos">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg">
              Encontrar pontos de doação
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

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
                <p className="text-sm text-emerald-300 leading-relaxed">
                  Se quiser contribuir com informações, envie e-mail para{" "}
                  <a href="mailto:thaissalzer@gmail.com" className="text-emerald-400 hover:text-white transition-colors underline underline-offset-2">
                    thaissalzer@gmail.com
                  </a>
                </p>
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
