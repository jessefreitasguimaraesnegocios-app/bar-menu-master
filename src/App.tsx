import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import BarMenu from "./pages/BarMenu";
import BarIndex from "./pages/BarIndex";
import Login from "./pages/Login";
import AdminPortal from "./pages/AdminPortal";
import OwnerPortal from "./pages/OwnerPortal";
import StaffPortal from "./pages/StaffPortal";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CartDrawer />
              <Routes>
                {/* Rotas padrão (fallback) */}
                <Route path="/" element={<Index />} />
                <Route path="/menu" element={<Menu />} />
                
                {/* Rotas dinâmicas por bar */}
                <Route path="/bar/:slug" element={<BarIndex />} />
                <Route path="/bar/:slug/menu" element={<BarMenu />} />
                
                {/* Rotas administrativas */}
                <Route path="/login" element={<Login />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminPortal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute requireOwner>
                      <OwnerPortal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute requireOwner>
                      <StaffPortal />
                    </ProtectedRoute>
                  }
                />
                
                {/* Rotas de pagamento */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failure" element={<PaymentFailure />} />
                <Route path="/payment/pending" element={<PaymentSuccess />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
