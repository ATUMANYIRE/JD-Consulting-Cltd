# Adding content to the website

## For the owner: the website editor

The owner adds and edits **projects** and **industry updates** at `https://<website>/admin`, on a
phone or a computer. Only administrators sign in; visitors never need an account.

1. **First time:** open `/admin`, choose **Create an account**, and enter your name, email, a
   password (at least 10 characters) and the **setup code** your developer gives you.
2. **After that:** sign in with your email and password. The browser stays signed in for 30 days,
   or until you press **Sign out**.
3. Choose **Projects** or **Updates & news**, then **Add a new project / update**. Use **Edit** or
   **Delete** on anything already published.
4. Fill in the form and add photos. They are resized automatically, and **Auto-enhance** improves
   brightness, contrast and colour (switch it off on any photo to keep the original). Projects can
   also have **videos**: a file up to 250 MB, or a YouTube or Vimeo link.
5. Press **Publish**. The change is **live on the website immediately**.

**Forgot your password?** Choose **Forgot your password?** on the sign-in page and set a new one with
the setup code. The same code lets you add another administrator.

Rules the editor reminds you of: publish only real, documented work; name a client only with their
written permission; report results only when you have evidence; use only genuine photos and videos
of JD Mining Consulting's own work.

## For the developer: one-time setup in Vercel

The editor uses two storage services that Vercel adds to the project in a few clicks. Both have free
tiers that are ample for this site.

1. **Content database (Upstash Redis).** Vercel → the project → **Storage** → **Create** →
   **Upstash for Redis** (Marketplace) → free plan → connect it to the project for all environments.
   This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. **Photo and video storage (Vercel Blob).** Vercel → **Storage** → **Create** → **Blob**, with
   **public** access → connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`. The free tier
   includes 1 GB, so encourage YouTube links for long videos.
3. **Setup code.** Create a long random code:

   ```bash
   node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
   ```

   and add it in Vercel → Settings → Environment Variables as `ADMIN_SETUP_CODE` (Production).
4. **Redeploy**, then send the owner the `/admin` address and, separately, the setup code.

**To change the setup code:** edit `ADMIN_SETUP_CODE` in Vercel and redeploy. Existing accounts keep
working; the new code is only needed to create an account or reset a password.

The old private-link variables (`ADMIN_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`) are no
longer used and can be deleted from Vercel.

**How it works:** saves go to Redis and the website reads them through `GET /api/content`, so
there is no rebuild. Photos and videos go straight from the browser to Blob storage. Deleting an
entry also deletes the files only it used.

**Trying the editor on your own computer:** run `npm run dev`, open `http://localhost:5173/admin`
and create an account with the setup code `local-setup-code`. Accounts and content are kept in
`.local-admin/store.json` and photos in `public/media/` (both ignored by Git or safe to delete).
`vite preview` has no editor server.

## Editing content by hand (developer)

Projects and updates live in the database and are managed in `/admin`. The JSON lists in
`src/content/projects.json` and `src/content/updates.json` are only the built-in fallback shown if
the database can't be reached. Vacancies, the founder profile and company details
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
