import { Users, Package, ShoppingCart, HeadsetIcon, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getAuthData } from "../services/AdminAuthService";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

export function AppSidebar() {
  const { open } = useSidebar();
  const userInfo = getAuthData();
  
  // Get user role - normalize: remove ROLE_ prefix if present and convert to lowercase
  let userRole = '';
  if (userInfo?.roles && userInfo.roles.length > 0) {
    userRole = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
  } else if (userInfo?.userType) {
    userRole = userInfo.userType.toLowerCase();
  }

  // Define menu items based on role
  const items = [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, roles: ['admin', 'store_manager', 'support_agent'] },
    { title: "Quản lý nhân viên", url: "/admin/staff", icon: Users, roles: ['admin'] },
    { title: "Quản lý danh mục", url: "/admin/catalog", icon: Package, roles: ['admin'] },
    { title: "Quản lý kho", url: "/admin/inventory", icon: Package, roles: ['admin', 'store_manager'] },
    { title: "Xử lý đơn hàng", url: "/admin/orders", icon: ShoppingCart, roles: ['admin', 'store_manager'] },
    { title: "Hỗ trợ khách hàng", url: "/admin/support", icon: HeadsetIcon, roles: ['admin', 'support_agent'] },
  ];

  // Filter items based on user role
  const visibleItems = items.filter(item => item.roles.includes(userRole));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider">
            Quản lý
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-xs font-medium"
                          : "hover:bg-muted"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
