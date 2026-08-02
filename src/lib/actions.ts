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
  description: string | null;
}

export async function addExpense(input: ExpenseInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("expenses").insert({
    ...input,
    added_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");
}

export async function updateExpense(id: string, input: ExpenseInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update(input).eq("id", id);
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

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
