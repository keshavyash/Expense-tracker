import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCategories, getCurrentProfile } from "@/lib/data";
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
    .select("*")
    .eq("id", id)
    .single();

  if (!expense) notFound();

  const [categories, profiles] = await Promise.all([getCategories(), getAllProfiles()]);
  const spouse = profiles.find((p) => p.id !== profile.id) ?? null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Edit expense</h1>
      <ExpenseForm
        categories={categories}
        currentProfile={profile}
        spouseProfile={spouse}
        existing={expense as Expense}
      />
    </div>
  );
}
