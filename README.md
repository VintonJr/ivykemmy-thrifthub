# IvyKemmy ThriftHub

Online thrift shop for clothes, shoes and bags, built for Kenya first. Shoppers browse one-of-a-kind pieces, pay with M-Pesa or card through Paystack, and choose rider delivery, a pickup point or a courier. The shop owner adds listings from their phone and manages orders at `/admin`.

## Run it on your computer

Needs [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD
npm run dev
```

Open http://localhost:3000 for the shop and http://localhost:3000/admin to manage it.

Without a Paystack key the shop runs in **demo mode**: checkout goes to a "Simulate successful payment" page and no money moves.

## What's included

- Home page, shop with category, size, price and search filters, product pages with condition and flaws
- Bag (saved on the shopper's phone) and checkout with delivery choices from `src/lib/delivery.ts`
- Each piece is held for 15 minutes while someone pays, so it can't be sold twice; unpaid holds are released automatically
- Paystack payment (M-Pesa and card), return-page verification and a signed webhook as backup
- Order confirmation page with progress (paid, packed, on the way, delivered)
- Admin: password sign-in, orders with status updates and sales totals, product list (hide, show, delete), new listing form with phone camera upload
- Installable on phones (web app manifest)

## Turning on real payments

1. Open a Paystack Kenya account and copy the secret key (`sk_test_...` for testing, `sk_live_...` when live) into `PAYSTACK_SECRET_KEY`.
2. Set `NEXT_PUBLIC_SITE_URL` to the shop's public address.
3. In the Paystack dashboard, set the webhook URL to `https://<your-domain>/api/paystack/webhook`.

## Database and photos

Locally, with nothing set, data is kept in `data/store.json` and photos in `data/uploads/` so the shop runs with zero setup.

On the live shop they live in Supabase:

- `POSTGRES_URL` (or `DATABASE_URL`): products and orders. The tables are created automatically on first use, in a private `shop` schema with row level security on, so Supabase's public API can't read customer details.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: listing photos, stored in a public `product-photos` bucket that is also created automatically.

Connecting Supabase from the Vercel project's Storage tab fills in all three. The live database starts empty; the sample products in `data/seed.json` are only used locally.

## Project layout

| Path | What it is |
| --- | --- |
| `src/app` | Pages: home, shop, product, cart, checkout, order, admin |
| `src/lib/db.ts` | Products and orders, including the 15-minute hold (`src/lib/store/` has the Postgres and local file versions) |
| `src/lib/uploads.ts` | Listing photos (Supabase Storage or local files) |
| `src/lib/payments.ts` | Paystack integration |
| `src/lib/delivery.ts` | Delivery options and prices (edit these) |
| `data/seed.json` | Sample products loaded on first run |
