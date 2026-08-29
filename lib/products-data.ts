import { categories } from "./categories";

export interface StoreProduct {
  id: string;
  handle: string;
  name: string;
  price: number;
  badge?: string;
  image: string;
  images: string[];
  cardFeatures: string[];
  category: (typeof categories)[number];
  categoryOrder: number;
  gtin: string;
  stock?: number;
}

const [clipper, trimmer, shaver] = categories;

export const products: StoreProduct[] = [
  {
    id: "at-799",
    handle: "at-799",
    name: "HTC One Pro",
    price: 349,
    badge: "דגם הדגל",
    image: "/assets/products/at-799-single.jpg",
    images: [
      "/assets/products/at-799-single.jpg",
      "/assets/barbershop/at-799-barbershop.jpg",
      "/assets/barbershop/at-799-action.jpg",
    ],
    cardFeatures: ["9,000 סל״ד", "להב DLC", "עד 360 דקות"],
    category: clipper,
    categoryOrder: 1,
    gtin: "6971864102077",
  },
  {
    id: "at-599",
    handle: "at-599",
    name: "HTC Edge",
    price: 199,
    badge: "להב T חד",
    image: "/assets/products/at-599-official-clean.jpg",
    images: [
      "/assets/products/at-599-official-clean.jpg",
      "/assets/barbershop/at-599-barbershop.jpg",
      "/assets/barbershop/at-599-action-v2.png",
    ],
    cardFeatures: ["להב T", "מסך דיגיטלי", "4 מסרקים"],
    category: trimmer,
    categoryOrder: 1,
    gtin: "6971864102084",
  },
  {
    id: "at-158",
    handle: "at-158",
    name: "HTC Start",
    price: 129,
    badge: "למשפחה",
    image: "/assets/products/at-158-single-v2.png",
    images: [
      "/assets/products/at-158-single-v2.png",
      "/assets/barbershop/at-158-barbershop.jpg",
      "/assets/barbershop/at-158-action-v2.jpg",
    ],
    cardFeatures: ["4 מסרקים", "טעינת USB", "לכל המשפחה"],
    category: clipper,
    categoryOrder: 2,
    gtin: "6971864101933",
  },
  {
    id: "at-735",
    handle: "at-735",
    name: "HTC One Plus",
    price: 279,
    badge: "גוף מתכת מלא",
    image: "/assets/products/at-735-single-v2.png",
    images: [
      "/assets/products/at-735-single-v2.png",
      "/assets/barbershop/at-735-barbershop.jpg",
      "/assets/barbershop/at-735-action.jpg",
    ],
    cardFeatures: ["גוף מתכת", "מסך דיגיטלי", "5 מסרקים"],
    category: clipper,
    categoryOrder: 3,
    gtin: "6971864102039",
  },
  {
    id: "at-570",
    handle: "at-570",
    name: "HTC Trio",
    price: 149,
    badge: "להב T",
    image: "/assets/products/at-570-single-v2.png",
    images: [
      "/assets/products/at-570-single-v2.png",
      "/assets/barbershop/at-570-barbershop.jpg",
      "/assets/barbershop/at-570-action.jpg",
    ],
    cardFeatures: ["להב T", "מסרקי 1/2/3 מ״מ", "בסיס כלול"],
    category: trimmer,
    categoryOrder: 2,
    gtin: "6971864100592",
  },
  {
    id: "gt-667",
    handle: "gt-667",
    name: "HTC Glide",
    price: 169,
    badge: "2 ראשים",
    image: "/assets/products/gt-667-single-v2.png",
    images: [
      "/assets/products/gt-667-single-v2.png",
      "/assets/barbershop/gt-667-barbershop.jpg",
      "/assets/barbershop/gt-667-action.jpg",
    ],
    cardFeatures: ["2 ראשי גילוח", "גימור נקי", "ניקוי קל"],
    category: shaver,
    categoryOrder: 1,
    gtin: "6971864103166",
  },
];
