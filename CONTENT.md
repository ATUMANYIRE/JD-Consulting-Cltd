# Adding content to the website

## For the owner: the private editor

The owner adds and edits **projects** and **updates & news** from a private page, on a phone or
a computer. There is no account, password or sign-up: the private link is the key.

1. Open the private link (it looks like `https://<website>/admin#key=…`). Save it as a bookmark
   or add it to the phone's home screen. After the first visit, the browser remembers it.
2. Choose **Projects** or **Updates & news**, then **+ New project** / **+ New update**. Use
   **Edit** or **Delete** on anything already published.
3. Fill in the form, add photos (they are resized automatically), and press **Publish**.
4. The website shows the change about **one minute** later.

Rules the editor reminds you of: publish only real, documented work; name a client only with
their written permission; report results only when you have evidence; use only genuine photos of
JD Mining Consulting's own work.

Keep the link private, like a password. Anyone who has it can publish on the website. If it is
lost or shared by mistake, ask the developer for a new one; the old link then stops working.

## For the developer: one-time setup

The editor (`/admin`) talks to a Vercel serverless function (`api/content.js`). Each save becomes
one commit in this repository (the entry in `src/content/*.json`, plus photos in `public/media/`),
and Vercel redeploys from it. Nothing is stored anywhere else.

1. **Create the private key** (any long random text):

   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   ```

2. **Create a GitHub token** the function can commit with. On GitHub, go to Settings → Developer
   settings → Personal access tokens → Fine-grained tokens → Generate new token:
   - Repository access: only `ATUMANYIRE/JD-Consulting-Cltd`
   - Permissions: **Contents: Read and write** (nothing else)
   - Expiration: up to one year. Set a reminder to renew it: when it expires, saves fail until
     a new token is added.

3. **Add environment variables in Vercel** (Project → Settings → Environment Variables,
   Production), then redeploy:

   | Name | Value |
   | --- | --- |
   | `ADMIN_KEY` | the key from step 1 |
   | `GITHUB_TOKEN` | the token from step 2 |
   | `GITHUB_REPO` | `ATUMANYIRE/JD-Consulting-Cltd` |
   | `GITHUB_BRANCH` | `main` (the branch Vercel deploys) |

4. **Send the owner the private link**: `https://<website domain>/admin#key=<ADMIN_KEY>`.
   The key sits after `#`, so it is never sent to the server in the address or stored in logs; the
   editor sends it in a request header instead.

**To revoke a link:** change `ADMIN_KEY` in Vercel, redeploy, and send the new link.

**Your own code changes:** the editor commits to `main`, so run `git pull` before you push, or
your push will be rejected. Every owner edit appears in the Git history ("Website editor: add
project …") and can be reverted like any commit.

**Trying the editor on your own computer:** run `npm run dev` and open
`http://localhost:5173/admin#key=local-test-key-only`. In this mode saves are written straight to
`src/content/*.json` and `public/media/` in your working copy (nothing goes to GitHub), and the
site updates instantly. Review or discard the test entries with `git status` before you commit.
`vite preview` has no editor server; `vercel dev` runs the real GitHub-backed function.

## Editing content by hand (developer)

Projects and updates are plain JSON lists in `src/content/projects.json` and
`src/content/updates.json`, newest first. Vacancies, the founder profile and company details
(TIN, address, logo) are in `src/data/careers.js`, `src/data/profile.js` and `src/data/company.js`;
the format of each entry is described at the top of each file.

After any hand edit, run:

```bash
npm run content:check
```

It prints `Content OK`, or lists each problem in plain words. The build (and so Vercel) runs the
same check, and refuses to publish broken content. The `/admin` editor runs it too, before saving.

Allowed values:
- Project `status`: `ongoing` or `completed` (ongoing projects use the year they started).
- Project `service`: `esg-compliance`, `circular-economy`, `tvet-workforce`, `technical-advisory`,
  `institutional-advisory`.
- Update `category`: `company`, `insights`, `technical`, `esg`, `training`, `projects`, `events`.
- Dates: always `YYYY-MM-DD`.
- Text: a plain string (shown in every language) or `{ "en": "…", "fr": "…", "rw": "…", "sw": "…" }`
  with at least `en`.

Photos: genuine JD Mining Consulting photos only, `.jpg` or `.webp`, about 1600 px wide and under
500 KB, lowercase names without spaces, each with an `alt` description.
