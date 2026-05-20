import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function gradeLabel(grade: string) {
  return grade === "A_STAR" ? "A*" : grade;
}

export function attendancePercent(present: number, total: number) {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export function behaviourAverage(scores: number[]) {
  if (scores.length === 0) return 0;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}
