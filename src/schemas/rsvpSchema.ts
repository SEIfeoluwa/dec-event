import { z } from "zod";

export const rsvpSchema = z.object({
    firstName: z.string().trim().min(1, "Enter your first name."),
    lastName: z.string().trim().min(1, "Enter your last name."),
    phone: z.string().trim().min(1, "Enter your phone number."),
    attendance: z.enum(["yes", "no"], { error: "Select your attendance." }),
    guestCount: z.coerce
      .number({ error: "Enter the number of guests in your party." })
      .int("Guest count must be a whole number.")
      .min(1, "Guest count must be at least 1."),
    message: z.string().trim().max(500, "Message cannot exceed 500 characters.").optional(),
});

export type RSVPInput = z.infer<typeof rsvpSchema>;
