export type ExpenseType = "personal" | "common";
export type PaymentMethod = "card" | "cash" | "upi" | "bank_transfer";

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  expense_date: string;
  category_id: string;
  expense_type: ExpenseType;
  owner_id: string | null;
  payment_method: PaymentMethod;
  description: string | null;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithRelations extends Expense {
  category: Category | null;
  owner: Profile | null;
  added_by_profile: Profile | null;
}

// Minimal Database type so @supabase/ssr's generics are satisfied.
// Not exhaustive — expand if you start using supabase-generated types.
export type Database = Record<string, unknown>;
