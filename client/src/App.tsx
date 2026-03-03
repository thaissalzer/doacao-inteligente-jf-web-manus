import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Pontos from "./pages/Pontos";
import Mapa from "./pages/Mapa";
import Admin from "./pages/Admin";
import SugerirPonto from "./pages/SugerirPonto";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pontos" component={Pontos} />
      <Route path="/mapa" component={Mapa} />
      <Route path="/admin" component={Admin} />
      <Route path="/sugerir" component={SugerirPonto} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
