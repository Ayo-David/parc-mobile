import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * CONFIRMED CONTRACT GAP (PLAN.md "Real blockers"): the savings contract has
 * no endpoint to list a customer's goals, fixed deposits, or recurring
 * plans — only `POST` (create) and, for fixed deposits only, `GET
 * /v1/fixed-deposits/:id` (refetch by id, not list). A goal or recurring
 * plan's id is only ever returned once, at creation time. This store
 * persists those ids locally (device-only, not synced) so the Savings tab
 * can show what the customer created in this app without inventing a
 * server-side listing endpoint that doesn't exist. If the customer
 * reinstalls the app or switches devices, this history is lost — a real,
 * disclosed limitation until the backend adds list endpoints.
 */
export interface TrackedGoal {
  id: string;
  savingsAccountId: string;
  name: string;
  targetAmountMinor: string;
  currency: string;
  targetDate: string;
  status: "ACTIVE" | "CANCELLED";
}

export interface TrackedFixedDeposit {
  id: string;
}

export interface TrackedRecurringPlan {
  id: string;
  savingsAccountId: string;
  amountMinor: string;
  currency: string;
  frequency: string;
  nextExecutionDate: string;
}

interface SavingsRecordsState {
  goals: TrackedGoal[];
  fixedDeposits: TrackedFixedDeposit[];
  recurringPlans: TrackedRecurringPlan[];
  addGoal: (goal: TrackedGoal) => void;
  updateGoalStatus: (id: string, status: "ACTIVE" | "CANCELLED") => void;
  addFixedDeposit: (fixedDeposit: TrackedFixedDeposit) => void;
  addRecurringPlan: (plan: TrackedRecurringPlan) => void;
}

export const useSavingsRecordsStore = create<SavingsRecordsState>()(
  persist(
    (set) => ({
      goals: [],
      fixedDeposits: [],
      recurringPlans: [],
      addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),
      updateGoalStatus: (id, status) => set((state) => ({ goals: state.goals.map((goal) => (goal.id === id ? { ...goal, status } : goal)) })),
      addFixedDeposit: (fixedDeposit) => set((state) => ({ fixedDeposits: [fixedDeposit, ...state.fixedDeposits] })),
      addRecurringPlan: (plan) => set((state) => ({ recurringPlans: [plan, ...state.recurringPlans] })),
    }),
    { name: "parc-savings-records", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
