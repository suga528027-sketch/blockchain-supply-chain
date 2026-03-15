# 📋 SIH 2025: Supply Chain Project Testing Checklist

This checklist covers all critical components of the **"Blockchain Based Supply Chain Transparency for Agricultural Produce"** project.

---

## 1. 🔀 Backend API Testing (Postman)

| Endpoint | Method | Required Headers | Request Body (JSON) | Expected Response |
| :--- | :---: | :--- | :--- | :--- |
| `/api/auth/login` | POST | None | `{"email": "...", "password": "..."}` | `200 OK`, JWT Token in response |
| `/api/batch` | POST | `Authorization` | `{"productName": "Tomato", "quantityKg": 500, ...}` | `200 OK`, Batch details + QR Code link |
| `/api/batch/track/{code}`| GET | None | None | `200 OK`, Batch & Tracking Events |
| `/api/batch/{id}/transfer/{uid}`| PUT | `Authorization`| `?location=Warehouse A&notes=Ready` | `200 OK`, Status -> `IN_TRANSIT` |
| `/api/payment` | POST | `Authorization`| `{"batchCode": "...", "amount": 5000}` | `200 OK`, Status -> `PENDING` |
| `/api/blockchain/verify/{tx}`| GET | `Authorization`| None | `200 OK`, Chain validation status |

---

## 2. 🖥️ Frontend Page Testing

| Page | URL | User Role | Test Actions | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | `/login` | Public | Enter valid/invalid credentials | Redirect to dashboard or show error toast |
| **Farmer Dashboard**| `/farmer-dashboard` | FARMER | Create new batch, view stats | Batch appears in list; stats update |
| **Interactive Map** | `/map` | ANY | Search valid Batch Code | Markers show on map with a dotted route line |
| **Payments** | `/payment`| ANY | Create payment for a batch | Payment shown as PENDING in history |
| **Tracker** | `/track` | Public | Search/Scan QR | Full journey timeline (Framer Motion) displayed |

---

## 3. 👥 Role-Based Workflow Tests

### 👨‍🌾 Farmer Role (Origin)
- [ ] **Create Batch**: Verify batch code is auto-generated uniquely.
- [ ] **Transfer ownership**: Confirm it appears in Transporter's "In Transit" section.
- [ ] **View QR Code**: Click the link and verify it opens the QR image.

### 🚚 Transporter Role (Logistics)
- [ ] **Receive Batch**: Verify batch appears in dashboard after Farmer transfers it.
- [ ] **Handover**: Transfer to Retailer and verify status remains `IN_TRANSIT`.

### 🏪 Retailer Role (Destination)
- [ ] **Confirm Delivery**: Click "Confirm Receipt" and verify status changes to `DELIVERED`.
- [ ] **Inventory**: Verify batch moves from "Incoming" to "Store Inventory".

### 🛡️ Admin Role (Supervision)
- [ ] **User Management**: Ban a user and verify they cannot log in anymore.
- [ ] **System Stats**: Verify global revenue and batch counts match aggregate data.

---

## 4. 🔗 Complete Supply Chain Journey (End-to-End)

1.  **Stage 1**: Farmer creates a batch of "Organic Apples".
2.  **Stage 2**: Farmer transfers it to a Transporter (Location recorded).
3.  **Stage 3**: Transporter transfers it to a Retailer (Route line grows on map).
4.  **Stage 4**: Retailer clicks "Confirm Delivery".
5.  **Stage 5**: Consumer uses the `/track` page to see the 3-step timeline.
6.  **Stage 6**: Click the "Blockchain Verify" button to see the Sepolia transaction hash.

---

## 5. 🛡️ Security & Error Handling

- [ ] **Auth Guard**: Try visiting `/admin-dashboard` without logging in (should redirect to `/login`).
- [ ] **Role Protection**: Try accessing `/admin-users` while logged in as a FARMER (should show 403 or redirect).
- [ ] **Invalid Data**: Submit batch creation with negative quantity (should show error toast).
- [ ] **Broken Link**: Enter a non-existent batch code in Map (should show "Batch not found").

---

## ⚠️ Common Errors & Fixes (Internal Knowledge)

| Error Scenario | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **Map is empty** | Missing Latitude/Longitude in DB | Use `/api/fix-map` (temp) or perform a NEW transfer. |
| **403 Forbidden** | JWT Token expired or missing | Re-login to generate a fresh token. |
| **Transaction Failed** | Low Gas in Sepolia Wallet | Ensure private key wallet has ~0.01 Sepolia ETH. |
| **Batch Info Missing** | Passing ID instead of Code | API updated to accept both; check [PaymentPage.tsx](file:///c:/Users/M%20S%20SUGAVANESHWARAN/OneDrive/Desktop/supply/frontend/src/pages/Payment/PaymentPage.tsx). |

---

## 🚀 Final Deployment Checklist
- [ ] [application.properties](file:///c:/Users/M%20S%20SUGAVANESHWARAN/OneDrive/Desktop/supply/backend/src/main/resources/application.properties): Ensure DB password matches production.
- [ ] [api.ts](file:///c:/Users/M%20S%20SUGAVANESHWARAN/OneDrive/Desktop/supply/frontend/src/services/api.ts): Update `API_BASE_URL` if deploying to cloud (e.g., AWS/Heroku).
- [ ] [BlockchainService](file:///c:/Users/M%20S%20SUGAVANESHWARAN/OneDrive/Desktop/supply/backend/src/main/java/com/supplychain/backend/service/BlockchainService.java#20-89): Verify Infura API key is still active.
- [ ] Run `npm run build` to check for frontend compilation errors.
