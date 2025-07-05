
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import VisitorDetail from "./pages/VisitorDetail";
import ApiDocs from "./pages/ApiDocs";
import Faces from "./pages/Faces";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Add CSS for Buy Me A Coffee widget positioning on desktop
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* BMC widget styling for desktop only */
      .bmc-btn-container {
        z-index: 40 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="doorbell-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/visitor/:id" element={<VisitorDetail />} />
              <Route path="/faces" element={<Faces />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
