# ClimateBooks

AI powered climate accounting and sustainability SaaS. Next.js 15, TypeScript, Tailwind, Supabase, Recharts.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in.
3. In the Supabase SQL editor run, in order: `supabase/migrations/`supabase/all_in_one.sql` (all ClimateBooks objects use the `cbk_` prefix so they coexist with other apps).
4. Supabase Auth settings: set Site URL to your deployed URL and add `<site>/auth/callback` to Redirect URLs.
5. `npm run dev`

## Environment variables
| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Supabase client (anon key is public by design; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Used only by the verified Selar webhook to write subscriptions |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | server only | AI assistant |
| `SELAR_WEBHOOK_SECRET` | server only | Shared secret that authenticates payment notifications |

Never commit `.env.local`. Never expose the service role key.

## Payments (Selar)
Pricing buttons open the Selar checkout links in `src/config/plans.ts`. Access is granted only by `POST /api/selar/webhook?secret=<SELAR_WEBHOOK_SECRET>`, which writes the `subscriptions` table with the service role. Configure that URL as the payment notification URL in Selar. The payload parser is defensive but was written without a sample Selar payload: send a test purchase and adjust field names in `src/app/api/selar/webhook/route.ts` if needed.

## Emission factors
No factor values are bundled. Add factors (with source, year, geography, unit) on the Emission Factors page, copying published values.

## Deploy
Deploy to Vercel (or any Node host): set the env vars above, build command `npm run build`.
