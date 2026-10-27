# Optional Shopify path (Hydrogen developer preview, Next.js)

Source: Shopify's "Hydrogen developer preview" update (June 2026). It is a
preview: the API will change, so re-read the current docs before running the
steps. The new Hydrogen is a framework-agnostic toolkit (not Remix-only) with
React bindings, built with the Next.js team at Vercel, and it ships agent
skills that wire the storefront into your framework.

## Prerequisites (user does these in Shopify)

- A Shopify store (a dev store or a low-cost trial is enough to test).
- Three or more products with images and variants.
- A Storefront API token. The new Hydrogen uses a **private** token
  (server-only). Create it in the store's headless or custom-app settings and
  confirm cart scopes are enabled. Check current docs for the exact screens.

## Steps (inside the finished no-Shopify Next.js project)

1. From the project directory:
   `npx @shopify/hydrogen@preview setup`
   This installs `@shopify/hydrogen` and copies Hydrogen's agent skills into the project, matched to the installed version.
2. Add env vars to `.env.local` (never commit):
   - `PUBLIC_STORE_DOMAIN` (e.g. `your-store.myshopify.com`)
   - `PRIVATE_STOREFRONT_API_TOKEN` (server-only, no `NEXT_PUBLIC_` prefix)
3. Ask the coding agent: "Set up my store with Shopify." It will use the copied skills to wire the typed Storefront API client, request handlers, cart, product and collection pages, analytics, and Shop Pay.
4. Keep the scroll story as the homepage hero. Product grid, product pages, and the cart drawer go below and beside it; do not rebuild the story.

## Notes

- Hydrogen calls Storefront API through `createStorefrontClient`, queries use `gql()`, cart state comes from `createCartComponents`.
- Request handlers (`handleShopifyRoutes`, `handleShopifyRedirects`) must run before and after the Next.js router as the skills describe.
- Hosting: Vercel or any Node/edge host works. The preview says deploying to Oxygen through the Shopify CLI is not wired up yet.
- Verify by adding a product to the cart and reaching a real Shopify checkout page.
- Roadmap items still missing in the preview: customer accounts, predictive search.
