# Deploy and Host Cap on Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/cap-server?referralCode=sLjDXb&utm_medium=integration&utm_source=button&utm_campaign=cap-server)

[Cap](https://github.com/CapSoftware/Cap) is the open-source alternative to Loom. Record your screen and camera from the Cap desktop app, the Chrome extension or straight in the browser, and get a share link with comments, reactions, view counts and optional AI titles and transcripts. This template runs Cap's web app, its media server and MySQL, with recordings in a Railway bucket, so the videos and the links are yours.

## About Hosting Cap

Three services and a bucket: Cap (the web app and API the recorders upload to), media-server (ffmpeg processing for uploaded recordings), MySQL (users, videos, comments) and the `cap-videos` bucket (the recordings themselves). Cap keeps its background-job state on a volume at `/data`.

Recorders upload straight to the bucket with signed URLs. On every start the template sets the bucket's CORS rule to your Cap URL, so browser and extension uploads work without touching the bucket.

Cap signs people in with a one-time code sent by email. Until you add a Resend key, there is no email: the code is printed in the Cap service's logs. Only someone with access to your Railway project can read them, so nobody else can sign in to a fresh deploy.

## Common Use Cases

- Async video updates, bug reports and walkthroughs, shared as a link instead of a meeting
- A Loom replacement for a team that wants recordings on its own storage and domain
- Product demos and support answers with viewer comments and view counts
- Recording from Linux, macOS and Windows desktops or any Chromium browser

## Dependencies for Cap Hosting

- Optional: a [Resend](https://resend.com) API key and verified domain, to email login codes to other people
- Optional: OpenAI, Groq or AssemblyAI keys for AI titles, summaries and transcripts

### Deployment Dependencies

- [Cap on GitHub](https://github.com/CapSoftware/Cap)
- [Cap self-hosting docs](https://cap.so/docs/self-hosting)
- [Template source on GitHub](https://github.com/two-workspaces/cap)

### Implementation Details

**First use:**

1. Open the Cap service's domain once it's green and enter your email.
2. Open the Cap service's **Logs** in Railway and copy the six-digit code printed there.
3. Record from the browser (**New recording**), the Chrome extension or the Cap desktop app.

**Desktop app:** in Cap's settings, set the server URL to your Cap domain and sign in. Recordings then upload to this server instead of cap.so.

**Inviting others:** set `RESEND_API_KEY` and `RESEND_FROM_DOMAIN` so login codes go out by email. `CAP_ALLOWED_SIGNUP_DOMAINS` (for example `yourcompany.com`) limits who can create an account once email works.

Notes and limits:

- `WEB_URL` is used in share links and the bucket's CORS rule. When you add a custom domain, set `WEB_URL` to it and redeploy.
- Keep `DATABASE_ENCRYPTION_KEY` unchanged: a new one makes stored secrets unreadable.
- Each media job can use up to about 768 MB of RAM, so long recordings need the media server on a plan with 1 GB or more.
- Cap publishes only `latest` images. Each template update pins a newer one by digest. Back up MySQL (Railway backups) before updating.

## Why Deploy Cap on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Cap on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
