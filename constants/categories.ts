/**
 * Single source of truth for product categories.
 * IDs are URL-safe slugs used in routes and product.category.
 */

export const CATEGORY_IDS = [
  "nariin-nogoo",
  "jims-jimsgene",
  "hataasan-jims",
  "amtlagch",
  "jimsni-sav-baglaa-boodol",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type CategoryConfig = {
  id: CategoryId;
  label: string;
  icon: "leaf-outline" | "nutrition-outline" | "cube-outline" | "flame-outline" | "archive-outline";
  bg: string;
  order: number;
};

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "nariin-nogoo",
    label: "Нарийн Ногоо",
    icon: "leaf-outline",
    bg: "#C8E6C9",
    order: 1,
  },
  {
    id: "jims-jimsgene",
    label: "Жимс Жимсгэнэ",
    icon: "nutrition-outline",
    bg: "#FFE0B2",
    order: 2,
  },
  {
    id: "hataasan-jims",
    label: "Хатаасан Жимс",
    icon: "cube-outline",
    bg: "#FFECB3",
    order: 3,
  },
  {
    id: "amtlagch",
    label: "Амтлагч",
    icon: "flame-outline",
    bg: "#F8BBD9",
    order: 4,
  },
  {
    id: "jimsni-sav-baglaa-boodol",
    label: "Жимсний сав баглаа боодол",
    icon: "archive-outline",
    bg: "#B3E5FC",
    order: 5,
  },
];

const BY_ID = new Map<CategoryId, CategoryConfig>(
  CATEGORIES.map((c) => [c.id, c])
);

export function getCategoryById(id: string): CategoryConfig | undefined {
  return BY_ID.get(id as CategoryId);
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id;
}

export function getCategoriesOrdered(): CategoryConfig[] {
  return [...CATEGORIES].sort((a, b) => a.order - b.order);
}
