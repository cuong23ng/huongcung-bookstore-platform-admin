# Tài Liệu Kiến Trúc và Cấu Trúc Dự Án
## HC Bookstore Admin - Frontend Application

---

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc Tổng Thể](#kiến-trúc-tổng-thể)
3. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
4. [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
5. [Luồng Dữ Liệu](#luồng-dữ-liệu)
6. [Bảo Mật và Xác Thực](#bảo-mật-và-xác-thực)
7. [Routing và Navigation](#routing-và-navigation)
8. [State Management](#state-management)
9. [API Integration](#api-integration)
10. [Styling và UI Components](#styling-và-ui-components)
11. [Testing](#testing)

---

## 📖 Tổng Quan

**HC Bookstore Admin** là một ứng dụng web quản trị (admin dashboard) được xây dựng để quản lý hệ thống nhà sách. Ứng dụng được phát triển bằng React với TypeScript, sử dụng Vite làm build tool và tích hợp với các microservices backend thông qua REST API.

### Mục Đích
- Quản lý danh mục sách (catalog management)
- Quản lý kho hàng (inventory management)
- Xử lý đơn hàng (order fulfillment)
- Quản lý nhân viên (staff management)
- Hỗ trợ khách hàng (customer support)
- Quản lý ký gửi (consignment management)

---

## 🏗️ Kiến Trúc Tổng Thể

### Kiến Trúc Frontend

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Application (SPA)                  │   │
│  │                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │   Pages      │  │  Components  │            │   │
│  │  │  (Routes)    │  │  (UI/Logic)  │            │   │
│  │  └──────┬───────┘  └──────┬───────┘            │   │
│  │         │                 │                      │   │
│  │  ┌──────▼─────────────────▼───────┐            │   │
│  │  │      Services Layer            │            │   │
│  │  │  (API Communication)           │            │   │
│  │  └──────┬─────────────────────────┘            │   │
│  │         │                                       │   │
│  │  ┌──────▼─────────────────────────┐            │   │
│  │  │    ApiClient (Axios)            │            │   │
│  │  │  (HTTP Client + Interceptors)   │            │   │
│  │  └──────┬─────────────────────────┘            │   │
│  └─────────┼───────────────────────────────────────┘   │
│            │                                            │
└────────────┼────────────────────────────────────────────┘
             │
             │ HTTPS/REST API
             │
┌────────────▼────────────────────────────────────────────┐
│         Backend Microservices                            │
│  (api-dev.huongcungbookstore.com/api)                   │
└──────────────────────────────────────────────────────────┘
```

### Kiến Trúc Component

```
App (Root)
├── QueryClientProvider (React Query)
├── ThemeProvider (Dark/Light Mode)
├── TooltipProvider
├── Toaster (Notifications)
├── BrowserRouter
│   └── SidebarProvider
│       ├── AppSidebar (Navigation)
│       └── Routes
│           ├── AdminLogin (Public)
│           ├── ProtectedRoute
│           │   ├── AdminDashboard
│           │   ├── StaffManagement
│           │   ├── CatalogManagement
│           │   ├── InventoryManagement
│           │   ├── OrderFulfillment
│           │   ├── ConsignmentManagement
│           │   └── CustomerSupport
│           └── NotFound
```

---

## 📁 Cấu Trúc Thư Mục

```
hc-bookstore-admin/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, icons, fonts
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── catalog/        # Catalog-specific components
│   │   ├── AppSidebar.tsx  # Main navigation sidebar
│   │   ├── Header.tsx      # Page header
│   │   ├── Footer.tsx      # Page footer
│   │   ├── ProtectedRoute.tsx  # Route protection wrapper
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── use-mobile.tsx  # Mobile detection hook
│   │   └── use-toast.ts    # Toast notification hook
│   ├── integrations/       # External service integrations
│   │   └── ApiClient.ts    # Axios instance with interceptors
│   ├── lib/                # Utility functions
│   │   └── utils.ts        # Helper functions (cn, etc.)
│   ├── models/             # TypeScript type definitions
│   │   ├── AdminAuth.ts    # Authentication types
│   │   ├── Catalog.ts      # Catalog entity types
│   │   ├── Customer.ts     # Customer types
│   │   ├── Inventory.ts    # Inventory types
│   │   ├── Order.ts        # Order types
│   │   ├── Staff.ts        # Staff types
│   │   └── index.ts        # Barrel export
│   ├── pages/              # Page components (routes)
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── StaffManagement.tsx
│   │   ├── CatalogManagement.tsx
│   │   ├── InventoryManagement.tsx
│   │   ├── OrderFulfillment.tsx
│   │   ├── ConsignmentManagement.tsx
│   │   ├── CustomerSupport.tsx
│   │   └── NotFound.tsx
│   ├── services/           # API service layer
│   │   ├── AdminAuthService.ts
│   │   ├── CatalogService.ts
│   │   ├── CustomerSupportService.ts
│   │   ├── InventoryService.ts
│   │   ├── OrderFulfillmentService.ts
│   │   ├── ReviewService.ts
│   │   └── StaffService.ts
│   ├── test/               # Test utilities
│   │   └── setup.ts        # Test configuration
│   ├── App.tsx             # Root component
│   ├── App.css             # Global styles
│   ├── main.tsx            # Application entry point
│   └── index.css           # Base CSS with Tailwind
├── .gitignore
├── index.html              # HTML template
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── tsconfig.app.json       # App-specific TS config
├── tsconfig.node.json      # Node-specific TS config
├── vite.config.ts          # Vite build configuration
├── vitest.config.ts        # Vitest test configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── eslint.config.js        # ESLint configuration
└── README.md
```

---

## 🛠️ Công Nghệ Sử Dụng

### Core Framework & Libraries

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 5.4.19 | Build tool & dev server |
| **React Router DOM** | 6.30.1 | Client-side routing |
| **TanStack Query** | 5.83.0 | Server state management |
| **Axios** | 1.12.2 | HTTP client |

### UI & Styling

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **Radix UI** | Various | Accessible component primitives |
| **shadcn/ui** | - | Component library (built on Radix) |
| **Lucide React** | 0.548.0 | Icon library |
| **next-themes** | 0.3.0 | Dark/light theme management |
| **tailwindcss-animate** | 1.0.7 | Animation utilities |

### Form & Validation

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **React Hook Form** | 7.61.1 | Form state management |
| **Zod** | 3.25.76 | Schema validation |
| **@hookform/resolvers** | 3.10.0 | Form validation integration |

### Testing

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **Vitest** | 2.1.9 | Unit testing framework |
| **@testing-library/react** | 16.1.0 | React component testing |
| **@testing-library/jest-dom** | 6.6.3 | DOM matchers |
| **jsdom** | 25.0.1 | DOM environment for tests |

### Development Tools

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **ESLint** | 9.32.0 | Code linting |
| **TypeScript ESLint** | 8.38.0 | TypeScript-specific linting |
| **PostCSS** | 8.5.6 | CSS processing |
| **Autoprefixer** | 10.4.21 | CSS vendor prefixing |

---

## 🔄 Luồng Dữ Liệu

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interaction                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              React Component (Page/Component)             │
│  - User triggers action (click, submit, etc.)            │
│  - Component calls service method                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)              │
│  - CatalogService, OrderService, etc.                    │
│  - Prepares request data                                 │
│  - Calls ApiClient                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              ApiClient (HTTP Layer)                       │
│  - Adds JWT token to headers                             │
│  - Handles request/response interceptors                 │
│  - Makes HTTP request to backend                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Microservices)                 │
│  - Processes request                                     │
│  - Returns JSON response                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              ApiClient (Response Handling)                │
│  - Intercepts response                                   │
│  - Handles errors (401, 403, network)                   │
│  - Returns data or throws error                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (Data Processing)             │
│  - Transforms response data                             │
│  - Returns typed data to component                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              React Query (State Management)              │
│  - Caches response data                                  │
│  - Manages loading/error states                         │
│  - Triggers re-render                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              React Component (UI Update)                 │
│  - Displays data or error                                │
│  - Updates UI based on state                             │
└─────────────────────────────────────────────────────────┘
```

### React Query Integration

Ứng dụng sử dụng **TanStack Query (React Query)** để quản lý server state:

- **Caching**: Tự động cache API responses
- **Refetching**: Tự động refetch khi cần thiết
- **Loading States**: Quản lý trạng thái loading/error
- **Optimistic Updates**: Hỗ trợ cập nhật optimistic

---

## 🔐 Bảo Mật và Xác Thực

### Authentication Flow

```
1. User enters credentials on AdminLogin page
   ↓
2. AdminAuthService.login() called
   ↓
3. POST /api/auth/admin/login
   ↓
4. Backend validates credentials
   ↓
5. Returns JWT token + user info
   ↓
6. Token stored in localStorage
   ↓
7. User redirected to dashboard
```

### Token Management

- **Storage**: JWT token lưu trong `localStorage` với key `admin_token`
- **Token Type**: Lưu trong `admin_tokenType` (mặc định: "Bearer")
- **Auto-injection**: ApiClient tự động thêm token vào header `Authorization`

### Protected Routes

```typescript
<ProtectedRoute requiredRole="admin">
  <StaffManagement />
</ProtectedRoute>
```

**ProtectedRoute** component:
- Kiểm tra authentication status
- Kiểm tra role-based access (nếu có `requiredRole`)
- Redirect đến login nếu chưa authenticated
- Redirect đến dashboard nếu không đủ quyền

### Role-Based Access Control (RBAC)

Các roles được hỗ trợ:
- `admin`: Quản trị viên (full access)
- `store_manager`: Quản lý cửa hàng
- `support_agent`: Nhân viên hỗ trợ

### Error Handling

**ApiClient Interceptors** xử lý:
- **401 Unauthorized**: Xóa token, redirect đến login
- **403 Forbidden**: Hiển thị thông báo lỗi, không redirect
- **Network Error**: Hiển thị thông báo lỗi mạng

---

## 🧭 Routing và Navigation

### Route Structure

```typescript
/admin/login              → AdminLogin (Public)
/admin/dashboard          → AdminDashboard (Protected)
/admin/staff              → StaffManagement (Admin only)
/admin/catalog            → CatalogManagement (Admin only)
/admin/inventory          → InventoryManagement (Admin/Store Manager)
/admin/orders             → OrderFulfillment (Admin/Store Manager)
/admin/consignments       → ConsignmentManagement (Admin/Store Manager)
/admin/support            → CustomerSupport (Admin/Support Agent)
/*                        → NotFound (404)
```

### Navigation Component

**AppSidebar** cung cấp:
- Sidebar navigation với menu items
- Active route highlighting
- Collapsible sidebar
- Role-based menu visibility

### Route Protection

Tất cả routes (trừ `/admin/login`) được bảo vệ bởi `ProtectedRoute`:
- Kiểm tra authentication
- Kiểm tra role permissions
- Loading state khi đang kiểm tra

---

## 📊 State Management

### Server State (React Query)

```typescript
const queryClient = new QueryClient();

// Usage in components
const { data, isLoading, error } = useQuery({
  queryKey: ['orders'],
  queryFn: () => OrderFulfillmentService.getAllOrders()
});
```

**React Query** quản lý:
- API data caching
- Loading states
- Error states
- Automatic refetching
- Background updates

### Local State (React useState/useReducer)

- Form state: Sử dụng React Hook Form
- UI state: useState cho local component state
- Theme state: next-themes provider

### Authentication State

- Lưu trong `localStorage`
- Managed bởi `AdminAuthService`
- Không sử dụng global state (Redux/Zustand)

---

## 🌐 API Integration

### ApiClient Architecture

**ApiClient** là singleton Axios instance:

```typescript
// Base URL
baseURL: 'https://api-dev.huongcungbookstore.com/api'

// Request Interceptor
- Adds JWT token from localStorage
- Sets Content-Type: application/json

// Response Interceptor
- Handles 401: Clear auth, redirect to login
- Handles 403: Return error message
- Handles network errors
- Extracts error messages from response
```

### Service Layer Pattern

Mỗi domain có service riêng:

```typescript
// Example: CatalogService.ts
export class CatalogService {
  static async getAllBooks(): Promise<Book[]> {
    const response = await ApiClient.create().get('/catalog/books');
    return response.data;
  }
}
```

**Services**:
- `AdminAuthService`: Authentication & authorization
- `CatalogService`: Books, authors, genres management
- `InventoryService`: Stock management
- `OrderFulfillmentService`: Order processing
- `StaffService`: Staff management
- `CustomerSupportService`: Customer support
- `ReviewService`: Review management

### API Endpoints Structure

```
/api/auth/admin/login
/api/catalog/books
/api/catalog/authors
/api/catalog/genres
/api/inventory/...
/api/orders/...
/api/staff/...
/api/support/...
```

---

## 🎨 Styling và UI Components

### Tailwind CSS

- **Utility-first**: Sử dụng Tailwind utility classes
- **Custom Theme**: Custom colors, spacing, animations
- **Dark Mode**: Hỗ trợ dark/light theme
- **Responsive**: Mobile-first responsive design

### Component Library (shadcn/ui)

Ứng dụng sử dụng **shadcn/ui** components:
- Built on **Radix UI** primitives
- Accessible by default
- Customizable với Tailwind
- TypeScript support

**Available Components**:
- `button`, `card`, `input`, `select`
- `dialog`, `dropdown-menu`, `tabs`
- `table`, `toast`, `tooltip`
- `sidebar`, `accordion`, `badge`
- Và nhiều components khác...

### Theme System

```typescript
// ThemeProvider from next-themes
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  {/* App content */}
</ThemeProvider>
```

- **CSS Variables**: Theme colors defined as CSS variables
- **Class-based**: Dark mode toggled via `class` attribute
- **System Preference**: Respects system theme preference

---

## 🧪 Testing

### Test Setup

- **Framework**: Vitest
- **Environment**: jsdom (browser-like environment)
- **Utilities**: @testing-library/react, @testing-library/jest-dom

### Test Configuration

```typescript
// vitest.config.ts
{
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts']
}
```

### Test Files Location

- Component tests: `*.test.tsx` cùng với component
- Service tests: `*.test.ts` cùng với service
- Example: `CartItem.test.tsx`, `AdminAuthService.test.ts`

### Running Tests

```bash
npm test              # Watch mode
npm run test:ui       # UI mode
npm run test:run      # Run once
npm run test:coverage # With coverage
```

---

## 📦 Build và Deployment

### Build Scripts

```json
{
  "dev": "vite",                    // Development server
  "build": "vite build",            // Production build
  "build:dev": "vite build --mode development",
  "preview": "vite preview",        // Preview production build
  "lint": "eslint ."                // Lint code
}
```

### Build Output

- Output directory: `dist/`
- Static assets: Optimized và hashed
- Code splitting: Automatic với Vite

### Environment Configuration

- Development: `https://api-dev.huongcungbookstore.com/api`
- Production: Có thể config qua environment variables

---

## 🔧 Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Code Organization Principles

1. **Separation of Concerns**:
   - Pages: Route components
   - Components: Reusable UI components
   - Services: API communication
   - Models: Type definitions

2. **Type Safety**:
   - TypeScript cho tất cả files
   - Strict type checking
   - Type definitions trong `models/`

3. **Component Reusability**:
   - UI components trong `components/ui/`
   - Domain-specific components trong `components/`

4. **Service Layer Pattern**:
   - Tất cả API calls qua service layer
   - Không gọi ApiClient trực tiếp từ components

---

## 📝 Best Practices

### Code Style

- **ESLint**: Enforced code style
- **TypeScript**: Strict mode enabled
- **Functional Components**: Sử dụng hooks
- **Custom Hooks**: Tái sử dụng logic

### Performance

- **Code Splitting**: Automatic với Vite
- **Lazy Loading**: Có thể implement cho routes
- **React Query Caching**: Giảm API calls
- **Memoization**: Sử dụng khi cần thiết

### Accessibility

- **Radix UI**: Accessible components
- **ARIA Labels**: Khi cần thiết
- **Keyboard Navigation**: Hỗ trợ đầy đủ

---

## 🔄 Future Improvements

### Potential Enhancements

1. **State Management**: Có thể thêm Zustand/Redux nếu cần global state
2. **Error Boundaries**: Implement React error boundaries
3. **Lazy Loading**: Lazy load routes để giảm bundle size
4. **PWA Support**: Thêm service worker cho offline support
5. **Internationalization**: Thêm i18n nếu cần đa ngôn ngữ
6. **E2E Testing**: Thêm Cypress/Playwright cho E2E tests

---

## 📚 Tài Liệu Tham Khảo

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [TanStack Query](https://tanstack.com/query)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)

---

**Tài liệu này được tạo tự động và cần được cập nhật khi có thay đổi trong kiến trúc dự án.**

