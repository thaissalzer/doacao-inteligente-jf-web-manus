import { useRef, useCallback, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MapPin, X, AlertTriangle, Info, CheckCircle, Phone, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

function StatusBadge({ status }: { status: string }) {
  if (status === "URGENTE") {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Urgente
      </Badge>
    );
  }
  if (status === "PRECISA") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">
        <Info className="w-3 h-3 mr-1" />
        Precisa
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs">
      <CheckCircle className="w-3 h-3 mr-1" />
      OK
    </Badge>
  );
}

export default function Mapa() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const markersAddedRef = useRef(false);
  const [selectedPonto, setSelectedPonto] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();

  const { data: pontos } = trpc.pontos.list.useQuery({ ativo: true });
  const { data: necessidades } = trpc.necessidades.getByPonto.useQuery(
    { pontoId: selectedPonto?.id ?? 0 },
    { enabled: !!selectedPonto }
  );

  const addMarkers = useCallback((map: google.maps.Map, pontosData: any[]) => {
    // Clear existing markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    pontosData.forEach((ponto) => {
      if (!ponto.latitude || !ponto.longitude) return;

      const lat = parseFloat(ponto.latitude);
      const lng = parseFloat(ponto.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const pinEl = document.createElement("div");
      pinEl.innerHTML = `
        <div style="
          background: #059669;
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
      `;

      pinEl.addEventListener("mouseenter", () => {
        const inner = pinEl.firstElementChild as HTMLElement;
        if (inner) inner.style.transform = "scale(1.2)";
      });
      pinEl.addEventListener("mouseleave", () => {
        const inner = pinEl.firstElementChild as HTMLElement;
        if (inner) inner.style.transform = "scale(1)";
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: ponto.nome,
        content: pinEl,
      });

      marker.addListener("click", () => {
        setSelectedPonto(ponto);
        map.panTo({ lat, lng });
        map.setZoom(15);
      });

      markersRef.current.push(marker);
    });

    markersAddedRef.current = true;
  }, []);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (pontos && pontos.length > 0) {
        addMarkers(map, pontos);
      }
    },
    [pontos, addMarkers]
  );

  // When pontos data arrives after map is ready, add markers
  useEffect(() => {
    if (mapRef.current && pontos && pontos.length > 0 && !markersAddedRef.current) {
      addMarkers(mapRef.current, pontos);
    }
  }, [pontos, addMarkers]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
              <Button variant="ghost" size="sm">Pontos de Doação</Button>
            </Link>
            <Link href="/mapa">
              <Button variant="ghost" size="sm" className="text-emerald-700 bg-emerald-50">Mapa</Button>
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

      <div className="flex-1 relative">
        {/* Map */}
        <MapView
          className="w-full h-[calc(100vh-64px)]"
          initialCenter={{ lat: -21.7610, lng: -43.3500 }}
          initialZoom={13}
          onMapReady={handleMapReady}
        />

        {/* Selected ponto panel */}
        {selectedPonto && (
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-[380px] z-10">
            <Card className="shadow-xl border-emerald-200 max-h-[calc(100vh-120px)] overflow-y-auto">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-emerald-800">{selectedPonto.nome}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {selectedPonto.tipo}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPonto(null)}
                    className="shrink-0 -mt-1 -mr-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {selectedPonto.endereco && selectedPonto.endereco !== "—" && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span>{selectedPonto.endereco} – {selectedPonto.bairro}</span>
                  </div>
                )}
                {selectedPonto.horario && selectedPonto.horario !== "—" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{selectedPonto.horario}</span>
                  </div>
                )}
                {selectedPonto.contatoWhats && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{selectedPonto.contatoWhats}</span>
                  </div>
                )}

                {necessidades && necessidades.length > 0 && (
                  <div className="pt-3 border-t border-emerald-50">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Necessidades</p>
                    <div className="space-y-2">
                      {necessidades.map((nec: any) => (
                        <div key={nec.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate text-foreground">{nec.item}</span>
                          <StatusBadge status={nec.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!necessidades || necessidades.length === 0) && (
                  <div className="pt-3 border-t border-emerald-50">
                    <p className="text-sm text-muted-foreground italic">Nenhuma necessidade cadastrada.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
