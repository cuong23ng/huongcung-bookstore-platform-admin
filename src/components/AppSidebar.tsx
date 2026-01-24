import { useState, useEffect } from "react";
import { Users, Book, Package, ShoppingCart, LayoutDashboard, Truck, ChevronRight } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getAuthData } from "../services/AdminAuthService";
import { StaffRole } from "../models/Staff";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = getAuthData();

  // Check if catalog submenu should be open
  const isCatalogPath = location.pathname.startsWith('/admin/catalog');
  const [isCatalogOpen, setIsCatalogOpen] = useState(isCatalogPath);

  // Check if orders submenu should be open
  const isOrdersPath = location.pathname.startsWith('/admin/orders');
  const [isOrdersOpen, setIsOrdersOpen] = useState(isOrdersPath);

  // Check if consignments submenu should be open
  const isConsignmentsPath = location.pathname.startsWith('/admin/consignments');
  const [isConsignmentsOpen, setIsConsignmentsOpen] = useState(isConsignmentsPath);

  // Update catalog open state when location changes
  useEffect(() => {
    setIsCatalogOpen(isCatalogPath);
  }, [isCatalogPath]);

  // Update orders open state when location changes
  useEffect(() => {
    setIsOrdersOpen(isOrdersPath);
  }, [isOrdersPath]);

  // Update consignments open state when location changes
  useEffect(() => {
    setIsConsignmentsOpen(isConsignmentsPath);
  }, [isConsignmentsPath]);

  // Define menu items based on role
  const items = [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, roles: ["ROLE_ADMIN", "ROLE_STORE_MANAGER", "ROLE_SUPPORT_AGENT"] },
    { title: "Quản lý nhân viên", url: "/admin/staff", icon: Users, roles: ["ROLE_ADMIN"] },
    { title: "Quản lý kho", url: "/admin/inventory", icon: Package, roles: ["ROLE_ADMIN", "ROLE_STORE_MANAGER", "ROLE_WAREHOUSE_MANAGER", "ROLE_WAREHOUSE_STAFF"] },
  ];

  // Catalog submenu items
  const catalogSubItems = [
    { title: "Sách", url: "/admin/catalog/books" },
    { title: "Tác giả", url: "/admin/catalog/authors" },
    { title: "Thể loại", url: "/admin/catalog/genres" },
  ];

  // Orders submenu items
  const ordersSubItems = [
    { title: "Hàng đợi xử lý", url: "/admin/orders/fulfillment-queue" },
    { title: "Tất cả đơn hàng", url: "/admin/orders/all" },
  ];

  // Consignments submenu items
  const consignmentsSubItems = [
    { title: "Lô hàng chưa tạo đơn vận chuyển", url: "/admin/consignments/created", roles: ["ROLE_ADMIN", "ROLE_WAREHOUSE_MANAGER", "ROLE_STORE_MANAGER"] },
    { title: "Tất cả lô hàng", url: "/admin/consignments/all", roles: ["ROLE_ADMIN", "ROLE_STORE_MANAGER", "ROLE_WAREHOUSE_MANAGER", "ROLE_WAREHOUSE_STAFF"] },
  ];

  // Filter items based on user role
  console.log("User Roles:", userInfo?.roles);
  const visibleItems = items.filter(item => item.roles.includes(userInfo?.roles[0]));
  const showCatalog = ["ROLE_ADMIN", "ROLE_SUPPORT_AGENT"].includes(userInfo?.roles[0]);
  const showOrders = ["ROLE_ADMIN", "ROLE_STORE_MANAGER", "ROLE_SUPPORT_AGENT"].includes(userInfo?.roles[0]);
  const showConsignments = ["ROLE_ADMIN", "ROLE_WAREHOUSE_MANAGER", "ROLE_WAREHOUSE_STAFF"].includes(userInfo?.roles[0]);

  const handleCatalogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCatalogOpen) {
      setIsCatalogOpen(false);
    } else {
      setIsCatalogOpen(true);
      //navigate("/admin/catalog/books");
    }
  };

  const handleOrdersClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOrdersOpen) {
      setIsOrdersOpen(false);
    } else {
      setIsOrdersOpen(true);
      //navigate("/admin/orders/fulfillment-queue");
    }
  };

  const handleConsignmentsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isConsignmentsOpen) {
      setIsConsignmentsOpen(false);
    } else {
      setIsConsignmentsOpen(true);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="mt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider">
            Quản lý
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary"
                          : "hover:bg-muted"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {showCatalog && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleCatalogClick}
                    isActive={isCatalogPath}
                    className="w-full"
                  >
                    <Book className="h-4 w-4" />
                    <span>Quản lý danh mục</span>
                    <ChevronRight 
                      className={`ml-auto h-4 w-4 transition-transform ${isCatalogOpen ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isCatalogOpen && (
                    <SidebarMenuSub>
                      {catalogSubItems.map((subItem) => {
                        const isActive = location.pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink to={subItem.url}>
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
              {showOrders && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleOrdersClick}
                    isActive={isOrdersPath}
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Xử lý đơn hàng</span>
                    <ChevronRight 
                      className={`ml-auto h-4 w-4 transition-transform ${isOrdersOpen ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isOrdersOpen && (
                    <SidebarMenuSub>
                      {ordersSubItems.map((subItem) => {
                        const isActive = location.pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink to={subItem.url}>
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
              {showConsignments && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleConsignmentsClick}
                    isActive={isConsignmentsPath}
                    className="w-full"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Quản lý lô hàng</span>
                    <ChevronRight 
                      className={`ml-auto h-4 w-4 transition-transform ${isConsignmentsOpen ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isConsignmentsOpen && (
                    <SidebarMenuSub>
                      {consignmentsSubItems.filter(subItem => subItem.roles.includes(userInfo?.roles[0]))
                      .map((subItem) => {
                        const isActive = location.pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink to={subItem.url}>
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
