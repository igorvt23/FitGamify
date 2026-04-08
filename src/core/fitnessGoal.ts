import { FitnessGoal } from "../types";

const GAIN_PATTERNS = ["gain", "ganh", "massa", "masa", "muscle", "bulk", "hipertrof"];
const LOSE_PATTERNS = ["lose", "emagrec", "fat", "perder", "slim", "cut", "bajar"];
const MAINTAIN_PATTERNS = ["maintain", "manter", "saud", "health", "healthy", "equilibr", "keep"];

export function normalizeFitnessGoal(goal: FitnessGoal | string | null | undefined): FitnessGoal {
  if (goal === "lose" || goal === "gain" || goal === "maintain") {
    return goal;
  }
  if (typeof goal !== "string") {
    return "maintain";
  }

  const normalized = goal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  if (GAIN_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "gain";
  }
  if (LOSE_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "lose";
  }
  if (MAINTAIN_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "maintain";
  }

  return "maintain";
}
