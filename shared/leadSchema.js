import { z } from "zod";

export const BUDGET_RANGES = ["<$5k", "$5k-$15k", "$15k-$50k", "$50k+"];

export const STATUSES = ["New", "Contacted", "Closed"];

// Used for both the React form (via @hookform/resolvers/zod) and the
// Express route (server-side re-validation). Keeping it in one file means
// client and server can never validate differently by accident.
export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  budget_range: z.enum(BUDGET_RANGES, {
    errorMap: () => ({ message: "Select a budget range" }),
  }),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters"),
  // Honeypot field: real users never see or fill this in.
  // Kept optional/blank here; the server checks it separately and
  // silently discards anything that fills it in.
  company: z.string().optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(STATUSES),
});
