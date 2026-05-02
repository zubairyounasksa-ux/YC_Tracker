// ═══════════════════════════════════════════════════
//   YC BROKERAGE INTERNAL TRACKER — Google Apps Script
//   File: Code.gs  (Server-Side Logic)
// ═══════════════════════════════════════════════════

// ─── CONFIGURATION ────────────────────────────────
const SHEET_ID   = 'YOUR_GOOGLE_SHEET_ID';   // ← Paste your Sheet ID here
const SHEET_NAME = 'Tracker';

// ─── USER CREDENTIALS ─────────────────────────────
const USERS = {
  'drfarooq@youngscapital.pk':      { password: 'Ycc@1122', role: 'admin',           name: 'Dr. Farooq' },
  'accountopening@youngscapital.pk':{ password: 'Ycc@321',  role: 'account_opening', name: 'Account Opening Team' },
  'brokeradmin@youngscapital.pk':   { password: 'Ycc@321',  role: 'broker_admin',    name: 'Broker Admin' },
  'itteam@youngscapital.pk':        { password: 'Ycc@321',  role: 'it_team',         name: 'IT Team' },
  'prteam@youngscapital.pk':        { password: 'Ycc@321',  role: 'pr_team',         name: 'PR Team' },
  'ycsit@youngscapital.pk':         { password: 'Ycc@321',  role: 'ycsit',           name: 'YCSIT Team' },
};

// Departments notified when a new client is added
const NOTIFY_EMAILS = [
  'brokeradmin@youngscapital.pk',
  'itteam@youngscapital.pk',
  'prteam@youngscapital.pk',
  'ycsit@youngscapital.pk',
];

// Master column order in the sheet
const HEADERS = [
  'Client ID', 'Opening Date', 'Phone Number', 'Client Email',
  'Website Pic', 'Account Type', 'Overseas',
  'Broker', 'HNW', 'Branch ID', 'Dealer ID', 'Vouchers',
  'Pro Access',
  'Gift Recieved',
  'YCSIT Discount',
  'Supervisor', 'Status', 'Date Updated', 'Created Date'
];

// ─── WEB APP ENTRY POINT ──────────────────────────
// Handles both: direct browser visits (serves HTML) AND
// GitHub Pages frontend API calls (returns JSON)
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  // ── API mode: called from GitHub Pages via fetch() ──
  if (action) {
    return handleApiAction(action, e.parameter);
  }

  // ── HTML mode: direct Apps Script URL visit ──
  return HtmlService.createHtmlOutputFromFile('Index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('YC Brokerage Tracker');
}

// Routes action param → correct function, returns JSON
function handleApiAction(action, p) {
  let result;
  try {
    switch (action) {
      case 'login':
        result = login(p.email, p.password);
        break;
      case 'getRecords':
        result = getRecords();
        break;
      case 'getStats':
        result = getStats();
        break;
      case 'addRecord':
        result = addRecord(JSON.parse(decodeURIComponent(p.data)));
        break;
      case 'updateRecord':
        result = updateRecord(p.clientId, JSON.parse(decodeURIComponent(p.updates)));
        break;
      case 'deleteRecord':
        result = deleteRecord(p.clientId);
        break;
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── SHEET HELPER ─────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a3a5c');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ─── AUTH ─────────────────────────────────────────
function login(email, password) {
  const user = USERS[email.trim().toLowerCase()];
  if (!user || user.password !== password) {
    return { success: false, message: 'Invalid email or password.' };
  }
  return { success: true, role: user.role, name: user.name, email: email.trim().toLowerCase() };
}

// ─── READ RECORDS ─────────────────────────────────
function getRecords() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, j) => {
      let val = row[j];
      if (val instanceof Date) val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      obj[h] = val !== undefined && val !== null ? String(val) : '';
    });
    return obj;
  });
}

// ─── ADD NEW RECORD (Account Opening) ─────────────
function addRecord(form) {
  try {
    const sheet   = getSheet();
    const records = getRecords();
    const dup     = records.some(r => r['Client ID'].trim() === String(form.clientId).trim());
    if (dup) return { success: false, message: 'Client ID already exists.' };

    const now = new Date();
    const row = new Array(HEADERS.length).fill('');
    const set = (col, val) => { const i = HEADERS.indexOf(col); if (i >= 0) row[i] = val || ''; };

    set('Client ID',    form.clientId);
    set('Opening Date', form.openingDate);
    set('Phone Number', form.phoneNumber);
    set('Client Email', form.clientEmail);
    set('Website Pic',  form.websitePic);
    set('Account Type', form.accountType);
    set('Overseas',     form.overseas);
    set('Supervisor',   form.supervisor);
    set('Status',       'Pending');
    set('Date Updated', Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
    set('Created Date', Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));

    sheet.appendRow(row);
    sendNewClientNotification(form.clientId, form.openingDate || '');
    return { success: true, message: 'Client record created successfully.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ─── UPDATE RECORD (All other departments) ────────
function updateRecord(clientId, updates) {
  try {
    const sheet   = getSheet();
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(clientId).trim()) {
        Object.keys(updates).forEach(key => {
          const col = headers.indexOf(key);
          if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(updates[key]);
        });

        // Update timestamp
        const tsCol = headers.indexOf('Date Updated');
        if (tsCol >= 0) {
          const now = new Date();
          sheet.getRange(i + 1, tsCol + 1)
               .setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
        }

        // Refresh row and check completion
        const freshRow = sheet.getRange(i + 1, 1, 1, headers.length).getValues()[0];
        refreshStatus(sheet, i + 1, headers, freshRow);
        return { success: true, message: 'Record updated.' };
      }
    }
    return { success: false, message: 'Client ID not found.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ─── AUTO STATUS ──────────────────────────────────
function refreshStatus(sheet, rowNum, headers, row) {
  const required = ['Broker', 'Pro Access', 'Gift Recieved', 'YCSIT Discount'];
  const allDone  = required.every(col => {
    const idx = headers.indexOf(col);
    return idx >= 0 && String(row[idx]).trim() !== '';
  });
  const statusCol = headers.indexOf('Status');
  if (statusCol >= 0) sheet.getRange(rowNum, statusCol + 1).setValue(allDone ? 'Complete' : 'Pending');
}

// ─── STATS (Admin) ────────────────────────────────
function getStats() {
  const records = getRecords();
  const now     = new Date();
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const mStart  = new Date(now.getFullYear(), now.getMonth(), 1);

  function toDate(v) { const d = new Date(v); return isNaN(d) ? null : d; }

  const daily   = records.filter(r => { const d = toDate(r['Created Date']); return d && d >= today; }).length;
  const weekly  = records.filter(r => { const d = toDate(r['Created Date']); return d && d >= weekAgo; }).length;
  const monthly = records.filter(r => { const d = toDate(r['Created Date']); return d && d >= mStart; }).length;
  const pending  = records.filter(r => r['Status'] === 'Pending').length;
  const complete = records.filter(r => r['Status'] === 'Complete').length;

  // Broker breakdown
  const byBroker = {};
  records.forEach(r => {
    const b = r['Broker'] || 'Unassigned';
    byBroker[b] = (byBroker[b] || 0) + 1;
  });

  // Account type breakdown
  const byType = {};
  records.forEach(r => {
    const t = r['Account Type'] || 'Unknown';
    byType[t] = (byType[t] || 0) + 1;
  });

  // Daily breakdown for last 7 days
  const last7 = [];
  for (let d = 6; d >= 0; d--) {
    const day   = new Date(today.getTime() - d * 86400000);
    const next  = new Date(day.getTime() + 86400000);
    const label = Utilities.formatDate(day, Session.getScriptTimeZone(), 'dd MMM');
    const count = records.filter(r => {
      const rd = toDate(r['Created Date']); return rd && rd >= day && rd < next;
    }).length;
    last7.push({ label, count });
  }

  // Department fill rates
  const deptFields = {
    'Broker Admin': ['Broker'],
    'IT Team':      ['Pro Access'],
    'PR Team':      ['Gift Recieved'],
    'YCSIT Team':   ['YCSIT Discount'],
  };
  const deptStats = {};
  Object.keys(deptFields).forEach(dept => {
    const fields = deptFields[dept];
    const filled = records.filter(r => fields.every(f => String(r[f] || '').trim() !== '')).length;
    deptStats[dept] = { filled, total: records.length, pct: records.length ? Math.round(filled / records.length * 100) : 0 };
  });

  return { total: records.length, daily, weekly, monthly, pending, complete, byBroker, byType, last7, deptStats };
}

// ─── EMAIL NOTIFICATION ───────────────────────────
function sendNewClientNotification(clientId, openingDate) {
  try {
    const url     = ScriptApp.getService().getUrl();
    const subject = `🔔 New Client Registered — ID: ${clientId}`;
    const body    =
`Dear Team,

A new brokerage client has been registered in the YC Internal Tracker.

  Client ID    : ${clientId}
  Opening Date : ${openingDate}

Please log in and complete your department's section:
${url}

This is an automated notification from YC Brokerage System.`;

    NOTIFY_EMAILS.forEach(email => {
      try { MailApp.sendEmail({ to: email, subject, body }); }
      catch (e) { Logger.log('Email error to ' + email + ': ' + e.message); }
    });
  } catch (e) {
    Logger.log('Notification error: ' + e.message);
  }
}

// ─── ADMIN: DELETE RECORD ─────────────────────────
function deleteRecord(clientId) {
  try {
    const sheet = getSheet();
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(clientId).trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Record deleted.' };
      }
    }
    return { success: false, message: 'Record not found.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
