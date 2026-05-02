# YC Brokerage Tracker — Deployment Guide
## Google Apps Script + Google Sheets Setup

---

## 📋 WHAT YOU NEED
- A Google account (the one that owns your Google Sheet)
- Your Google Sheet ID (from the URL)
- The two files: `Code.gs` and `Index.html`

---

## STEP 1 — Prepare Your Google Sheet

1. Open your Google Sheet (or create a new one at sheets.google.com)
2. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  ← YOUR SHEET ID HERE →  /edit
   ```
3. Rename the tab to: `Tracker`
   - Right-click the bottom tab → Rename → type `Tracker`
4. Delete any existing data (the script will create the correct header row automatically)

---

## STEP 2 — Create the Google Apps Script Project

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. The Apps Script editor opens. You'll see a file called `Code.gs`

---

## STEP 3 — Add the Code Files

### Code.gs
1. In the editor, click on `Code.gs` (left panel)
2. **Select all** existing code and **delete it**
3. **Paste** the entire contents of `Code.gs` from this package
4. Find this line near the top:
   ```javascript
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
   ```
5. Replace `YOUR_GOOGLE_SHEET_ID` with your actual Sheet ID from Step 1

### Index.html
1. In the left panel, click the **+** button next to "Files"
2. Choose **HTML**
3. Name it exactly: `Index`  ← (no .html extension needed, Apps Script adds it)
4. **Select all** the default code and **delete it**
5. **Paste** the entire contents of `Index.html` from this package

---

## STEP 4 — Save the Project

1. Click the **💾 Save** icon (or press Ctrl+S / Cmd+S)
2. Give your project a name when prompted, e.g. `YC Brokerage Tracker`

---

## STEP 5 — Deploy as Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the gear icon ⚙ next to "Select type" → choose **Web app**
3. Fill in the settings:
   - **Description**: YC Brokerage Tracker v1
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone  ← This allows all team members to use it
4. Click **Deploy**
5. Click **Authorize access** → Sign in with your Google account → Allow permissions
6. **Copy the Web App URL** — this is the link you share with all departments

   It looks like:
   ```
   https://script.google.com/macros/s/XXXXXXXXX/exec
   ```

---

## STEP 6 — Share the URL

Share the Web App URL with all departments. They bookmark it and use it daily.

| Department | Login Email | Password |
|---|---|---|
| Admin (Dr. Farooq) | drfarooq@youngscapital.pk | Ycc@1122 |
| Account Opening | accountopening@youngscapital.pk | Ycc@321 |
| Broker Admin | brokeradmin@youngscapital.pk | Ycc@321 |
| IT Team | itteam@youngscapital.pk | Ycc@321 |
| PR Team | prteam@youngscapital.pk | Ycc@321 |
| YCSIT Team | ycsit@youngscapital.pk | Ycc@321 |

---

## STEP 7 — Enable Email Notifications (Optional but Recommended)

The system automatically sends email notifications to all departments when Account Opening adds a new client. For this to work:
- The Google account running the script must have Gmail enabled
- During first deployment authorization, make sure to allow "Send email on your behalf"

---

## HOW THE WORKFLOW WORKS

```
Account Opening Team
       ↓  adds client record
Google Sheet (Tracker tab)
       ↓  automatically
Email sent to → Broker Admin
             → IT Team
             → PR Team
             → YCSIT Team
             (each logs in and fills their section)
       ↓
Admin Dashboard shows completion status in real-time
```

---

## UPDATING THE CODE AFTER CHANGES

If you ever update `Code.gs` or `Index.html`:
1. Make your changes in the Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the edit pencil ✏ on your existing deployment
4. Change **Version** to "New version"
5. Click **Deploy**

---

## TROUBLESHOOTING

| Problem | Solution |
|---|---|
| "Script error" on login | Check that SHEET_ID is correctly pasted in Code.gs |
| Data not saving | Make sure the sheet tab is named exactly `Tracker` |
| Emails not sending | Re-authorize the script: Deploy → Manage → Re-authorize |
| "Access denied" | Re-deploy with "Who has access: Anyone" |
| Changes not showing | Re-deploy with a new version (see "Updating" above) |

---

## FIELD REFERENCE

| Field | Department | Notes |
|---|---|---|
| Client ID | Account Opening | Unique identifier |
| Opening Date | Account Opening | Date of account opening |
| Phone Number | Account Opening | Client phone |
| Client Email | Account Opening | Client email |
| Account Type | Account Opening | Individual/Corporate/Joint/Minor |
| Website Pic | Account Opening | Yes/No |
| Overseas | Account Opening | Yes/No |
| Supervisor | Account Opening | Assigned supervisor |
| Broker | Broker Admin | Broker name |
| HNW | Broker Admin | High Net Worth: Yes/No |
| Branch ID | Broker Admin | Branch identifier |
| Dealer ID | Broker Admin | Dealer identifier |
| Vouchers | Broker Admin | Voucher info |
| Pro Access | IT Team | Given/Pending/Not Required |
| Gift Recieved | PR Team | Given/Not Given/Pending |
| YCSIT Discount | YCSIT Team | Applied/Not Applied/Pending |

---

*YC Brokerage Tracker — Built for Youngs Capital*
