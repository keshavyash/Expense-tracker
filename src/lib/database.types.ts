export type ExpenseType = "personal" | "common";
export type PaymentMethod = "card" | "cash" | "upi" | "bank_transfer";

// A login — someone who can sign into the app.
export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

// A person an expense can belong to. Independent of login — a
// household member doesn't need an account (linked_user_id is null
// until/unless they ever sign in themselves).
export interface HouseholdMember {
  id: string;
  name: string;
  linked_user_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  expense_date: string;
  category_id: string;
  expense_type: ExpenseType;
  owner_id: string | null; // household_members.id
  payment_method: PaymentMethod;
  funded_by: string | null; // household_members.id, null = common account
  vendor_id: string | null;
  description: string | null;
  added_by: string; // profiles.id — who was logged in when this was saved
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithRelations extends Expense {
  category: Category | null;
  owner: HouseholdMember | null;
  funded_by_member: HouseholdMember | null;
  added_by_profile: Profile | null;
  vendor: Vendor | null;
}

// Minimal Database type so @supabase/ssr's generics are satisfied.
// Not exhaustive — expand if you start using supabase-generated types.
export type Database = Record<string, unknown>;
