import { describe, expect, it } from "vitest";
import { cardInput, deckInput, ratingInput } from "@/lib/validators";

describe("ratingInput", () => {
  it.each([1, 2, 3, 4])("accepts rating %i", (rating) => {
    expect(ratingInput.safeParse({ rating }).success).toBe(true);
  });

  it.each([0, 5, -1, 2.5, "3", null, undefined, true])(
    "rejects %o",
    (rating) => {
      expect(ratingInput.safeParse({ rating }).success).toBe(false);
    },
  );

  it("rejects a payload with no rating at all", () => {
    expect(ratingInput.safeParse({}).success).toBe(false);
  });
});

describe("deckInput", () => {
  it("trims the name and nulls out blank optional fields", () => {
    const result = deckInput.parse({
      name: "  Spanish  ",
      description: "",
      language: "   ",
    });

    expect(result).toEqual({
      name: "Spanish",
      description: null,
      language: null,
    });
  });

  it("rejects a whitespace-only name", () => {
    expect(deckInput.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    expect(deckInput.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });
});

describe("cardInput", () => {
  it("requires both front and back", () => {
    expect(cardInput.safeParse({ front: "a", back: "" }).success).toBe(false);
    expect(cardInput.safeParse({ front: "", back: "b" }).success).toBe(false);
    expect(
      cardInput.safeParse({ front: "a", back: "b", example: "" }).success,
    ).toBe(true);
  });

  it("nulls out a blank example", () => {
    const result = cardInput.parse({ front: "a", back: "b", example: "  " });

    expect(result.example).toBeNull();
  });

  it("rejects front or back over 1000 characters", () => {
    const long = "a".repeat(1001);

    expect(cardInput.safeParse({ front: long, back: "b" }).success).toBe(false);
    expect(cardInput.safeParse({ front: "a", back: long }).success).toBe(false);
  });
});
