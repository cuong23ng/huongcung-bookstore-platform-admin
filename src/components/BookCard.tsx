import { Button } from "./ui/button";
import { HeartPlus, ShoppingBag, ShoppingCart } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { useColor } from 'color-thief-react';
import styles from './BookCard.module.css';
import { ColorUtils } from "../utils/ColorUtils";
import { useCart } from "../contexts/CartContext";
import { BookService } from "../services/BookService";

interface BookCardProps {
  id: string;
  title: string;
  authors: { name: string }[];
  price: string;
  originalPrice?: string;
  colorScheme?: string;
  image?: string
}

export const BookCard = ({
  id,
  title,
  authors,
  price,
  originalPrice,
  colorScheme,
  image
}: BookCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: dominantHex } = useColor(image || '', 'hex', { crossOrigin: 'anonymous', quality: 10 });

  const hsl = ColorUtils.hexToHsl(typeof dominantHex === 'string' ? dominantHex : '');
  const bgClass = ColorUtils.pickBackgroundSchemeClassByHue(hsl?.h, styles);
  
  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      // Fetch full book data to add to cart
      const bookService = BookService.getInstance();
      const bookData = await bookService.getBookDetails(id);
      
      if (!bookData) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin sách. Vui lòng thử lại.",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll use a default price since Book model doesn't have price
      // In a real implementation, price should come from the API
      const defaultPrice = 0; // TODO: Get actual price from API
      
      // Add physical book to cart (format selection can be added later)
      addItem(bookData, "physical", 1, defaultPrice);
      
      toast({
        title: "Đã thêm vào giỏ hàng",
        description: `"${title}" đã được thêm vào giỏ hàng của bạn.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm sách vào giỏ hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      // Fetch full book data to add to cart
      const bookService = BookService.getInstance();
      const bookData = await bookService.getBookDetails(id);
      
      if (!bookData) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin sách. Vui lòng thử lại.",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll use a default price since Book model doesn't have price
      // In a real implementation, price should come from the API
      const defaultPrice = 0; // TODO: Get actual price from API
      
      // Add physical book to cart (format selection can be added later)
      addItem(bookData, "physical", 1, defaultPrice);
      
      // TODO: Navigate to checkout page when it's implemented
      // navigate("/checkout");
      
      // For now, just show a message that checkout will be implemented
      // Uncomment the navigate line above when checkout page is ready
      toast({
        title: "Đã thêm vào giỏ hàng",
        description: `"${title}" đã được thêm vào giỏ hàng của bạn.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm sách vào giỏ hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleAddToFavorites = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    toast({
      title: "Đã thêm vào danh sách yêu thích",
      description: `"${title}" đã được thêm vào danh sách yêu thích.`,
    });
  };

  const handleQuickView = () => {
    navigate(`/books/${id}`);
  };
  
  return (
    <div className="group relative">
      {/* Book cover */}
      <div 
        className={`relative aspect-[5/7] mb-4 group/cover cursor-pointer ${bgClass}`}
        onClick={handleQuickView}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="h-5/6 bg-white/95 flex items-center justify-center shadow-xl">
            <img 
              src={image} 
              alt="book-cover"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={(e) => handleAddToFavorites(e)}
          >
            <HeartPlus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={(e) => handleAddToCart(e)}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Book info */}
      <div className="space-y-2">
        <div>
          <Link to={`/books/${id}`}>
            <h3 className="text-sm font-normal line-clamp-2 leading-relaxed cursor-pointer">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 cursor-pointer">{authors.map((author, index) => (
            <>
              <span key={author.name} className={`text-xs transition-colors duration-300 cursor-pointer mt-1`}>{author.name}</span>
              {index < authors.length - 1 && ", "}
            </>
          ))}</p>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-normal">{price}₫</span>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-none border-muted-foreground/70 text-muted-foreground hover:bg-muted hover:text-muted-foreground text-xs px-2 py-1"
            onClick={handleBuyNow}
          >
            Mua
          </Button>
        </div>
      </div>
    </div>
  );
};
