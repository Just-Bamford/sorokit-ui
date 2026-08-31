import { expect, test } from "@playwright/test";

const DESTINATION =
  "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
const CONNECTED_ADDRESS =
  "GBRPYHIL2CI3WHGSUJGY6O7SROQOMJG7QBCACN4QPKUOQNXJDGONXHPA";

test("connects a wallet, views transaction history, and sends a payment", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Connect Wallet" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Connect Wallet", exact: true }).click();

  await expect(
    page
      .getByTestId("screen-wrapper-wallet")
      .getByText("Connected", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(CONNECTED_ADDRESS, { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await expect(
    page.getByRole("heading", { name: "Transaction History" }),
  ).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByText("Page 1 of 3")).toBeVisible();

  await page.getByLabel("Destination Address").fill(DESTINATION);
  await page.getByLabel("Amount (XLM)").fill("10");
  await page.getByRole("button", { name: "Send XLM" }).click();
  await page.getByRole("button", { name: "Confirm & Sign" }).click();

  await expect(page.getByText("Transaction submitted")).toBeVisible();
  await expect(page.locator("[data-txhash]").last()).toBeVisible();
});
