// ============================================================
// Apex Scheduling — Google Sheets Configuration
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://console.cloud.google.com/
// 2. Create a project, enable Google Sheets API
// 3. Create an API key (Credentials → Create → API Key)
// 4. Create a Google Sheet, make it "Anyone with the link can edit"
// 5. Add headers in Row 1 (see README below)
// 6. Paste your API key and Sheet ID below
// ============================================================

const APEX_CONFIG = {
    API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
    SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
    SHEET_NAME: 'Sheet1',
};

// Column headers expected in Row 1 of the Google Sheet:
// id | containerNumber | carrierScac | carrierName | driverName | availableDate | portApptDate | lastFreeDate | requestedDate | startTime | endTime | drayNotes | status | apexAlternativeDate | altStartTime | altEndTime | apexComments | submittedAt | submittedBy

const SHEET_COLUMNS = [
    'id','containerNumber','carrierScac','carrierName','driverName',
    'availableDate','portApptDate','lastFreeDate','requestedDate',
    'startTime','endTime','drayNotes','status','apexAlternativeDate',
    'altStartTime','altEndTime','apexComments','submittedAt','submittedBy'
];

// ---------- Google Sheets helpers ----------

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function sheetsGet(range) {
    const url = `${SHEETS_BASE}/${APEX_CONFIG.SHEET_ID}/values/${APEX_CONFIG.SHEET_NAME}!${range}?key=${APEX_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Sheets read failed: ' + res.status);
    return res.json();
}

async function sheetsAppend(values) {
    const url = `${SHEETS_BASE}/${APEX_CONFIG.SHEET_ID}/values/${APEX_CONFIG.SHEET_NAME}!A:S:append?valueInputOption=RAW&key=${APEX_CONFIG.API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: values })
    });
    if (!res.ok) throw new Error('Sheets append failed: ' + res.status);
    return res.json();
}

async function sheetsUpdate(range, values) {
    const url = `${SHEETS_BASE}/${APEX_CONFIG.SHEET_ID}/values/${APEX_CONFIG.SHEET_NAME}!${range}?valueInputOption=RAW&key=${APEX_CONFIG.API_KEY}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: values })
    });
    if (!res.ok) throw new Error('Sheets update failed: ' + res.status);
    return res.json();
}

// Read all appointments from the sheet (skips header row)
async function getAllAppointments() {
    try {
        const data = await sheetsGet('A2:S1000');
        const rows = data.values || [];
        return rows.map((row, idx) => {
            const obj = {};
            SHEET_COLUMNS.forEach((col, i) => { obj[col] = row[i] || ''; });
            obj._rowIndex = idx + 2; // 1-based, skip header
            return obj;
        });
    } catch(e) {
        console.error('Failed to read appointments:', e);
        return [];
    }
}

// Append a new appointment row
async function addAppointment(appt) {
    const row = SHEET_COLUMNS.map(col => appt[col] || '');
    await sheetsAppend([row]);
}

// Update a specific appointment row (by row number)
async function updateAppointmentRow(rowIndex, appt) {
    const row = SHEET_COLUMNS.map(col => appt[col] || '');
    await sheetsUpdate(`A${rowIndex}:S${rowIndex}`, [row]);
}
