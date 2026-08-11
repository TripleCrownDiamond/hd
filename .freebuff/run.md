# Run doc — Preview dev server

## Reproduce artifacts

No uncommitted artifacts needed beyond `.env.local`.

```bash
cp .env.local .env.local  # already in place
```

## Server

Start the Next.js dev server with an isolated build directory to avoid
collision with other dev servers sharing this project:

```bash
NEXT_DIST_DIR=.next-4321 pnpm dev -p 4321 > .freebuff/preview-a135a1d3-afd9-4765-b9d9-6c86d117cd13.log 2>&1 &
```

## Why `NEXT_DIST_DIR`

This project may have other Next.js dev servers running from other threads
(e.g. on port 3001). Without a custom `distDir` they collide writing to
`.next/`, corrupting the webpack cache and causing 404s on the root route.

The env var is supported via `next.config.ts`:

```ts
distDir: process.env.NEXT_DIST_DIR || ".next",
```

## Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4321/
# Should return 200 (may take 60-120s on first compile)
```