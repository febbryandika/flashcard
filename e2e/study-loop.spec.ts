import { test, expect } from "@playwright/test";

const EMAIL = "testuser@example.com";
const PASSWORD = "test-password-123";

test.describe("study loop", () => {
  const deckName = `E2E ${Date.now()}`;

  test.afterEach(async ({ page }) => {
    // Best-effort cleanup: delete the deck we created so nothing accumulates
    // in the shared database. Safe to no-op if the deck was never created or
    // was already removed during the test.
    await page.goto("/decks");
    // count() does NOT auto-wait — without waiting for the list to render first
    // it returns 0 on a still-loading page and cleanup silently leaks the deck.
    await page.getByRole("heading", { name: "Decks", level: 1 }).waitFor();

    const deleteButton = page.getByRole("button", {
      name: `Delete ${deckName}`,
    });
    if (await deleteButton.count()) {
      page.once("dialog", (dialog) => dialog.accept());
      await deleteButton.click();
      await expect(
        page.getByRole("link", { name: deckName, exact: true }),
      ).toHaveCount(0);
    }
  });

  test("sign-in, create deck, add card, study one full loop", async ({
    page,
  }) => {
    // 1. Sign in
    await page.goto("/sign-in");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/decks");

    // 2. Create a deck
    await page.getByRole("link", { name: "New deck" }).click();
    await expect(page).toHaveURL("/decks/new");
    await page.locator("#name").fill(deckName);
    await page.getByRole("button", { name: "Create deck" }).click();
    await expect(page).toHaveURL("/decks");
    await expect(
      page.getByRole("link", { name: deckName, exact: true }),
    ).toBeVisible();

    // 3. Open the deck and add a card
    await page.getByRole("link", { name: deckName, exact: true }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+$/);

    const front = `Front ${Date.now()}`;
    const back = `Back ${Date.now()}`;
    await page.getByLabel("Front").fill(front);
    await page.getByLabel("Back").fill(back);
    await page.getByRole("button", { name: "Add card" }).click();
    await expect(page.getByText(front, { exact: true })).toBeVisible();

    // 4. Go study — flashcard shows the front, rating bar not yet visible
    await page.getByRole("link", { name: "Study" }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);
    await expect(page.getByText(front, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Good/ })).not.toBeVisible();

    // 5. Flip the card — back text and rating bar appear
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(back, { exact: true })).toBeVisible();
    const goodButton = page.getByRole("button", { name: /^Good/ });
    await expect(goodButton).toBeVisible();

    // 6. Rate the card — session completes, card leaves the queue (next
    // review scheduled)
    await goodButton.click();
    await expect(page.getByText("Session complete")).toBeVisible();
    await expect(page.getByText("You reviewed 1 card.")).toBeVisible();

    // 7. Back to decks, ready for afterEach cleanup
    await page.goto("/decks");
    await expect(page).toHaveURL("/decks");
  });
});
