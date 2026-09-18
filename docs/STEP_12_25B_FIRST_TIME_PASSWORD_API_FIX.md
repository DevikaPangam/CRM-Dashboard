# STEP 12.25B — FIRST-TIME PASSWORD API FIX

## Root Cause
The production error `Failed to execute 'json' on 'Response': Unexpected end of JSON input` occurred because Vercel was serving the project purely as a static SPA. The `vercel.json` file was rewriting all requests—including `POST /api/auth/first-time-setup`—to the static `index.html` file, causing the frontend to crash when attempting to parse HTML as JSON.

## Architectural Fix
1. **Serverless Migration**: The setup logic from `routes/authResolver.js` was converted into a proper Vercel Serverless Function deployed at `api/auth/first-time-setup.js`.
2. **Vercel Routing Update**: The `vercel.json` file was updated to explicitly exclude `/api/(.*)` from being rewritten to `index.html`, ensuring API requests are routed to the Serverless Functions correctly.
3. **Frontend Hardening**: `LoginPage.tsx` was refactored to inspect the `Content-Type` response header before calling `res.json()`, gracefully catching any non-JSON responses and providing a user-friendly generic fallback error rather than throwing an unhandled exception.

## Security Constraints Retained
- The endpoint correctly enforces the `CRM_FIRST_TIME_SETUP_SECRET` which remains strictly server-side.
- The `supabaseAdmin` service role key is not leaked to the frontend bundle.
- The implementation strictly operates on existing accounts and validates the one-time `password_initialized` attribute to prevent abuse.
- The build process completed successfully with no errors, and the verification suite achieved an 8/8 pass rate.

## Vercel Deployment Details
- **Commit**: `e813e1d`
- **Status**: Live deployed.
- **Production URL**: `https://crm-dashboard-l79s.vercel.app/`

---

**FINAL VERDICT:**
🟢 **PRODUCTION FIRST-TIME SETUP API READY**
