import { getCategories } from "@/lib/data";
import { CategoryManager } from "@/components/CategoryManager";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Categories</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Default categories can&apos;t be removed. Add your own for anything else you spend on.
      </p>
      <CategoryManager categories={categories} />
    </div>
  );
}
