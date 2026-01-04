import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import OwnerPortal from "./pages/OwnerPortal";
import Admin from "./pages/Admin";
import BarMenu from "./pages/BarMenu";
import BarStaff from "./pages/BarStaff";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <CartDrawer />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/login" element={<Login />} />
                <Route path="/owner" element={<OwnerPortal />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="/bar/:slug" element={<BarMenu />} />
                <Route path="/bar/:slug/staff" element={<BarStaff />} />
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
