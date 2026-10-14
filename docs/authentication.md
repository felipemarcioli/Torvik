# Torvik Authentication

Browser-based Supabase Auth: sign up with a name, email, and password, sign in
immediately, keep a persistent session, and sign out only on this device. The
current scope uses sign-up without email confirmation. Training without an
account remains available. The code also supports confirmation and password
recovery/reset if those features are enabled later.

## Connect a Project

The Torvik project is `https://tmzwgwfiysqyvsxksmpt.supabase.co`.
The `.env.example` file contains its public configuration, ready to copy.
The publishable key identifies the project in the frontend and does not grant
administrative access. Email sign-up and sign-in are enabled. For the basic flow,
disable confirmation in the dashboard as described in step 4. This is a remote
setting; the code cannot change it using a public key.

1. Create a project on the Free plan at https://supabase.com/dashboard.
2. Copy the project URL and **publishable key** from Connect/API Keys. Never use
   a `secret` or `service_role` key in the frontend.
3. For the Torvik project, copy `.env.example` to `.env.local`.
   For another project, replace the values:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

4. Under Authentication → Sign In / Providers → Email, keep Email enabled,
   disable **Confirm email**, and save. Keep new sign-ups allowed.
   Set a minimum password length of at least 8 characters. Without confirmation,
   `signUp` returns the session and Torvik opens the app immediately, without
   requiring an email confirmation.
5. Under Authentication → URL Configuration, set the Site URL to
   `https://torvik-ai.vercel.app` and allow these exact redirect URLs:
   - `https://torvik-ai.vercel.app/`
   - `https://torvik-ai.vercel.app/?auth=recovery`
   - `http://localhost:4173/`
   - `http://localhost:4173/?auth=recovery`
     Also add the exact URLs of the Vercel Preview used for testing. Adjust the
     local port to match Vite. The code returns to the current origin, never to
     a URL supplied by the user.
6. Configure both variables in Vercel for Preview and, after validation,
   Production. Create a new build: `VITE_*` variables are embedded in the
   frontend at build time. Restart Vite after changing them.

Without both variables, the app remains usable without an account and indicates
in Settings ("Ajustes") that sign-in is not yet available.

Basic sign-up and sign-in do not require SMTP when **Confirm email** is disabled.
Email-based password recovery is an additional feature and still depends on email
delivery. Supabase's default service only sends to organization members and limits
the number of messages. If you enable recovery for other users or re-enable
confirmation later, configure SMTP. See the current restrictions at
https://supabase.com/docs/guides/auth/auth-smtp.

## Data and Limitations at This Stage

- Email, the chosen name, and authentication are stored in Supabase; the SDK
  stores and refreshes the session in the browser. Torvik does not store passwords.
- The Supabase client is created only in the browser. SSR is public and does not
  read other users' sessions. There are no private endpoints at this stage.
- Workouts remain in IndexedDB, separated by user ID. Existing data stays in guest
  mode and is not automatically assigned to anyone. Signing out or switching
  accounts unmounts the previous interface, stops the camera and voice guidance,
  and clears results in memory; local records remain stored.
- This separation prevents accounts from being mixed in the interface; it is
  neither encryption nor access control against someone with access to the
  browser profile. Export or delete sessions before sharing that profile.
- There is no workout synchronization, profile table, ranking, social login, or
  native Capacitor link integration. For cloud storage, implement tables and RLS
  policies that validate `auth.uid()`; hiding a screen does not protect backend
  data. Camera analysis remains local.

## Verification

Run `bun run check`. Unit tests cover account isolation, preservation of guest
data, password validation, and sanitized messages.

UI tests use the real SDK with mocked HTTP responses:

```sh
TORVIK_AUTH_TEST=1 VITE_SUPABASE_URL=https://torvik-auth-test.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test bun run test:e2e tests/e2e/auth.spec.ts
```

Use a fresh server, with no other Vite instance on port 4173. Do not configure these
values in Vercel. Other UI tests should run the app without these variables.

In a Preview connected to the real project, verify sign-up without confirmation
and immediate access, an already registered email, an incorrect password, page
reload, sign-out, and two accounts in the same browser. If using email confirmation
or recovery, also validate the real links: mocked responses do not validate SMTP
or the remote project's configuration.

References: https://supabase.com/docs/guides/auth/passwords and
https://supabase.com/docs/reference/javascript/auth-onauthstatechange.
