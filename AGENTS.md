# Project Rules — Buy Ghana Lands

## Git & Deployment

- **Always commit and push all changes to git after completing work.** Vercel auto-deploys from the `master` branch on push. Failing to push means changes won't reach production.
- Use `git add -A`, then commit with a descriptive message, then `git push origin master`.
- Do not leave uncommitted changes between sessions.

## Stack

- Next.js 16 (Turbopack), React, TypeScript, Prisma 6, PostgreSQL (Neon), NextAuth, Tailwind CSS
- Cloudinary for image uploads
- AWS Rekognition for KYC
- Jest for tests (408 tests across 24 suites)

## Verification

- Run `npm run build` before committing — it must succeed
- Run `npx jest --no-coverage` — all tests must pass
- Start dev server (`npm run dev`) and verify key pages return HTTP 200

## Architecture

- All content is database-driven via CMS APIs — no hardcoded demo/fallback data
- Admin CMS uses WYSIWYG editor (TipTap) for rich text content
- Image uploads go through `/api/admin/cms/upload` (Cloudinary-backed)
- Footer content is managed via `FooterContent` model and `/api/cms/footer` endpoint
- Admin sidebar supports hover dropdowns for items with children (e.g. Website CMS)
