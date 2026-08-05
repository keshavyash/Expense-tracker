import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  ExpenseWithRelations,
  HouseholdMember,
  Profile,
  Vendor,
} from "@/lib/database.types";

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

export async function getHouseholdMembers(): Promise<HouseholdMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_members")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as HouseholdMember[]) ?? [];
}

// Returns the household_member row representing the currently logged-in
// person — creating one (or claiming an unclaimed placeholder, e.g. one
// named "Spouse" added before that person ever signed up) if needed.
// This is what lets "Personal (Spouse)" work even before your spouse
// has an account: you add a placeholder member for her, and if she
// signs in later, her login gets linked to that same record.
export async function ensureHouseholdMember(): Promise<HouseholdMember | null> {
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
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  return (data as Category[]) ?? [];
}

export async function getVendors(): Promise<Vendor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });
  return (data as Vendor[]) ?? [];
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
      "*, category:categories(*), owner:household_members!expenses_owner_id_fkey(*), funded_by_member:household_members!expenses_funded_by_fkey(*), added_by_profile:profiles!expenses_added_by_fkey(*), vendor:vendors(*)"
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
