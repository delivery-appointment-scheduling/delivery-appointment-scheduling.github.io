const APEX_CONFIG = {
    API_KEY: 'AIzaSyBFtRlTZNqcJr4sWaAFQQIn3eXuWsz134I',
    SHEET_ID: '170ewG_q1ep1prybJDoKRE1ph7rOQdCi9lobgR-o1608',
    SHEET_NAME: 'Sheet1',
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwdf2tmzyUy1pPSpW4xO5Vr6kyPAxHBOkHeGa8fh2ziF3Hhi0YLLDpUeEJRaf9gsQvJGA/exec',
};

const SHEET_COLUMNS = [
    'id','facility','containerNumber','carrierScac','carrierName','driverName',
    'availableDate','portApptDate','lastFreeDate','requestedDate',
    'startTime','endTime','drayNotes','status','apexAlternativeDate',
    'altStartTime','altEndTime','apexComments','submittedAt','submittedBy'
];

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function sheetsGet(range) {
    const url = `${SHEETS_BASE}/${APEX_CONFIG.SHEET_ID}/values/${APEX_CONFIG.SHEET_NAME}!${range}?key=${APEX_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Sheets read failed: ' + res.status);
    return res.json();
}

async function sheetsAppend(values) {
    const res = await fetch(APEX_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'append', row: values[0] })
    });
    if (!res.ok) throw new Error('Write failed: ' + res.status);
    return res.json();
}

async function sheetsUpdate(range, values) {
    const match = range.match(/(\d+)/);
    const rowIndex = match ? parseInt(match[1]) : 0;
    const res = await fetch(APEX_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'update', rowIndex: rowIndex, row: values[0] })
    });
    if (!res.ok) throw new Error('Update failed: ' + res.status);
    return res.json();
}

async function getAllAppointments() {
    try {
        const data = await sheetsGet('A2:T1000');
        const rows = data.values || [];
        return rows.map((row, idx) => {
            const obj = {};
            SHEET_COLUMNS.forEach((col, i) => { obj[col] = row[i] || ''; });
            obj._rowIndex = idx + 2;
            return obj;
        });
    } catch(e) {
        console.error('Failed to read appointments:', e);
        return [];
    }
}

async function addAppointment(appt) {
    const row = SHEET_COLUMNS.map(col => appt[col] || '');
    await sheetsAppend([row]);
}

async function updateAppointmentRow(rowIndex, appt) {
    const row = SHEET_COLUMNS.map(col => appt[col] || '');
    await sheetsUpdate(`A${rowIndex}:T${rowIndex}`, [row]);
}

async function deleteAppointmentRow(rowIndex) {
    const res = await fetch(APEX_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete', rowIndex: rowIndex })
    });
    if (!res.ok) throw new Error('Delete failed: ' + res.status);
    return res.json();
}
