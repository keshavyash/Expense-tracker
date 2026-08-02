import { createClient } from "@/lib/supabase/server";
import type { Category, ExpenseWithRelations, Profile } from "@/lib/database.types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as Profile[]) ?? [];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  return (data as Category[]) ?? [];
}

export interface ExpenseFilters {
  from?: string;
  to?: string;
  expenseType?: "personal" | "common";
  ownerId?: string;
  categoryId?: string;
  paymentMethod?: string;
  limit?: number;
}

export async function getExpenses(
  filters: ExpenseFilters = {}
): Promise<ExpenseWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("expenses")
    .select(
      "*, category:categories(*), owner:profiles!expenses_owner_id_fkey(*), added_by_profile:profiles!expenses_added_by_fkey(*)"
    )
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("expense_date", filters.from);
  if (filters.to) query = query.lte("expense_date", filters.to);
  if (filters.expenseType) query = query.eq("expense_type", filters.expenseType);
  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.paymentMethod) query = query.eq("payment_method", filters.paymentMethod);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) {
    console.error("getExpenses error", error);
    return [];
  }
  return (data as unknown as ExpenseWithRelations[]) ?? [];
}

export function monthRange(date = new Date()): { from: string; to: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = new Date(y, m, 1).toISOString().slice(0, 10);
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}
