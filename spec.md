# BLOCKCRAFT PUZZLE

## Current State
- Game has working withdrawal form (2-step: personal details + payment/UPI)
- Withdrawal form calls onWithdraw(points) locally but does NOT persist data anywhere
- Backend is empty (actor {})
- No admin panel in the game
- Withdrawal data never reaches the Withdrawal Message Receiver admin panel

## Requested Changes (Diff)

### Add
- Motoko backend: `WithdrawalRequest` record type storing name, address, email, phone, points, payoutRupees, paymentMethod, upiId, upiQrUrl, uploadedQrBase64, bankAccount, bankIfsc, bankHolderName, timestamp, status (pending/paid/rejected), username
- Backend method: `submitWithdrawal(request)` — saves request, returns ok/err
- Backend method: `getAllWithdrawals()` — returns all requests (admin only, checks caller is owner principal or uses simple admin auth)
- Backend method: `updateWithdrawalStatus(id, status)` — mark as Paid/Rejected
- Frontend: WithdrawalPage calls backend `submitWithdrawal` on form submit
- Frontend: New `WithdrawalAdminPanel` component — accessible inside the game when logged in as ADARSH_CHAUDHARY_OWNER, shows all requests with full details, QR codes, Paid/Rejected actions
- Admin panel accessible via a special route/tab when the current user is ADARSH_CHAUDHARY_OWNER

### Modify
- WithdrawalPage.tsx: after successful handleSubmit, call backend to persist withdrawal data
- App.tsx: add admin panel tab/button visible only to ADARSH_CHAUDHARY_OWNER

### Remove
- Nothing removed

## Implementation Plan
1. Generate Motoko backend with withdrawal storage and CRUD methods
2. Update WithdrawalPage to import backend and call submitWithdrawal on submit, passing all form fields
3. Build WithdrawalAdminPanel component showing all requests in a table/card list with status badges and action buttons
4. Wire admin panel into App.tsx — show "ADMIN" button in bottom bar only for ADARSH_CHAUDHARY_OWNER
5. Validate and deploy
