import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "./components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "./components/AppSidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import StaffManagement from "./pages/StaffManagement";
import BooksManagement from "./pages/catalog/BooksManagement";
import AuthorsManagement from "./pages/catalog/AuthorsManagement";
import GenresManagement from "./pages/catalog/GenresManagement";
import TranslatorsManagement from "./pages/catalog/TranslatorsManagement";
import InventoryManagement from "./pages/InventoryManagement";
import FulfillmentQueue from "./pages/orders/FulfillmentQueue";
import AllOrders from "./pages/orders/AllOrders";
import CreatedConsignments from "./pages/consignments/CreatedConsignments";
import AllConsignments from "./pages/consignments/AllConsignments";

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
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/staff" 
                    element={
                      <ProtectedRoute requiredRole="ROLE_ADMIN">
                        <StaffManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/catalog" 
                    element={
                      <Navigate to="/admin/catalog/books" replace />
                    } 
                  />
                  <Route 
                    path="/admin/catalog/books" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_SUPPORT_AGENT"]}>
                        <BooksManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/catalog/authors" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_SUPPORT_AGENT"]}>
                        <AuthorsManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/catalog/genres" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_SUPPORT_AGENT"]}>
                        <GenresManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/catalog/translators" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_SUPPORT_AGENT"]}>
                        <TranslatorsManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/inventory" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_STORE_MANAGER", "ROLE_WAREHOUSE_MANAGER", "ROLE_WAREHOUSE_STAFF"]}>
                        <InventoryManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/orders" 
                    element={
                      <Navigate to="/admin/orders/fulfillment-queue" replace />
                    } 
                  />
                  <Route 
                    path="/admin/orders/fulfillment-queue" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_SUPPORT_AGENT"]}>
                        <FulfillmentQueue />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/orders/all" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_SUPPORT_AGENT"]}>
                        <AllOrders />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/consignments" 
                    element={
                      <Navigate to="/admin/consignments/created" replace />
                    } 
                  />
                  <Route 
                    path="/admin/consignments/created" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_STORE_MANAGER", "ROLE_WAREHOUSE_MANAGER"]}>
                        <CreatedConsignments />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/consignments/all" 
                    element={
                      <ProtectedRoute requiredRole={["ROLE_ADMIN", "ROLE_STORE_MANAGER", "ROLE_WAREHOUSE_MANAGER", "ROLE_WAREHOUSE_STAFF"]}>
                        <AllConsignments />
                      </ProtectedRoute>
                    } 
                  />
                  {/* <Route 
                    path="/admin/support" 
                    element={
                      <ProtectedRoute requiredRole={["admin", "support_agent"]}>
                        <CustomerSupport />
                      </ProtectedRoute>
                    } 
                  /> */}
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
