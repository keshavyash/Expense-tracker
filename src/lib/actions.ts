"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseType, PaymentMethod } from "@/lib/database.types";

export interface ExpenseInput {
  amount: number;
  expense_date: string;
  category_id: string;
  expense_type: ExpenseType;
  owner_id: string | null;
  payment_method: PaymentMethod;
  // whose account paid — null means the shared/common account
  funded_by: string | null;
  // free-typed vendor name; resolved to a vendor_id (creating one if needed)
  vendor_name: string | null;
  group_id: string | null;
  description: string | null;
}

async function resolveVendorId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vendorName: string | null,
  userId: string
): Promise<string | null> {
  const trimmed = vendorName?.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase
    .from("vendors")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return (existing as { id: string }).id;

  const { data: created, error } = await supabase
    .from("vendors")
    .insert({ name: trimmed, created_by: userId })
    .select("id")
    .single();

  // Race condition: someone else created the same vendor a moment ago.
  // Fall back to looking it up rather than failing the whole expense save.
  if (error) {
    const { data: retry } = await supabase
      .from("vendors")
      .select("id")
      .ilike("name", trimmed)
      .maybeSingle();
    if (retry) return (retry as { id: string }).id;
    throw new Error(error.message);
  }

  revalidatePath("/categories");
  return (created as { id: string }).id;
}

export async function addExpense(input: ExpenseInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const vendor_id = await resolveVendorId(supabase, input.vendor_name, user.id);

  const { error } = await supabase.from("expenses").insert({
    amount: input.amount,
    expense_date: input.expense_date,
    category_id: input.category_id,
    expense_type: input.expense_type,
    owner_id: input.owner_id,
    payment_method: input.payment_method,
    funded_by: input.funded_by,
    vendor_id,
    group_id: input.group_id,
    description: input.description,
    added_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");
}

export async function updateExpense(id: string, input: ExpenseInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const vendor_id = await resolveVendorId(supabase, input.vendor_name, user.id);

  const { error } = await supabase
    .from("expenses")
    .update({
      amount: input.amount,
      expense_date: input.expense_date,
      category_id: input.category_id,
      expense_type: input.expense_type,
      owner_id: input.owner_id,
      payment_method: input.payment_method,
      funded_by: input.funded_by,
      vendor_id,
      group_id: input.group_id,
      description: input.description,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");
}

export async function addCategory(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name can't be empty");

  const { error } = await supabase
    .from("categories")
    .insert({ name: trimmed, created_by: user.id });

  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function renameCategory(id: string, name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name can't be empty");

  const { error } = await supabase.from("categories").update({ name: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
  revalidatePath("/expenses");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function addGroup(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Group name can't be empty");

  const { data, error } = await supabase
    .from("groups")
    .insert({ name: trimmed, created_by: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/groups");
  return (data as { id: string }).id;
}

export async function renameGroup(id: string, name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Group name can't be empty");

  const { error } = await supabase.from("groups").update({ name: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
  revalidatePath("/expenses");
}

export async function deleteGroup(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

export async function addHouseholdMember(name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name can't be empty");

  const { error } = await supabase.from("household_members").insert({ name: trimmed });
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function renameHouseholdMember(id: string, name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name can't be empty");

  const { error } = await supabase
    .from("household_members")
    .update({ name: trimmed })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/");
}

// Exactly one household member can hold the Sodexo card — unset
// everyone else first, then flag the chosen one.
export async function setSodexoOwner(id: string) {
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("household_members")
    .update({ owns_sodexo: false })
    .eq("owns_sodexo", true);
  if (clearError) throw new Error(clearError.message);

  const { error: setError } = await supabase
    .from("household_members")
    .update({ owns_sodexo: true })
    .eq("id", id);
  if (setError) throw new Error(setError.message);

  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/expenses/new");
}

export async function addVendor(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Vendor name can't be empty");

  const { error } = await supabase.from("vendors").insert({ name: trimmed, created_by: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function renameVendor(id: string, name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Vendor name can't be empty");

  const { error } = await supabase.from("vendors").update({ name: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
  revalidatePath("/expenses");
}

export async function deleteVendor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
