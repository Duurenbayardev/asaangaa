# Checkout & QPay flow

## End-to-end flow

1. **Basket** → User adds items, goes to **Миний сагс** (basket).
2. **Төлбөр төлөх** → Navigates to **Checkout address** (choose/enter address).
3. **Next** → **Checkout confirm** (review order, enter phone, tap **Захиалга баталгаажуулах**).
4. **Backend: create order + QPay invoice**
   - `POST /orders/create-with-qpay` (auth required) creates an order with status `pending_payment` (cart is **not** cleared yet).
   - Backend calls QPay to create an invoice (amount = order total, `callback_url` = your backend).
   - Backend saves `qpayInvoiceId` on the order and returns `{ order, qPay: { invoiceId, qrImage, qrText, urls } }`.
5. **App: payment screen**
   - App shows QR code and bank/app links (QPay deep links). User pays in their bank app or via QR.
6. **QPay callback**
   - When the user pays, QPay calls your backend: `POST {QPAY_CALLBACK_BASE_URL}/orders/qpay-callback` (with `object_id` or `invoice_id` = QPay invoice id).
   - Backend finds the order by `qpayInvoiceId`, calls QPay **payment/check**, and if status is `PAID`:
     - Sets order status to `confirmed`.
     - Removes those items from the user’s cart.
7. **App: success**
   - App polls `GET /orders/:id` every 3 seconds. When status is no longer `pending_payment`, it clears checkout state and shows **Захиалга амжилттай!**.

## Backend requirements

- **Env (e.g. on Render):** `QPAY_CLIENT_ID`, `QPAY_CLIENT_SECRET`, `QPAY_INVOICE_CODE`, `QPAY_CALLBACK_BASE_URL` (public URL of your backend, no trailing slash). Optional: `QPAY_BASE_URL` (defaults to sandbox).
- **Migration:** Run `npx prisma migrate deploy` on the deployed DB so `Order` has `qpayInvoiceId` and `pending_payment` status.
- **Reachability:** `QPAY_CALLBACK_BASE_URL` must be publicly reachable by QPay (deploy backend or use ngrok for dev).

## If checkout returns 500

1. Check **Render (or your host) logs** – the backend now logs the real error for 500s.
2. Typical causes:
   - **Migration not run** → run `npx prisma migrate deploy`.
   - **QPay env missing or wrong** → 503 "QPay is not configured" or 502 "Төлбөрийн сервис..."; fix env and base URL (sandbox vs production).
   - **QPay API error** → 502 with code `QPAY_ERROR`; see logged detail (e.g. auth failure, invalid invoice code, bad callback URL).
