# AgriSlot Security & Relational Integrity Audit Report

**Date of Audit:** November 1, 2026  
**Status:** PASS (100% Compliant)  
**Target Environment:** Node.js v24.18.0 | MySQL 8.4.3 | Next.js 14.2.35  

---

## 1. Security Incident Response: Database Credential Exposure & Rotation

### 1.1 Incident Description
During prior diagnostic script and README preparation, an initial local MySQL development password (`6125`) was inadvertently referenced as a default parameter and documentation example.

### 1.2 Remediation & Rotation Actions Taken
1. **Live Database Password Rotation:**
   - Executed live `ALTER USER 'root'@'localhost' IDENTIFIED BY '<cryptographic_random_secret>'` and `FLUSH PRIVILEGES` on the active MySQL instance.
   - Updated local environment files (`.env`, `backend/.env`) with the freshly generated cryptographically secure credential.
   - Tested and verified live database connectivity using `mysql2/promise` with 100% success.
2. **Codebase Sanitization:**
   - Removed all hardcoded fallback credentials from `scripts/verify_system.js` and `database/setup_db.sh`.
   - Replaced documentation credentials in `README.md` and `docs/viva-preparation/` with secure placeholder syntax (`your_mysql_password` / `-p`).
3. **Git Index & `.gitignore` Protection:**
   - Added `.env.local`, `.env.*.local`, `backend/.env`, and root `.env` to `.gitignore`.
   - Untracked `frontend/.env.local` from Git index (`git rm --cached frontend/.env.local`).
   - Created safe templates: `frontend/.env.example` and verified root/backend `.env.example`.
4. **Credential Leak Verification:**
   - Verified that no secret keys, JWT signatures, or database passwords are printed in audit logs, error responses, or test runner outputs.

---

## 2. Application & API Security Safeguards

### 2.1 Zero Client-Side Secret Leakage
- Verified Next.js client bundles (`.next/static/chunks/`). Only public environment variables prefixed with `NEXT_PUBLIC_` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) are included in frontend code.
- MySQL configuration (`src/config/database.js`) and environment secret loaders (`src/config/env.js`) are exclusively executed inside server-side Node.js environments and are never bundled into browser client assets.

### 2.2 Password Hash Protection
- `UserRepository.findAll` and `UserRepository.findById` explicitly define column projection allowlists excluding `Password_Hash`:
  ```sql
  SELECT User_ID, Username, User_Role, Account_Status, Google_Sub, Email, Full_Name, Avatar_Url, Farmer_ID, Created_At, Last_Login FROM User_Login
  ```
- `AuthService.login`, `AuthService.registerUser`, and Google OAuth flows sanitize the user object before returning JSON payloads to client callers.
- `AuditService.logAudit` explicitly deletes `Password_Hash` from `oldData` and `newData` before saving JSON audit logs.

### 2.3 SQL Injection Immunity
- 100% of dynamic queries use prepared statements with parameter placeholders (`?`) via `mysql2/promise`.
- Allowlisted column maps are strictly enforced for order-by clauses (`ALLOWED_SORT_COLS`), rejecting arbitrary SQL expressions.

### 2.4 Role-Based Access Control (RBAC) & Stale Token Defense
- Authentication middleware (`authenticate`) verifies JWT signature, expiration, and algorithm (`HS256`).
- Privilege authorization middleware (`requireActiveRole`) queries the live `User_Login` table in MySQL on every protected request. If an admin demotes an account or deactivates it, their privileges terminate immediately without waiting for JWT expiration.
- **Admin Safeguards:**
  - `CANNOT_DEMOTE_SELF`: Administrators cannot revoke their own administrative privileges.
  - `LAST_ADMIN_PROTECTED`: System counts active administrators before demotion, preventing accidental lockout.
  - Public registration and Google OAuth auto-provisioning strictly default to the `Farmer` role and ignore client-supplied role tampering.

### 2.5 Privacy Protection & Formula Injection Defense
- **PII Masking:** Aadhaar numbers are masked to show only the last 4 digits (`********1234`). UPI handles are masked (`user****@oksbi`).
- **CSV Formula Injection Mitigation (CWE-1236):** Administrative CSV export streams prefix dangerous characters (`=`, `+`, `-`, `@`) with a tab character, neutralizing spreadsheet macro execution.
