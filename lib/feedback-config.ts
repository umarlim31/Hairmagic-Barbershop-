export const FEEDBACK_MAX_LENGTH = 1500;
export const FEEDBACK_RATINGS = [
  { value: 1, label: "Kecewa", description: "Sangat tidak puas" },
  { value: 2, label: "Kurang puas", description: "Kurang puas" },
  { value: 3, label: "Cukup", description: "Cukup puas" },
  { value: 4, label: "Puas", description: "Puas" },
  { value: 5, label: "Sangat puas", description: "Sangat puas" },
] as const;

export type FeedbackRow = { id: string; rating: number; message: string; submittedDay: string };
export type FeedbackReport = {
  summary: { total: number; average: number; satisfied: number; distribution: { rating: number; count: number }[] };
  items: FeedbackRow[];
  nextCursor: string | null;
};
