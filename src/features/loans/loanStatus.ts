import type { StatusTone } from "@/theme";

/**
 * `CustomerLoan.status` has no confirmed enum anywhere in the Lending
 * contract (`{ type: string }`, `additionalProperties: true`) — these are
 * disclosed, case-insensitive heuristics over whatever string the backend
 * actually returns, not confirmed literal values. Used by the Loans tab
 * (Figma "Loan 05 — My Loans", node 437:237) and the overdue-loan warning.
 */
export function loanStatusTone(status: string): StatusTone {
  if (/overdue|delinquent|past.?due|default/i.test(status)) return "error";
  if (/paid|closed|complete|written.?off/i.test(status)) return "info";
  return "success";
}

export function isLoanOverdue(status: string): boolean {
  return /overdue|delinquent|past.?due/i.test(status);
}
