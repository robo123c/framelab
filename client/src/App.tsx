// Film Lab Console style: a dark, cinematic tool surface with mint status signals.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import Timing from "@/pages/Timing";
import Workers from "@/pages/Workers";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/editor" component={Home} />
      <Route path="/project/draft-04/preview" component={Home} />
      <Route path="/project/draft-04/song" component={Timing} />
      <Route path="/project/:id/preview" component={Home} />
      <Route path="/project/:id/song" component={Timing} />
      <Route path="/workers" component={Workers} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="bottom-right" theme="dark" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
