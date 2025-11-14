import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartItem } from "./CartItem";
import { CartItem as CartItemType } from "@/models/Cart";
import { Book } from "@/models";

const mockBook: Book = {
  code: "book-1",
  title: "Test Book Title",
  authors: [{ name: "Test Author" }],
  translators: [],
  images: [{ url: "https://example.com/book.jpg" }],
  hasPhysicalEdition: true,
  hasElectricEdition: false,
};

const mockCartItem: CartItemType = {
  id: "item-1",
  bookId: "book-1",
  book: mockBook,
  format: "physical",
  quantity: 2,
  price: 100000,
  subtotal: 200000,
};

describe("CartItem", () => {
  it("should render cart item with book information", () => {
    const onUpdateQuantity = vi.fn();
    const onRemove = vi.fn();

    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />
    );

    expect(screen.getByText("Test Book Title")).toBeInTheDocument();
    expect(screen.getByText("Test Author")).toBeInTheDocument();
    expect(screen.getByText("Sách in")).toBeInTheDocument();
  });

  it("should display formatted prices", () => {
    const onUpdateQuantity = vi.fn();
    const onRemove = vi.fn();

    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />
    );

    expect(screen.getByText("100,000₫")).toBeInTheDocument();
    expect(screen.getByText("Tổng: 200,000₫")).toBeInTheDocument();
  });

  it("should call onUpdateQuantity when increasing quantity", async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    const onRemove = vi.fn();

    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />
    );

    // Find all buttons and click the one that increases quantity (Plus icon)
    const buttons = screen.getAllByRole("button");
    // The Plus button should be the second button (after Minus)
    const plusButton = buttons[1];
    
    await user.click(plusButton);
    expect(onUpdateQuantity).toHaveBeenCalledWith("item-1", 3);
  });

  it("should call onUpdateQuantity when decreasing quantity", async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    const onRemove = vi.fn();

    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />
    );

    // Find all buttons and click the one that decreases quantity (Minus icon)
    const buttons = screen.getAllByRole("button");
    // The Minus button should be the first button
    const minusButton = buttons[0];
    
    await user.click(minusButton);
    expect(onUpdateQuantity).toHaveBeenCalledWith("item-1", 1);
  });

  it("should call onRemove when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    const onRemove = vi.fn();

    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />
    );

    // Find all buttons and click the remove button (Trash icon - should be last)
    const buttons = screen.getAllByRole("button");
    const removeButton = buttons[buttons.length - 1];
    
    await user.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith("item-1");
  });

  it("should display quantity correctly", () => {
    const onUpdateQuantity = vi.fn();
    const onRemove = vi.fn();

    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

