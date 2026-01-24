# Hướng dẫn Cài đặt Giao diện Admin - Huong Cung Bookstore

## 📋 Tổng quan

Giao diện **Admin Dashboard** của hệ thống **Huong Cung Bookstore** được xây dựng bằng **React 18** và **TypeScript**, sử dụng **Vite** làm build tool. Đây là ứng dụng Single Page Application (SPA) dành cho quản trị viên để quản lý toàn bộ hệ thống.

### Công nghệ sử dụng

- **React 18.3+**: UI framework
- **TypeScript 5.8+**: Type safety
- **Vite 5.4+**: Build tool và dev server
- **React Router 6.30+**: Client-side routing
- **React Query (TanStack Query) 5.83+**: Data fetching và caching
- **Axios 1.12+**: HTTP client
- **Tailwind CSS 3.4+**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Vitest 2.1+**: Unit testing framework

### Tính năng chính

- 🔐 **Quản lý xác thực**: Đăng nhập/đăng xuất admin
- 📊 **Dashboard**: Thống kê doanh thu, đơn hàng, sản phẩm
- 📚 **Quản lý Catalog**: Quản lý sách, tác giả, thể loại
- 📦 **Quản lý Kho hàng**: Quản lý tồn kho đa thành phố
- 🛒 **Quản lý Đơn hàng**: Xử lý và theo dõi đơn hàng
- 👥 **Quản lý Nhân viên**: Quản lý tài khoản nhân viên
- 💬 **Hỗ trợ Khách hàng**: Xử lý yêu cầu khách hàng
- 📋 **Quản lý Ký gửi**: Xử lý đơn hàng ký gửi

---

## 🔧 Yêu cầu Hệ thống

### Phần mềm cần thiết

1. **Node.js** (phiên bản 18.0 trở lên, khuyến nghị 20.x)
   - [Tải Node.js](https://nodejs.org/)
   - Kiểm tra version: `node -v`

2. **npm** (phiên bản 9.0 trở lên) hoặc **yarn** hoặc **pnpm**
   - npm thường đi kèm với Node.js
   - Kiểm tra version: `npm -v`

3. **Git** (để clone repository)
   - [Tải Git](https://git-scm.com/)

### Yêu cầu phần cứng (tối thiểu)

- **RAM**: 4GB (khuyến nghị 8GB)
- **CPU**: 2 cores (khuyến nghị 4 cores)
- **Ổ cứng**: 2GB dung lượng trống

### Trình duyệt hỗ trợ

- Chrome/Edge (phiên bản mới nhất)
- Firefox (phiên bản mới nhất)
- Safari (phiên bản mới nhất)

---

## 🚀 Cài đặt nhanh

### Bước 1: Clone repository

```bash
# Clone toàn bộ repository
git clone <repository-url>
cd FinalProject/frontend/hc-bookstore-admin
```

### Bước 2: Cài đặt dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install

# Hoặc sử dụng pnpm
pnpm install
```

### Bước 3: Cấu hình môi trường

Tạo file `.env` trong thư mục gốc của project (nếu chưa có):

```env
# API Base URL
VITE_API_BASE_URL=https://api-dev.huongcungbookstore.com/api

# Environment
VITE_ENV=development
```

**Lưu ý**: 
- Đối với môi trường development, API URL mặc định đã được cấu hình trong `vite.config.ts` và `ApiClient.ts`
- Nếu backend chạy ở localhost, bạn có thể cập nhật proxy trong `vite.config.ts`

### Bước 4: Khởi động development server

```bash
# Sử dụng npm
npm run dev

# Hoặc sử dụng yarn
yarn dev

# Hoặc sử dụng pnpm
pnpm dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

### Bước 5: Mở trình duyệt

Mở trình duyệt và truy cập: `http://localhost:5173`

---

## ⚙️ Cấu hình chi tiết

### Cấu hình API Base URL

#### Cách 1: Sử dụng Environment Variables

Tạo file `.env` hoặc `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Sau đó cập nhật `src/integrations/ApiClient.ts`:

```typescript
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api-dev.huongcungbookstore.com/api',
  // ...
});
```

#### Cách 2: Cấu hình Proxy trong Vite

Chỉnh sửa `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // Backend API URL
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
});
```

Khi sử dụng proxy, các request đến `/api/*` sẽ được chuyển tiếp đến backend.

### Cấu hình Port

Mặc định, dev server chạy trên port **5173**. Để thay đổi:

1. **Cách 1**: Chỉnh sửa `vite.config.ts`:
   ```typescript
   server: {
     port: 3000, // Port mới
   }
   ```

2. **Cách 2**: Sử dụng command line:
   ```bash
   npm run dev -- --port 3000
   ```

### Cấu hình Allowed Hosts

Để truy cập từ các domain khác, cập nhật `vite.config.ts`:

```typescript
server: {
  allowedHosts: [
    "admin.huongcungbookstore.com",
    "localhost",
    ".local"
  ],
}
```

---

## 🏗️ Build cho Production

### Build ứng dụng

```bash
# Build cho production
npm run build

# Build cho development (với source maps)
npm run build:dev
```

Sau khi build, các file sẽ được tạo trong thư mục `dist/`.

### Preview build production

```bash
# Xem trước build production
npm run preview
```

### Deploy

#### Deploy lên Static Hosting

1. **Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**:
   - Kéo thả thư mục `dist/` lên Netlify
   - Hoặc kết nối với Git repository

3. **GitHub Pages**:
   ```bash
   npm install -g gh-pages
   npm run build
   gh-pages -d dist
   ```

#### Deploy lên Server

1. Build ứng dụng:
   ```bash
   npm run build
   ```

2. Copy thư mục `dist/` lên server

3. Cấu hình web server (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name admin.huongcungbookstore.com;
       root /var/www/admin/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## 🧪 Testing

### Chạy tests

```bash
# Chạy tests trong watch mode
npm run test

# Chạy tests với UI
npm run test:ui

# Chạy tests một lần
npm run test:run

# Chạy tests với coverage
npm run test:coverage
```

### Cấu trúc Testing

- **Test files**: Đặt trong cùng thư mục với file source, đuôi `.test.ts` hoặc `.test.tsx`
- **Test setup**: `src/test/setup.ts`
- **Testing Library**: Sử dụng `@testing-library/react` và `@testing-library/jest-dom`

### Ví dụ Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
```

---

## 🔍 Linting và Code Quality

### Chạy ESLint

```bash
# Kiểm tra lỗi linting
npm run lint

# Tự động fix một số lỗi
npm run lint -- --fix
```

### Cấu hình Editor

Khuyến nghị sử dụng **VS Code** với các extensions:

- **ESLint**: Tự động phát hiện lỗi linting
- **Prettier**: Format code tự động
- **TypeScript**: Hỗ trợ TypeScript
- **Tailwind CSS IntelliSense**: Autocomplete cho Tailwind

---

## 📁 Cấu trúc Dự án

```
hc-bookstore-admin/
├── public/                 # Static files
├── src/
│   ├── components/        # React components
│   │   ├── catalog/       # Catalog management components
│   │   ├── dashboard/     # Dashboard charts
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # API client và integrations
│   ├── lib/               # Utility functions
│   ├── models/            # TypeScript types và interfaces
│   ├── pages/             # Page components
│   │   ├── catalog/       # Catalog pages
│   │   ├── orders/        # Order pages
│   │   └── consignments/  # Consignment pages
│   ├── services/          # API service layers
│   ├── test/              # Test utilities
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── tailwind.config.ts     # Tailwind config
└── vitest.config.ts       # Vitest config
```

---

## 🐛 Xử lý Sự cố (Troubleshooting)

### Lỗi: "Cannot find module" hoặc "Module not found"

**Nguyên nhân**: Dependencies chưa được cài đặt hoặc node_modules bị lỗi.

**Giải pháp**:
```bash
# Xóa node_modules và lock files
rm -rf node_modules package-lock.json

# Cài đặt lại
npm install
```

### Lỗi: "Port 5173 is already in use"

**Nguyên nhân**: Port đã được sử dụng bởi process khác.

**Giải pháp**:
```bash
# Windows: Tìm và kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac: Tìm và kill process
lsof -ti:5173 | xargs kill -9

# Hoặc sử dụng port khác
npm run dev -- --port 3000
```

### Lỗi: "Network Error" khi gọi API

**Nguyên nhân**: Backend chưa chạy hoặc CORS chưa được cấu hình.

**Giải pháp**:
1. Kiểm tra backend đã chạy chưa
2. Kiểm tra API URL trong `ApiClient.ts` hoặc `.env`
3. Kiểm tra CORS configuration ở backend
4. Sử dụng proxy trong `vite.config.ts` nếu backend chạy ở localhost

### Lỗi: "TypeScript errors"

**Nguyên nhân**: Type definitions không đúng hoặc thiếu.

**Giải pháp**:
```bash
# Cài đặt lại type definitions
npm install --save-dev @types/node @types/react @types/react-dom

# Kiểm tra tsconfig.json
# Đảm bảo "strict": true hoặc các cấu hình phù hợp
```

### Lỗi: "Tailwind CSS not working"

**Nguyên nhân**: Tailwind chưa được cấu hình đúng.

**Giải pháp**:
1. Kiểm tra `tailwind.config.ts` có đúng cấu hình không
2. Kiểm tra `postcss.config.js` có tồn tại không
3. Đảm bảo `index.css` import Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### Lỗi: "Build failed"

**Nguyên nhân**: Có lỗi trong code hoặc cấu hình.

**Giải pháp**:
1. Chạy linter để tìm lỗi:
   ```bash
   npm run lint
   ```
2. Kiểm tra TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```
3. Xem logs chi tiết khi build:
   ```bash
   npm run build -- --debug
   ```

### Lỗi: "Authentication token not found"

**Nguyên nhân**: Token chưa được lưu trong localStorage.

**Giải pháp**:
1. Đảm bảo đã đăng nhập thành công
2. Kiểm tra localStorage trong DevTools:
   - `admin_token`
   - `admin_tokenType`
   - `admin_userId`
3. Kiểm tra `ApiClient.ts` có đúng logic inject token không

---

## 🔐 Bảo mật

### Best Practices

1. **Không commit sensitive data**:
   - Thêm `.env.local` vào `.gitignore`
   - Không commit API keys, secrets

2. **HTTPS trong Production**:
   - Luôn sử dụng HTTPS cho API calls
   - Cấu hình CORS đúng cách ở backend

3. **Token Management**:
   - Token được lưu trong localStorage (có thể xem xét httpOnly cookies)
   - Token tự động được inject vào requests qua Axios interceptor
   - Token được clear khi logout hoặc nhận 401

4. **Input Validation**:
   - Sử dụng Zod cho form validation
   - Validate input ở cả client và server

---

## 📚 Tài liệu Tham khảo

### Công nghệ chính

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

### Testing

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

### Deployment

- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com/)

---

## 🛠️ Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Khởi động development server |
| `npm run build` | Build cho production |
| `npm run build:dev` | Build cho development (có source maps) |
| `npm run preview` | Preview build production |
| `npm run lint` | Chạy ESLint |
| `npm run test` | Chạy tests trong watch mode |
| `npm run test:ui` | Chạy tests với UI |
| `npm run test:run` | Chạy tests một lần |
| `npm run test:coverage` | Chạy tests với coverage report |

---

## 📞 Hỗ trợ

Nếu gặp vấn đề trong quá trình cài đặt:

1. **Kiểm tra logs**: Xem console và terminal để tìm lỗi cụ thể
2. **Kiểm tra versions**: Đảm bảo Node.js và npm đúng version yêu cầu
3. **Xóa cache**: 
   ```bash
   rm -rf node_modules .vite dist
   npm install
   ```
4. **Tạo issue**: Tạo issue trên repository với:
   - Mô tả lỗi cụ thể
   - Steps to reproduce
   - Logs và error messages
   - Environment info (OS, Node version, npm version)

---

## 📝 Changelog

### v0.0.0 (2024)
- Phiên bản đầu tiên
- Đầy đủ tính năng quản lý admin
- Tích hợp với backend microservices

---

## 🎯 Next Steps

Sau khi cài đặt thành công:

1. **Cấu hình API URL**: Cập nhật API base URL trong `ApiClient.ts` hoặc `.env`
2. **Kiểm tra kết nối**: Đảm bảo backend đang chạy và có thể kết nối
3. **Đăng nhập**: Sử dụng tài khoản admin để đăng nhập
4. **Khám phá tính năng**: Xem các trang quản lý khác nhau

---

**Chúc bạn cài đặt thành công! 🎉**
