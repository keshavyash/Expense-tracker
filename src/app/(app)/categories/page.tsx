import { ensureHouseholdMember, getCategories, getHouseholdMembers, getVendors } from "@/lib/data";
import { CategoryManager } from "@/components/CategoryManager";
import { VendorManager } from "@/components/VendorManager";
import { HouseholdMemberManager } from "@/components/HouseholdMemberManager";
import { signOut } from "@/lib/actions";

export default async function CategoriesPage() {
  const [categories, vendors, members, currentMember] = await Promise.all([
    getCategories(),
    getVendors(),
    getHouseholdMembers(),
    ensureHouseholdMember(),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Categories &amp; household</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Rename anything, including the defaults. Vendors are also added automatically the first
        time you type a new one on the expense form.
      </p>

      <h2 className="mb-3 text-sm font-semibold">Household members</h2>
      <HouseholdMemberManager members={members} currentMemberId={currentMember?.id ?? ""} />

      <h2 className="mb-3 mt-8 text-sm font-semibold">Categories</h2>
      <CategoryManager categories={categories} />

      <h2 className="mb-3 mt-8 text-sm font-semibold">Vendors</h2>
      <VendorManager vendors={vendors} />

      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="w-full rounded-sm border border-line py-2.5 text-sm text-ink-soft transition-std hover:border-danger hover:text-danger"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
