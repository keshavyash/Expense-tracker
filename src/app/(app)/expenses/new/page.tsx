import { ensureHouseholdMember, getCategories, getCurrentProfile, getGroups, getHouseholdMembers, getVendors } from "@/lib/data";
import { ExpenseForm } from "@/components/ExpenseForm";
import { redirect } from "next/navigation";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const sp = await searchParams;

  const [categories, vendors, groups, members, currentMember] = await Promise.all([
    getCategories(),
    getVendors(),
    getGroups(),
    getHouseholdMembers(),
    ensureHouseholdMember(),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Add expense</h1>
      <ExpenseForm
        categories={categories}
        vendors={vendors}
        groups={groups}
        members={members}
        currentMemberId={currentMember?.id ?? ""}
        defaultGroupId={sp.group}
      />
    </div>
  );
}
