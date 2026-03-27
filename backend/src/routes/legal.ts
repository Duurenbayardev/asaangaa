import { Router } from "express";

const router = Router();

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; background:#f6f7f9; color:#111; }
    main { max-width: 800px; margin: 24px auto; background:#fff; border:1px solid #e8e8e8; border-radius:12px; padding:20px; line-height:1.6; }
    h1 { margin-top: 0; font-size: 28px; }
    h2 { margin-top: 22px; font-size: 18px; }
    p, li { font-size: 15px; color:#333; }
    .muted { color:#666; font-size:13px; }
  </style>
</head>
<body>
  <main>
    ${body}
  </main>
</body>
</html>`;
}

router.get("/privacy", (_req, res) => {
  res.type("html").send(
    page(
      "Asaangaa Privacy Policy",
      `
      <h1>Privacy Policy</h1>
      <p class="muted">Last updated: ${new Date().toISOString().slice(0, 10)}</p>
      <p>Asaangaa collects only the information needed to provide ordering, delivery, and account features.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account data: email, name, phone</li>
        <li>Order and delivery data: address, order items, payment status</li>
        <li>Technical data: basic logs for security and reliability</li>
      </ul>
      <h2>How we use data</h2>
      <ul>
        <li>Process orders and deliveries</li>
        <li>Support account access and password reset</li>
        <li>Improve service reliability and prevent abuse</li>
      </ul>
      <h2>Data sharing</h2>
      <p>We share only what is necessary with payment and infrastructure providers to operate the service.</p>
      <h2>Contact</h2>
      <p>For privacy questions, contact: support@asaangaa.mn</p>
      `
    )
  );
});

router.get("/terms", (_req, res) => {
  res.type("html").send(
    page(
      "Asaangaa Terms of Service",
      `
      <h1>Terms of Service</h1>
      <p class="muted">Last updated: ${new Date().toISOString().slice(0, 10)}</p>
      <p>By using Asaangaa, you agree to these terms.</p>
      <h2>Use of service</h2>
      <ul>
        <li>Provide accurate account and delivery information</li>
        <li>Do not misuse the app or payment flows</li>
      </ul>
      <h2>Orders and payments</h2>
      <ul>
        <li>Orders are confirmed after successful processing/payment</li>
        <li>Prices and availability may change</li>
      </ul>
      <h2>Liability</h2>
      <p>The service is provided as-is, subject to applicable law.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: support@asaangaa.mn</p>
      `
    )
  );
});

router.get("/support", (_req, res) => {
  res.type("html").send(
    page(
      "Asaangaa Support",
      `
      <h1>Support</h1>
      <p>If you need help with orders, payments, or your account, contact us:</p>
      <ul>
        <li>Phone: +97699119911</li>
        <li>Email: support@asaangaa.mn</li>
      </ul>
      `
    )
  );
});

export default router;

