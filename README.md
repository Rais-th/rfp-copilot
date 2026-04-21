# RFP Copilot

Lightweight open source tool that reads Memphis public sector solicitations and generates compliant draft responses for minority and women owned small businesses.

Built by [Popuzar LLC](https://github.com/Rais-th) in Memphis, Tennessee. MIT licensed.

## What it does

1. Nightly scrape of the Memphis procurement portal.
2. Claude parses each PDF into required sections, qualifications, evaluation criteria, required attachments.
3. Your business profile lives in your browser. Nothing stored on our server.
4. Claude drafts a skeleton response mapped to the required sections. Unknown facts get `[FILL IN]` markers. No fabricated credentials.
5. Strict compliance review before export to docx or markdown.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- Vercel Postgres, Vercel Cron, Vercel serverless functions
- Drizzle ORM
- Anthropic Claude Sonnet 4.6 for parsing and drafting
- Anthropic Claude Opus 4.7 for compliance review
- `docx` for export

Single `vercel --prod` deploy. No Docker, no separate servers.

## Local dev

```bash
pnpm install     # or npm install / yarn
cp .env.local.example .env.local
# fill ANTHROPIC_API_KEY, POSTGRES_URL, CRON_SECRET
pnpm db:push     # apply schema to Postgres
pnpm dev
```

Open http://localhost:3000. Hit `/api/cron/ingest-rfps` with header `Authorization: Bearer $CRON_SECRET` to run the ingest once.

## Deploy

1. Push to GitHub.
2. Import the repo into Vercel.
3. Add a Vercel Postgres database. `POSTGRES_URL` is injected automatically.
4. Add env vars: `ANTHROPIC_API_KEY`, `CRON_SECRET`.
5. `vercel --prod`. The cron starts the next day at 11:00 UTC (06:00 CT).

## Legal

The tool generates AI drafts. It is not legal advice. You are responsible for verifying every claim, certification, date, and required attachment before submitting a response to any government body. Popuzar LLC makes no warranty as to accuracy or completeness.

## License

MIT. See `LICENSE`.

## Patent

A provisional patent application is on file. See `PATENT.md` for the inventive method.

## Contact

Rais Thelemuka, rthelemuka@gmail.com
