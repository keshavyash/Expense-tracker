import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  ExpenseWithRelations,
  Group,
  HouseholdMember,
  Profile,
  Vendor,
} from "@/lib/database.types";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
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
});

export const getHouseholdMembers = cache(async (): Promise<HouseholdMember[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_members")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as HouseholdMember[]) ?? [];
});

// Returns the household_member row representing the currently logged-in
// person — creating one (or claiming an unclaimed placeholder, e.g. one
// named "Spouse" added before that person ever signed up) if needed.
// This is what lets "Personal (Spouse)" work even before your spouse
// has an account: you add a placeholder member for her, and if she
// signs in later, her login gets linked to that same record.
export const ensureHouseholdMember = cache(async (): Promise<HouseholdMember | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("household_members")
    .select("*")
    .eq("linked_user_id", user.id)
    .maybeSingle();
  if (existing) return existing as HouseholdMember;

  const { data: unclaimed } = await supabase
    .from("household_members")
    .select("*")
    .is("linked_user_id", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (unclaimed) {
    const { data: linked, error } = await supabase
      .from("household_members")
      .update({ linked_user_id: user.id })
      .eq("id", (unclaimed as HouseholdMember).id)
      .select("*")
      .single();
    if (!error && linked) return linked as HouseholdMember;
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "You";

  const { data: created } = await supabase
    .from("household_members")
    .insert({ name: displayName, linked_user_id: user.id })
    .select("*")
    .single();

  return (created as HouseholdMember) ?? null;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  return (data as Category[]) ?? [];
});

export const getVendors = cache(async (): Promise<Vendor[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });
  return (data as Vendor[]) ?? [];
});

export const getGroups = cache(async (): Promise<Group[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Group[]) ?? [];
});

// Running total + expense count per group, for the groups list page.
export async function getGroupTotals(): Promise<
  Record<string, { total: number; count: number }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("group_id, amount")
    .not("group_id", "is", null);

  const totals: Record<string, { total: number; count: number }> = {};
  for (const row of (data as { group_id: string; amount: number }[]) ?? []) {
    const bucket = totals[row.group_id] ?? { total: 0, count: 0 };
    bucket.total += Number(row.amount);
    bucket.count += 1;
    totals[row.group_id] = bucket;
  }
  return totals;
}

export interface ExpenseFilters {
  from?: string;
  to?: string;
  expenseType?: "personal" | "common";
  ownerId?: string;
  categoryId?: string;
  paymentMethod?: string;
  groupId?: string;
  limit?: number;
}

export async function getExpenses(
  filters: ExpenseFilters = {}
): Promise<ExpenseWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("expenses")
    .select(
      "*, category:categories(*), owner:household_members!expenses_owner_id_fkey(*), funded_by_member:household_members!expenses_funded_by_fkey(*), added_by_profile:profiles!expenses_added_by_fkey(*), vendor:vendors(*), group:groups(*)"
    )
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("expense_date", filters.from);
  if (filters.to) query = query.lte("expense_date", filters.to);
  if (filters.expenseType) query = query.eq("expense_type", filters.expenseType);
  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.paymentMethod) query = query.eq("payment_method", filters.paymentMethod);
  if (filters.groupId) query = query.eq("group_id", filters.groupId);
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
