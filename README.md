# MINE MC Store

Professional Next.js + Prisma Minecraft store with UPI-only checkout, PostgreSQL orders and Pterodactyl delivery.

## Current payment flow

This version uses the supplied static UPI QR and UPI ID `6207867258@fam`.

1. Player selects a product and enters a Minecraft username.
2. The store creates a pending order.
3. Player scans the QR or opens a UPI app.
4. Player enters the UPI transaction ID / UTR.
5. The order stays pending until an admin verifies the payment.
6. Admin calls the protected verification endpoint; the server sends the configured Minecraft command through Pterodactyl.

**Important:** a static UPI QR by itself does not provide a reliable payment webhook to a website. Therefore this build does NOT trust the “I have paid” button as proof of payment. Automatic verification can be added later with a UPI/payment provider that exposes payment status/webhooks.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run build
npm start
```

Set these in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/minemc?schema=public"
NEXT_PUBLIC_UPI_ID="6207867258@fam"
NEXT_PUBLIC_UPI_PAYEE="MINE MC"
ADMIN_SECRET="use-a-long-random-secret"
PTERO_PANEL_URL="https://panel.example.com"
PTERO_SERVER_ID="your-server-identifier"
PTERO_CLIENT_API_KEY="ptlc_xxxxxxxxxxxxxxxxx"
MINECRAFT_RANK_COMMAND="lp user {player} parent set {package}"
MINECRAFT_COINS_COMMAND="eco give {player} {amount}"
MINECRAFT_KEY_COMMAND="crate give {player} {package} 1"
```

## Verify a UPI payment and deliver

After you have checked the payment in your UPI/bank app, call:

```bash
curl -X POST "https://YOUR-STORE-DOMAIN/api/admin/orders/ORDER_ID/verify" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET"
```

The endpoint verifies the order exists and then runs the product's configured Minecraft command through Pterodactyl. It marks the order `FULFILLED` only after the command succeeds.

## Changing products

Edit `components/StoreClient.tsx` for the visible catalog and `lib/catalog.ts` / `prisma/seed.js` for server-side product data and commands.

## Discord

`https://discord.gg/kT8WXQCaN5`
