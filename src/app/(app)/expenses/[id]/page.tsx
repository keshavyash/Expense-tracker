import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureHouseholdMember, getCategories, getCurrentProfile, getHouseholdMembers, getVendors } from "@/lib/data";
import { ExpenseForm } from "@/components/ExpenseForm";
import type { Expense } from "@/lib/database.types";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: expense } = await supabase
    .from("expenses")
    .select("*, vendor:vendors(name)")
    .eq("id", id)
    .single();

  if (!expense) notFound();

  const [categories, vendors, members, currentMember] = await Promise.all([
    getCategories(),
    getVendors(),
    getHouseholdMembers(),
    ensureHouseholdMember(),
  ]);
  const vendorName = (expense as unknown as { vendor: { name: string } | null }).vendor?.name ?? null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Edit expense</h1>
      <ExpenseForm
        categories={categories}
        vendors={vendors}
        members={members}
        currentMemberId={currentMember?.id ?? ""}
        existing={expense as Expense}
        existingVendorName={vendorName}
      />
    </div>
  );
}
