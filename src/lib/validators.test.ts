import { describe, expect, it } from "vitest";
import {
  CSV_ROW_LIMIT,
  cardInput,
  csvImportRows,
  deckInput,
  ratingInput,
} from "@/lib/validators";

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

describe("csvImportRows", () => {
  const row = { front: "der Hund", back: "the dog", example: "" };

  it("accepts a batch at exactly the 500-row cap", () => {
    const rows = Array.from({ length: CSV_ROW_LIMIT }, () => ({ ...row }));

    expect(csvImportRows.safeParse(rows).success).toBe(true);
  });

  it("rejects a batch over the cap", () => {
    const rows = Array.from({ length: CSV_ROW_LIMIT + 1 }, () => ({ ...row }));
    const result = csvImportRows.safeParse(rows);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("500");
  });

  it("rejects an empty batch", () => {
    expect(csvImportRows.safeParse([]).success).toBe(false);
  });

  it("rejects the whole batch if any row is invalid", () => {
    const rows = [row, { front: "  ", back: "the cat", example: "" }];

    expect(csvImportRows.safeParse(rows).success).toBe(false);
  });

  it("normalizes rows exactly like manual card entry", () => {
    const parsed = csvImportRows.parse([
      { front: "  das Haus  ", back: " the house ", example: "  " },
    ]);

    expect(parsed[0]).toEqual({
      front: "das Haus",
      back: "the house",
      example: null,
    });
  });
});

describe("optional fields accept both payload shapes", () => {
  // The CSV importer sends JSON with example: null; forms send "".
  // Rejecting null once broke every import containing a blank example.
  it("accepts example as null, empty string, or omitted", () => {
    for (const example of [null, "", undefined]) {
      const result = cardInput.safeParse({ front: "a", back: "b", example });

      expect(result.success).toBe(true);
      expect(result.data?.example).toBeNull();
    }
  });

  it("accepts a CSV batch whose rows carry null examples", () => {
    const result = csvImportRows.safeParse([
      { front: "der Hund", back: "the dog", example: null },
    ]);

    expect(result.success).toBe(true);
  });

  it("accepts deck description and language as null", () => {
    const result = deckInput.safeParse({
      name: "Deck",
      description: null,
      language: null,
    });

    expect(result.success).toBe(true);
  });
});
