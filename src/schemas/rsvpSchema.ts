import { z } from "zod";

const guestCountSchema = z.coerce
  .number()
  .int("Guest counts must be whole numbers.")
  .min(0, "Guest counts cannot be negative.")
  .max(2, "Guest counts cannot exceed 2.");

export const rsvpSchema = z.object({
    firstName: z.string().trim().min(1, "Enter your first name."),
    lastName: z.string().trim().min(1, "Enter your last name."),
    phone: z.string().trim().min(1, "Enter your phone number."),
    smsConsent: z.boolean().default(false),
    attendance: z.enum(["yes", "no"], { error: "Select your attendance." }),
    maleGuestCount: guestCountSchema,
    femaleGuestCount: guestCountSchema,
    childGuestCount: guestCountSchema,
    message: z.string().trim().max(500, "Message cannot exceed 500 characters.").optional(),
}).refine(
  ({ maleGuestCount, femaleGuestCount, childGuestCount }) =>
    maleGuestCount + femaleGuestCount + childGuestCount >= 1,
  {
    message: "Guest count must be at least 1.",
    path: ["maleGuestCount"],
  },
).refine(
  ({ maleGuestCount, femaleGuestCount, childGuestCount }) =>
    maleGuestCount + femaleGuestCount + childGuestCount <= 6,
  {
    message: "Guest count cannot exceed 6.",
    path: ["maleGuestCount"],
  },
);

export type RSVPInput = z.infer<typeof rsvpSchema>;
