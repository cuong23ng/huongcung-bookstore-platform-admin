import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "./components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "./components/AppSidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import StaffManagement from "./pages/StaffManagement";
import CatalogManagement from "./pages/CatalogManagement";
import InventoryManagement from "./pages/InventoryManagement";
import OrderFulfillment from "./pages/OrderFulfillment";
import CustomerSupport from "./pages/CustomerSupport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1">
                <Routes>
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/staff" 
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <StaffManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/catalog" 
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CatalogManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/inventory" 
                    element={
                      <ProtectedRoute requiredRole={["admin", "store_manager"]}>
                        <InventoryManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/orders" 
                    element={
                      <ProtectedRoute requiredRole={["admin", "store_manager"]}>
                        <OrderFulfillment />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/support" 
                    element={
                      <ProtectedRoute requiredRole={["admin", "support_agent"]}>
                        <CustomerSupport />
                      </ProtectedRoute>
                    } 
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
