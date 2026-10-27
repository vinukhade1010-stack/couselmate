# CounselMate: College Counseling Web App

React + Node.js + Express + **MySQL**, with a Gemini-powered chatbot.
Students find colleges that fit their score and budget, save a shortlist, follow an admission checklist, and ask the assistant questions.

## What you need
- Node.js 18.11 or newer (the LTS version is best): https://nodejs.org
- MySQL 8 (the same MySQL you installed for Foodie works) and MySQL Workbench
- VS Code (or any editor)
- Optional: a free Gemini API key from https://aistudio.google.com/apikey (the chatbot works without it, in "basic mode")

## Setup
Open two terminals.

**1. Server**
```
cd server
npm install
copy .env.example .env        (Mac/Linux: cp .env.example .env)
```
Open `server/.env` and fill in:
- `DB_USER` and `DB_PASSWORD`: your MySQL login (the same one Foodie uses)
- `JWT_SECRET`: a long random string (32+ characters). Generate one with:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `GEMINI_API_KEY`: your key (optional)
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: choose your own (password: 10+ characters with letters and numbers)

Then create the database and add the data:
```
npm run initdb     (creates the database "counselmate" and its 6 tables)
npm run seed       (adds 23 sample colleges, the guidance content, and your admin account)
npm run dev        (API on http://localhost:5000)
```
Instead of `npm run initdb` you can open `sql/schema.sql` in MySQL Workbench and run it.

**2. Client**
```
cd client
npm install
npm run dev        (website on http://localhost:5173)
```
Open **http://localhost:5173**.

## Database design
```
users ──< shortlist >── colleges ──< college_courses
guidance ──< guidance_items
```
- `colleges` has one row per college. Its courses are rows in `college_courses` (a college has many courses).
- `shortlist` links students and colleges (many-to-many). Its primary key is the pair (user, college), so the same college cannot be saved twice.
- Foreign keys use `ON DELETE CASCADE`: deleting a college also removes its courses and every saved copy of it.
- Saving a college and its courses happens in one **transaction**: both are saved, or neither.

## Things to try
1. Home page: move the two sliders. The number of matching colleges changes live.
2. Colleges: filter by city, course, fees, percentile. Click the heart (log in first).
3. Shortlist: compare saved colleges side by side. Best values are highlighted.
4. Guidance: tick the documents checklist. The progress bar fills.
5. Chat button (bottom right): try "Engineering colleges in Pune under 2 lakh", "What documents do I need?", "Show my shortlist".
6. Log in with the admin account and open **Admin** to add, edit and delete colleges.

## How the chatbot answers
1. The server reads your question and finds filters in it (city, course, fees, percentile, type) using `server/src/utils/queryParser.js`.
2. It looks up the matching colleges and guidance **in your MySQL database**, with the same safe SQL builder the search page uses.
3. It sends Gemini the question plus **only those records**, with rules: answer from the data only, never invent fees or dates, ignore instructions hidden inside the question.
4. The answer is shown. The college cards under it come straight from the database, never from the AI's text.
5. If Gemini has no key, hits its free limit, or is down, the bot falls back to **basic mode**: a plain summary of the same database results. The chat never shows a broken screen.

The Gemini model name is a setting (`GEMINI_MODEL` in `.env`). Google renames and retires models over time. If the chat stays in basic mode with a key set, check the model name in Google AI Studio and watch the server log for the HTTP status.

## Security checklist (what is built in)
| Risk | What the code does |
|---|---|
| **SQL injection** | Every value a user types goes into a `?` placeholder, never into the SQL text (`utils/sqlFilters.js`). Sort order comes from a fixed list. LIKE wildcards (`%`, `_`) are escaped. Page and limit are clamped to whole numbers. URL ids must be positive integers. |
| Stolen passwords | bcrypt with cost 12. The hash is only selected from the database for the login check and is never returned by the API. |
| Password guessing | Login and register limited to 10 attempts per 15 minutes. Same error for wrong email and wrong password. A dummy hash is compared when the email does not exist, so timing does not leak which emails exist. |
| Stolen login token | JWT lives in an **httpOnly, SameSite=Lax, Secure (in production)** cookie. JavaScript cannot read it, and it is not in localStorage. Algorithm is pinned to HS256. |
| Weak secrets | Server refuses to start without a JWT secret of 32+ characters. |
| Forged cross-site requests (CSRF) | Every POST/PUT/DELETE must carry the `X-Requested-With` header, plus the SameSite cookie. |
| Mass assignment | Registration never reads `role` (the SQL fixes it to `student`). College writes copy only whitelisted fields. |
| Privilege escalation | Admin routes check the role from the database on every call. Admin accounts exist only through the seed script. |
| Bad input | `express-validator` on every write route, 10 KB body limit, length limits on every field, and CHECK constraints in the database as a second line of defence. |
| XSS | React escapes all output. No `dangerouslySetInnerHTML`. Website links must be `http(s)` and open with `rel="noopener noreferrer"`. |
| Chatbot abuse | 10 messages per minute per IP, 300-character limit, history capped, emails and phone numbers removed before text goes to Gemini, system rules against prompt injection. |
| API key leaks | Gemini key stays on the server, is sent only in a header, and is never logged or sent to the browser. `.env` is in `.gitignore`. |
| Information leaks | Helmet headers, `x-powered-by` off, generic 500 messages (details only in the server log), CORS limited to your frontend address. |

Not covered, and worth doing before a real launch: a dedicated MySQL user with limited rights (instead of `root`), HTTPS hosting, email verification, password reset, account lockout after repeated failures, dependency checks (`npm audit`), and logging and monitoring.

## Project layout
```
sql/            schema.sql (database + tables), tables.sql (tables only)
server/src
  config/       env.js (checks settings), db.js (connection pool, transactions)
  models/       User, College, Guidance: all the SQL lives here
  middleware/   auth.js (cookie + roles), security.js (rate limits, CSRF, errors)
  controllers/  auth, colleges, users, chat
  routes/       index.js (every API route in one place)
  services/     gemini.js (the API call), chatService.js (grounding + fallback)
  utils/        sqlFilters.js (safe WHERE builder), queryParser.js, helpers.js (+ tests)
  seed/         sample colleges, guidance, initdb.js, seed.js
client/src
  components/   Navbar, Footer, ChatWidget, CollegeCard, CountUp, Reveal, ...
  pages/        Home, Colleges, CollegeDetail, Shortlist, Guidance, Login, Register, Admin
  context/      AuthContext, ToastContext
```
Run `npm test` in `server` to test the chatbot's question parser and the SQL filter builder (21 tests, no database needed).

## About the data
The 23 colleges are **made up** so no real college gets invented fees or cutoffs. They are labelled "Sample data" in the app. To use real data, add colleges in the Admin page, or edit `server/src/seed/colleges.js` with figures you have checked on official sites (college websites, NIRF, your state CET cell, JoSAA) and run `npm run seed` again. Fees and cutoffs change every year.

## Deploying later
The login cookie needs the website and the API to share one site address. Easiest: host both behind one domain (the API under `/api`), or use a host that proxies `/api` to the server. Set `NODE_ENV=production`, `CLIENT_URL` to your site address, and use HTTPS. Use a managed MySQL service and a dedicated database user.

## Good things to explain in an interview
- Why the token is in an httpOnly cookie and not localStorage.
- How `?` placeholders stop SQL injection, and why the sort order comes from a whitelist.
- Why courses and the shortlist are separate tables (one-to-many and many-to-many), and what `ON DELETE CASCADE` does.
- Why saving a college and its courses is a transaction.
- What "grounding" means, and how the chatbot avoids making up fees.
- What happens when Gemini fails (basic mode), and why the key lives only on the server.
