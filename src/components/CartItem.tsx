import React from "react";
import { Link } from "react-router-dom";
import { CartItem as CartItemType } from "@/models/Cart";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  const bookImage = item.book.images?.[0]?.url || "";
  const authors = item.book.authors?.map((a) => a.name).join(", ") || "Unknown Author";
  const formatLabel = item.format === "physical" ? "Sách in" : "E-book";
  const bookDetailsUrl = `/books/${item.book.code}`;

  return (
    <Card className="border border-border">
      <CardContent className="px-6 py-4">
        <div className="flex gap-6">
          {/* Book Cover */}
          <Link 
            to={bookDetailsUrl}
            className="w-32 h-48 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img
              src={bookImage}
              alt={item.book.title}
              className="w-full h-full object-cover"
            />
          </Link>

          {/* Book Info */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <Link 
                to={bookDetailsUrl}
                className="block cursor-pointer hover:text-primary transition-colors"
              >
                <h3 className="text-base font-normal line-clamp-2 mb-1">
                  {item.book.title}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground mb-2">{authors}</p>
              <p className="text-xs text-muted-foreground mb-2">
                {formatLabel}
              </p>
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                <span className="text-base font-normal">
                  {formatPrice(item.price)}₫
                </span>
                <span className="text-sm text-muted-foreground">
                  Tổng: {formatPrice(item.subtotal)}₫
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Quantity Controls */}
                <div className="flex items-center border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => handleQuantityChange(-1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm font-normal min-w-[2.5rem] text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

