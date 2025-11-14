import { BookOpen, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-secondary/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <span className="text-xl font-bold text-foreground">Hương Cung</span>
                <p className="text-xs text-muted-foreground">Bookstore</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Nhà sách trực tuyến hàng đầu Việt Nam với hơn 10,000+ đầu sách 
              từ văn học Việt Nam đến quốc tế.
            </p>
            <div className="flex gap-3">
              <Button size="icon" variant="ghost" className="rounded-full">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Danh mục</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Văn học Việt Nam</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sách nước ngoài</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">E-books</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Best Sellers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sách mới</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn mua hàng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Phương thức thanh toán</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Hà Nội, TP.HCM, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>1900-xxxx</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@huongcung.vn</span>
              </li>
            </ul>

            <div>
              <p className="text-sm font-semibold mb-2">Nhận tin khuyến mãi</p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Email của bạn"
                  className="text-sm"
                />
                <Button variant="default" size="sm">
                  Đăng ký
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 Hương Cung Bookstore. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
