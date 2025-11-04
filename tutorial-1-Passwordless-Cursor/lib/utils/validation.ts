import { z } from "zod";

export const TodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  category: z.string().default("general"),
  dueDate: z.string().optional(),
  completed: z.boolean().default(false),
});

export type TodoInput = z.infer<typeof TodoSchema>;


