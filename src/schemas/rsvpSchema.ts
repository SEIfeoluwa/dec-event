import { z } from "zod";

import { MESSAGES, RSVP_LIMITS, normalizePhone } from "../../shared/rsvp";

// Form-side validation for the guest RSVP form and admin "Add RSVP" pop-up.
// Uses the same limits and messages as the API (shared/rsvp.ts).
const rsvpFieldsSchema = z.object({
    fullName: z.string().trim().min(1, MESSAGES.name).max(RSVP_LIMITS.nameMax, MESSAGES.nameTooLong),
    phone: z.string().trim().refine((phone) => normalizePhone(phone) !== null, MESSAGES.phone),
    attendance: z.enum(["yes", "no"], { error: MESSAGES.attendance }),
    // Only checked when attending; the field is hidden for "no".
    guestCount: z.union([z.string(), z.number()]),
    message: z.string().trim().max(RSVP_LIMITS.messageMax, MESSAGES.messageTooLong).optional(),
});

export const rsvpSchema = rsvpFieldsSchema.transform((data, ctx) => {
    if (data.attendance === "no") {
        return { ...data, guestCount: 0 };
    }

    const guestCount = Number(data.guestCount);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
        ctx.addIssue({ code: "custom", path: ["guestCount"], message: MESSAGES.guests });
        return z.NEVER;
    }

    if (guestCount > RSVP_LIMITS.guestsMax) {
        ctx.addIssue({ code: "custom", path: ["guestCount"], message: MESSAGES.guestsTooMany });
        return z.NEVER;
    }

    return { ...data, guestCount };
});

export type RSVPInput = z.infer<typeof rsvpSchema>;
