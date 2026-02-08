# TackleBox — Setup Guide

**Purpose:** Get your infrastructure ready so Claude Code can start building Phase 1A.  
**Time estimate:** 30–45 minutes  
**Prerequisites:** Cloudflare account, GitHub account, VS Code with Claude Code  

---

## Step 1: Create the GitHub Repo

1. Go to [github.com/new](https://github.com/new)
2. Settings:
   - **Name:** `tacklebox` (or `tacklebox-platform`)
   - **Visibility:** Private
   - **Initialise with:** ✅ README, ✅ .gitignore (select **Node**), ✅ License (your choice, or skip)
3. Click **Create repository**
4. Copy the repo URL (you'll need it in Step 3)

---

## Step 2: Install Required Tooling

Open your terminal (or VS Code terminal) and check/install these:

### Node.js (v18+)
```bash
node --version
```
If not installed or below v18, install from [nodejs.org](https://nodejs.org/) (LTS version).

### npm (comes with Node)
```bash
npm --version
```

### Git
```bash
git --version
```
If not installed, download from [git-scm.com](https://git-scm.com/).

### Wrangler (Cloudflare CLI)
```bash
npm install -g wrangler
```
Then authenticate with your Cloudflare account:
```bash
wrangler login
```
This opens a browser window — approve the access. Confirm it worked:
```bash
wrangler whoami
```
You should see your Cloudflare account name.

---

## Step 3: Clone the Repo Locally

```bash
cd ~/Projects  # or wherever you keep code
git clone https://github.com/YOUR-USERNAME/tacklebox.git
cd tacklebox
```

Open it in VS Code:
```bash
code .
```

---

## Step 4: Set Up Cloudflare Resources

You need three things created in Cloudflare: a Pages project, a D1 database, and an R2 bucket. Do this from your terminal inside the repo folder.

### Create the D1 Database
```bash
wrangler d1 create tacklebox-db
```
This will output something like:
```
✅ Successfully created DB 'tacklebox-db'

[[d1_databases]]
binding = "DB"
database_name = "tacklebox-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
**⚠️ Save the `database_id` — you'll need it for configuration.**

### Create the R2 Bucket
```bash
wrangler r2 bucket create tacklebox-storage
```
You should see a confirmation that the bucket was created.

### Verify in Cloudflare Dashboard
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Check **D1** in the sidebar → you should see `tacklebox-db`
3. Check **R2** in the sidebar → you should see `tacklebox-storage`

> **Note:** The Pages project will be created automatically when we first deploy. No need to create it manually.

---

## Step 5: Set Up the Workers Paid Plan

The free tier works for development, but you'll want the $5/month paid plan before going to production (it gives you 25 billion D1 reads, 10 million Worker requests, etc.).

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sidebar → **Workers & Pages** → **Plans**
3. Upgrade to the **Workers Paid** plan ($5/month)

> You can stay on free while developing locally, but upgrade before any real usage.

---

## Step 6: Confirm Your Setup

Run through this checklist before moving on:

- [ ] GitHub repo created and cloned locally
- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Git installed
- [ ] Wrangler installed and authenticated (`wrangler whoami` works)
- [ ] D1 database created (`tacklebox-db`)
- [ ] D1 database_id saved somewhere
- [ ] R2 bucket created (`tacklebox-storage`)
- [ ] VS Code open with the repo folder
- [ ] Claude Code extension working in VS Code

---

## Step 7: Prepare for Claude Code

This is the critical step. Claude Code needs context to build correctly.

### Add the TackleBox documentation to your repo

1. Create a `docs/` folder in your repo root
2. Copy the **TackleBox_Technical_Project_Documentation.md** file into `docs/`
3. Rename it (optional) to something easy to reference: `docs/SPEC.md`

Your repo should now look like:
```
tacklebox/
  docs/
    SPEC.md              ← The full TackleBox specification
  .gitignore
  README.md
```

### Commit and push
```bash
git add .
git commit -m "Add project specification"
git push origin main
```

---

## Step 8: Your First Claude Code Prompt

When you're ready to start Phase 1A, open the repo in VS Code with Claude Code and give it this initial prompt:

---

**Prompt for Claude Code:**

```
Read the full project specification at docs/SPEC.md before doing anything.

This is the TackleBox platform. You are building Phase 1A: Infrastructure & Foundation.

Tech stack:
- Frontend: React + Vite, deployed to Cloudflare Pages
- Backend: Cloudflare Workers (API)
- Database: Cloudflare D1 (SQLite) — database name: tacklebox-db, database_id: [PASTE YOUR ID]
- File storage: Cloudflare R2 — bucket name: tacklebox-storage
- Repo: GitHub

For Phase 1A, do the following in order:

1. Scaffold the project with the folder structure defined in Section 4 of the spec
2. Set up React + Vite for the frontend
3. Set up Cloudflare Workers for the API
4. Create the wrangler.toml configuration binding D1 and R2
5. Create the design tokens file (src/config/tokens.js) with a clean, professional colour palette
6. Create the constants file (src/config/constants.js) with all task statuses, priorities, and time increments from the spec
7. Create the database migration file with ALL 18 tables from Section 16 of the spec
8. Do NOT build any UI components yet — just the scaffolding, config, and database

Keep everything modular. Follow the architecture principles in Section 3 of the spec exactly.
```

---

### After scaffolding, the next prompts follow the build order:

**Prompt 2 — Base components:**
```
Now build all base UI components listed in Section 4 of docs/SPEC.md.
Create each component in src/components/ui/ and export everything from index.js (barrel export).
Start with: Button, Input, Textarea, Select, Badge, StatusBadge, Card, Spinner, EmptyState, Toast, Modal, PageHeader.
Use the design tokens from src/config/tokens.js for all styling. No hardcoded colours or spacing values.
```

**Prompt 3 — Layout + Auth:**
```
Build the layout components (Sidebar, MainLayout, AuthLayout) and the auth placeholder.
The auth service should be in src/services/auth.js — a simple token-based session behind an interface that can be swapped for OAuth later.
Implement role detection and protected routes (client, contractor, admin).
The sidebar should show different navigation items per role as defined in the user journeys in docs/SPEC.md.
```

And so on, following the 27-step build order in Section 22 of the spec.

---

## Tips for Working with Claude Code

**1. Always reference the spec**
Start every major prompt with "Refer to docs/SPEC.md" — this keeps Claude Code aligned with the architecture and prevents drift.

**2. One step at a time**
Don't ask Claude Code to build the entire platform at once. Follow the build order. Verify each step works before moving to the next.

**3. Test as you go**
After each build step, run the dev server and check that things render/work:
```bash
npm run dev          # Frontend
wrangler dev         # Workers API
```

**4. Commit frequently**
After each working step:
```bash
git add .
git commit -m "Phase 1A: [what you just built]"
git push origin main
```

**5. When something breaks**
Tell Claude Code what the error is (paste the error message) and which file it's in. Be specific. "The task form isn't working" is hard to debug. "TaskForm.jsx throws 'Cannot read property of undefined' on line 42 when I click submit" is easy to fix.

**6. Keep the spec updated**
If you make design decisions during building that differ from the spec, update docs/SPEC.md to reflect reality. The spec should always match what's actually built.

---

## What Happens After Setup

Once the infrastructure is ready and you've run the first Claude Code prompt, you'll have:
- A scaffolded project with correct folder structure
- React + Vite frontend
- Cloudflare Workers API skeleton
- D1 database with all 18 tables
- R2 bucket bound and ready
- Design tokens and constants configured

From there, you follow the build order step by step. Each step produces something testable. By the end of Phase 1A, you can log in with a test account and see an empty role-based dashboard.

The full build (Phase 1A through 1D) will take multiple sessions with Claude Code. Don't rush it. Each sub-phase should work completely before moving on.
