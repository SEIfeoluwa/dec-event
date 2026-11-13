import { describe, expect, it } from "vitest";

import { MESSAGES, RSVP_LIMITS } from "../../shared/rsvp";
import { rsvpSchema } from "./rsvpSchema";

const validRsvp = {
    fullName: "Ada Lovelace",
    phone: "(301) 555-1234",
    attendance: "yes",
    guestCount: "2",
    message: "",
    meal: "jollof",
};

// The form shows the first issue, so tests check that message.
const firstError = (overrides: Record<string, unknown>) => {
    const result = rsvpSchema.safeParse({ ...validRsvp, ...overrides });
    return result.success ? null : result.error.issues[0]?.message;
};

describe("rsvpSchema (guest form)", () => {
    it("accepts a valid attending RSVP and converts the guest count to a number", () => {
        const result = rsvpSchema.parse({ ...validRsvp, fullName: "  Ada Lovelace  " });

        expect(result).toMatchObject({
            fullName: "Ada Lovelace",
            attendance: "yes",
            guestCount: 2,
            meal: "jollof",
        });
    });

    it("sets 0 guests and no meal when not attending, ignoring hidden fields", () => {
        const result = rsvpSchema.parse({ ...validRsvp, attendance: "no", guestCount: "abc", meal: "amala" });

        expect(result.guestCount).toBe(0);
        expect(result.meal).toBeNull();
    });

    describe("name", () => {
        it.each(["", "   "])("rejects a blank name (%j)", (fullName) => {
            expect(firstError({ fullName })).toBe(MESSAGES.name);
        });

        it("rejects a name over the limit", () => {
            expect(firstError({ fullName: "a".repeat(RSVP_LIMITS.nameMax + 1) })).toBe(MESSAGES.nameTooLong);
        });

        it("accepts a name exactly at the limit", () => {
            expect(firstError({ fullName: "a".repeat(RSVP_LIMITS.nameMax) })).toBeNull();
        });
    });

    describe("phone", () => {
        it.each(["(301) 555-1234", "301-555-1234", "301.555.1234", "3015551234", "+1 301 555 1234"])(
            "accepts %j",
            (phone) => {
                expect(firstError({ phone })).toBeNull();
            },
        );

        it.each(["", "555-1234", "301555123", "2 301 555 1234", "301555123456"])("rejects %j", (phone) => {
            expect(firstError({ phone })).toBe(MESSAGES.phone);
        });
    });

    it.each(["", "maybe", undefined])("requires attendance to be yes or no (%j)", (attendance) => {
        expect(firstError({ attendance })).toBe(MESSAGES.attendance);
    });

    describe("guest count (when attending)", () => {
        it.each(["0", "-1", "1.5", "abc", ""])("rejects %j", (guestCount) => {
            expect(firstError({ guestCount })).toBe(MESSAGES.guests);
        });

        it("rejects more than the maximum", () => {
            expect(firstError({ guestCount: String(RSVP_LIMITS.guestsMax + 1) })).toBe(MESSAGES.guestsTooMany);
        });

        it.each(["1", String(RSVP_LIMITS.guestsMax), 3])("accepts %j", (guestCount) => {
            expect(firstError({ guestCount })).toBeNull();
        });
    });

    describe("message", () => {
        it("is optional", () => {
            expect(firstError({ message: undefined })).toBeNull();
        });

        it("rejects a message over the limit", () => {
            expect(firstError({ message: "a".repeat(RSVP_LIMITS.messageMax + 1) })).toBe(MESSAGES.messageTooLong);
        });
    });

    describe("meal", () => {
        // The guest form requires a meal through its pop-up; the schema allows
        // none so the admin "Add RSVP" form can leave it blank.
        it.each(["", undefined])("treats %j as no meal chosen", (meal) => {
            expect(rsvpSchema.parse({ ...validRsvp, meal }).meal).toBeNull();
        });

        it("rejects a meal that isn't on the menu", () => {
            expect(firstError({ meal: "pizza" })).not.toBeNull();
        });
    });
});
