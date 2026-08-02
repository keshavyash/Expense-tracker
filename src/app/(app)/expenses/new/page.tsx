import { getAllProfiles, getCategories, getCurrentProfile } from "@/lib/data";
import { ExpenseForm } from "@/components/ExpenseForm";
import { redirect } from "next/navigation";

export default async function NewExpensePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [categories, profiles] = await Promise.all([getCategories(), getAllProfiles()]);
  const spouse = profiles.find((p) => p.id !== profile.id) ?? null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Add expense</h1>
      <ExpenseForm categories={categories} currentProfile={profile} spouseProfile={spouse} />
    </div>
  );
}
