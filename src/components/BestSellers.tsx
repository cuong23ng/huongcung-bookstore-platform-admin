import { BookCard } from "./BookCard";

export type BestSellerItem = {
  id: string;
  title: string;
  authors: { name: string }[];
  price: string;
  originalPrice?: string;
  colorScheme?: string;
  image?: string;
};

const bestSellers: BestSellerItem[] = [
  {
    id: "vapeur",
    title: "Vapeur",
    authors: [{ name: "Tác giả" }],
    price: "635,000",
    colorScheme: "hsl(35, 50%, 85%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  },
  {
    id: "nhung-noi-hoang-hot",
    title: "Những nỗi hoang hót của cậu học sinh",
    authors: [{ name: "Nguyễn Nhật Ánh" }],
    price: "138,000",
    colorScheme: "hsl(75, 40%, 45%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  },
  {
    id: "mot-nguoi-ten-la-thu-nam",
    title: "Một người tên là Thứ Năm",
    authors: [{ name: "Patrick Süskind" }],
    price: "141,000",
    colorScheme: "hsl(210, 50%, 60%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  },
  {
    id: "khong-co-vua",
    title: "Không có vua (tái bản)",
    authors: [{ name: "Vũ Trọng Phụng" }],
    price: "106,000",
    colorScheme: "hsl(75, 45%, 50%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  },
  {
    id: "hanh-phuc-cua-ja",
    title: "Hạnh Phúc Của Ja",
    authors: [{ name: "Haruki Murakami" }],
    price: "125,000",
    colorScheme: "hsl(220, 40%, 45%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  },
  {
    id: "ly-thuyet-truyen-ngan",
    title: "Lý Thuyết Truyện Ngắn",
    authors: [{ name: "Thorstein Veblen" }],
    price: "95,000",
    colorScheme: "hsl(140, 30%, 50%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  },
  {
    id: "dien-anh-cua-toi",
    title: "Điện Ảnh Của Tôi",
    authors: [{ name: "Jord LIM" }],
    price: "180,000",
    colorScheme: "hsl(240, 50%, 35%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  },
  {
    id: "song-dep",
    title: "Sống Đẹp",
    authors: [{ name: "Meik Wiking" }],
    price: "89,000",
    colorScheme: "hsl(0, 0%, 60%)",
    image: "https://lh4.googleusercontent.com/proxy/OyyE8zHP5jix2YD_EgZptou4aWA09cYNp4xKN8-p2r1Y8XreCKNytdqRXhiyW-hCkKJaM1eUxSNCys2sDES6XEL_CgI5bkX4P4Ky2tm4VWOoXFHDBA"
  }
];

export const BestSellers = ({ items }: { items?: BestSellerItem[] }) => {
  const data = items && items.length > 0 ? items : bestSellers;
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {data.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      </div>
    </section>
  );
};
