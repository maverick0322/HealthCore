# HealthCore E2E Frontend Integration Test Plan

This document outlines a manual integration testing strategy to verify the end-to-end functionality between your React frontend (`health-core`) and the Spring Boot backend (`identity-service`), without relying on real email delivery.

## 0. Prerequisites & Setup Environment

1. **Backend Environment Variables**: Ensure your root `.env` has valid Auth0 credentials (`SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_CLIENT_ID`, etc.) and a `JWT_SECRET`.
2. **Start Backend**: Run `docker compose up -d`. Make sure the `dev` or `local` Spring profile is active so verification codes are printed to the console.
3. **Start Frontend**: Navigate to `apps/health-core` and run your development server (e.g., `npm run dev`), running on `http://localhost:5173`.
4. **Monitor Logs**: Keep a terminal window open running `docker compose logs -f identity-service` to capture the mock email codes.
5. **Clean Slate**: Use an Incognito/Private window for each major flow to ensure no leftover tokens interfere with testing.

---

## Flow 1: Standard Registration & Verification

**Objective**: Verify a user can sign up, fetch the mock code from logs, verify their account, and log in.

| Step | Action | Expected Frontend Result |
| :--- | :--- | :--- |
| 1.1 | Navigate to `http://localhost:5173/signup`. | Displays registration form. |
| 1.2 | Enter a new email (e.g., `test1@healthcore.com`), strong password, and select "Patient". Click Submit. | Form disables during submission. On success, redirects to `/verify-code` or displays a prompt to enter a code. |
| 1.3 | **Check Terminal Logs**: Look for `Verification code for test1@healthcore.com is XXXXXX`. | N/A |
| 1.4 | On the `/verify-code` page, enter the `XXXXXX` code and submit. | Displays a success toast/message. Redirects to `/login`. |
| 1.5 | On `/login`, enter the newly created credentials. | Successful login. Redirects to the protected route `/` (Home) or `/onboarding/patient`. |

---

## Flow 2: Password Reset (Forgot Password)

**Objective**: Verify a user can request a password reset, fetch the code, change the password, and log in with the new credentials.

| Step | Action | Expected Frontend Result |
| :--- | :--- | :--- |
| 2.1 | Navigate to `http://localhost:5173/login` and click "Forgot Password". | Redirects to `/forgot-password`. |
| 2.2 | Enter the email used in Flow 1 (`test1@healthcore.com`) and submit. | Displays success message. Redirects to `/reset-password` (or prompts for code). |
| 2.3 | **Check Terminal Logs**: Look for `Password reset code for test1@healthcore.com is YYYYYY`. | N/A |
| 2.4 | On the `/reset-password` page, enter `test1@healthcore.com`, the code `YYYYYY`, and a *new* password. Submit. | Displays success toast/message. Redirects to `/login`. |
| 2.5 | Attempt to log in with the *old* password. | **Fails**. Displays "Invalid credentials" error. |
| 2.6 | Attempt to log in with the *new* password. | Successful login. Redirects to `/`. |

---

## Flow 3: Google Authentication (Auth0)

**Objective**: Verify the OAuth2 login flow works, redirects to Auth0, returns to the frontend, and parses the tokens correctly.

| Step | Action | Expected Frontend Result |
| :--- | :--- | :--- |
| 3.1 | Open a fresh Incognito window and navigate to `http://localhost:5173/login`. | Displays login screen. |
| 3.2 | Click "Continue with Google" (or equivalent Auth0 login button). | Browser redirects completely away from `localhost:5173` to the Auth0 Universal Login page (`https://YOUR_TENANT.auth0.com/authorize?...`). |
| 3.3 | Log in using a Google account. | Auth0 processes the login and redirects to the backend (`http://localhost:8082/login/oauth2/code/auth0?...`), which then redirects to `http://localhost:5173/oauth2/callback?accessToken=...&refreshToken=...`. |
| 3.4 | Observe the `/oauth2/callback` page briefly. | The `OAuth2CallbackPage` component mounts, reads the URL parameters, saves them to the Auth Store (Zustand/Context), and fetches the user profile (`/me`). |
| 3.5 | Wait 1-2 seconds. | Automatically redirects to `/` or `/onboarding/patient` with the user fully authenticated. |

---

## Flow 4: Session Persistence & Token Refresh

**Objective**: Ensure the frontend remembers the user across tab closes and handles token refreshes (if implemented on initial load).

| Step | Action | Expected Frontend Result |
| :--- | :--- | :--- |
| 4.1 | While successfully logged in (from Flow 1 or 3), completely close the browser tab. | N/A |
| 4.2 | Open a new tab and navigate directly to `http://localhost:5173/`. | The application briefly loads, checks `localStorage`/`cookies`, successfully validates the session, and keeps the user on the protected `/` route without asking for a password. |
| 4.3 | Click the "Logout" button inside the application. | A request is sent to `POST /api/v1/auth/logout`. Tokens are cleared from local storage. User is redirected to `/login`. |
| 4.4 | Click the browser's "Back" button. | User remains on `/login` (or is kicked back there by the `<ProtectedRoute />` guard). They cannot access the dashboard. |

---

## Flow 5: Negative Paths & Error Handling

**Objective**: Ensure the UI elegantly handles backend errors and prevents users from getting stuck.

| Step | Action | Expected Frontend Result |
| :--- | :--- | :--- |
| 5.1 | On `/login`, enter a non-existent email or wrong password. | A clear, red error message appears: "Invalid credentials" (no crash). |
| 5.2 | Rapidly submit the `/login` form with wrong passwords 5+ times. | The UI catches the `429 Too Many Requests` error and displays "Too many failed login attempts. Please try again later." |
| 5.3 | On `/signup`, try to register an email that already exists (`test1@healthcore.com`). | The UI catches the `409 Conflict` error and displays "Email is already registered". |
| 5.4 | Go to `/verify-code` and enter a made-up 6-digit code. | The UI catches the `401 Unauthorized` error and displays "Invalid or expired verification code". |
