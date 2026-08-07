import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureHouseholdMember, getCategories, getCurrentProfile, getGroups, getHouseholdMembers, getVendors } from "@/lib/data";
import { ExpenseForm } from "@/components/ExpenseForm";
import type { Expense } from "@/lib/database.types";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [profile, { data: expense }, categories, vendors, groups, members, currentMember] =
    await Promise.all([
      getCurrentProfile(),
      supabase.from("expenses").select("*, vendor:vendors(name)").eq("id", id).single(),
      getCategories(),
      getVendors(),
      getGroups(),
      getHouseholdMembers(),
      ensureHouseholdMember(),
    ]);

  if (!profile) redirect("/login");
  if (!expense) notFound();

  const vendorName = (expense as unknown as { vendor: { name: string } | null }).vendor?.name ?? null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-24">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Edit expense</h1>
      <ExpenseForm
        categories={categories}
        vendors={vendors}
        groups={groups}
        members={members}
        currentMemberId={currentMember?.id ?? ""}
        existing={expense as Expense}
        existingVendorName={vendorName}
      />
    </div>
  );
}
