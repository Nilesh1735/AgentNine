import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryNav({ categories, active }: { categories: Category[]; active?: string }) {
  return <aside className="category-nav"><p className="eyebrow">Browse by category</p>{categories.map((category, index) => <Link className={active === category.slug ? "active" : ""} key={category.id} href={`/categories/${category.slug}`}>{category.name}<span>{String(index + 1).padStart(2, "0")}</span></Link>)}</aside>;
}
