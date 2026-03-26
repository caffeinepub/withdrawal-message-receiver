# Withdrawal Message Receiver

## Current State
Empty backend (actor {}). Frontend has existing UI files from a previous session but no functional withdrawal submission or admin panel.

## Requested Changes (Diff)

### Add
- Backend: WithdrawalRequest data type storing full name, address, email, contact, points amount, UPI ID, generated QR data, uploaded QR image (as blob), status (Pending/Paid/Rejected), timestamp
- Backend: submitWithdrawalRequest() -- public, no auth required
- Backend: getWithdrawalRequests() -- returns all requests, admin only (checked by caller principal or password field)
- Backend: updateRequestStatus(id, status) -- admin only
- Frontend: User submission form (2 steps: personal details, then payment details with UPI QR generation + upload)
- Frontend: Admin login page (username ADARSH_CHAUDHARY_OWNER + password)
- Frontend: Admin dashboard listing all requests with full details, QR codes, and Paid/Rejected action buttons

### Modify
- Replace empty backend with full withdrawal message receiver logic

### Remove
- Nothing

## Implementation Plan
1. Generate Motoko backend with withdrawal request storage, submit, list, and status update functions
2. Build frontend: user submission form (2-step), admin login, admin dashboard with request cards showing all details and QR codes
3. Admin protected by hardcoded ADARSH_CHAUDHARY_OWNER credentials (frontend-side gate)
4. QR code auto-generated from UPI ID using qrcode library; also support image upload
5. Validate and deploy
