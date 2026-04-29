import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'https://send-multiple-signature-docs.vercel.app/';

const dimArgs = process.argv.slice(2).filter((a) => /^\d+(?:\.\d+)?$/.test(a));
const width = Number(process.env.SCREENSHOT_WIDTH ?? dimArgs[0] ?? 2880);
const height = Number(process.env.SCREENSHOT_HEIGHT ?? dimArgs[1] ?? 2048);
const deviceScaleFactor = Number(
  process.env.SCREENSHOT_DEVICE_SCALE_FACTOR ?? dimArgs[2] ?? 1
);
const VIEWPORT = { width, height };
const OUT =
  process.env.SCREENSHOT_OUT ??
  join(
    ROOT,
    deviceScaleFactor === 1
      ? `envelope-ui-${width}x${height}.png`
      : `envelope-ui-${width}x${height}-${deviceScaleFactor}x.png`
  );
const TEMPLATE_LABEL = 'Canada Contractor Agreement - Monthly Pay - With Equity - Quebec';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor,
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByRole('heading', { name: 'Send one-off documents with multiple signatures' }).waitFor({ state: 'visible' });

  await page.getByText('From people tab', { exact: true }).click();
  await page.getByRole('main').getByRole('button', { name: 'Documents', exact: true }).click();
  await page.getByRole('button', { name: 'Send documents', exact: true }).click();

  await page.getByText('[Envelope Name]', { exact: true }).waitFor({ state: 'visible', timeout: 30_000 });

  await page.getByLabel('Search templates').click();
  await page.getByText(TEMPLATE_LABEL, { exact: true }).click();
  await page.keyboard.press('Escape').catch(() => {});

  await page.getByRole('button', { name: 'Add recipient', exact: true }).click();

  const recipientSearchInputs = () =>
    page.locator('[data-recipient-picker] input[placeholder="Search"]');

  await recipientSearchInputs().first().click();
  await recipientSearchInputs().first().fill('David');
  await page.getByRole('button', { name: 'David Gonzales' }).click();

  await recipientSearchInputs().first().click();
  await recipientSearchInputs().first().fill('Michael');
  await page.getByRole('button', { name: 'Michael Chen' }).click();

  await page.getByRole('checkbox', { name: /Set signing order/i }).check();

  await page.getByRole('heading', { name: 'Preview' }).click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: OUT, fullPage: false });

  await browser.close();
  const pw = Math.round(width * deviceScaleFactor);
  const ph = Math.round(height * deviceScaleFactor);
  console.log('Wrote', OUT, `(viewport ${width}×${height}, DPR ${deviceScaleFactor} → ${pw}×${ph}px)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
