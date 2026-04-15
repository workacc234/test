// ============================================================
//  CONFIG - point this to your GitHub raw CSV file URL(s)
//  The file must be in a PUBLIC repo.
//  You can list more than one file - all are merged together.
// ============================================================
var DATA_URLS = [
  "https://raw.githubusercontent.com/slsu-ico/2026SLSUAdmissionResultChecker/main/data.csv"
];
// ============================================================

var admissionData = {};

function parseCSV(text) {
  var rows = [];
  var row = [];
  var value = '';
  var inQuotes = false;

  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    var next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function parseCSVData(text) {
  var count = 0;
  var rows = parseCSV(text);
  if (rows.length < 2) return 0;

  var headers = rows[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/[\s.]+/g, '');
  });
  var iApp = headers.findIndex(function(h) {
    return ['applicationno', 'appno', 'application#', 'examineeno', 'applicationnumber'].indexOf(h) >= 0;
  });
  var iProg = headers.findIndex(function(h) {
    return ['firstchoiceprogram', 'firstchoice', 'program', 'course'].indexOf(h) >= 0;
  });
  if (iApp < 0 || iProg < 0) return 0;

  for (var i = 1; i < rows.length; i++) {
    var appNo = String(rows[i][iApp] || '').trim().toUpperCase();
    var program = String(rows[i][iProg] || '').trim();
    if (!appNo || !program) continue;
    admissionData[appNo] = { program: program };
    count++;
  }

  return count;
}

async function loadAllData() {
  var statusEl = document.getElementById('dataStatus');
  statusEl.innerHTML = '<div class="loading-bar"><div class="spinner"></div>Loading admission data&hellip;</div>';
  try {
    var total = 0;
    for (var i = 0; i < DATA_URLS.length; i++) {
      var res = await fetch(DATA_URLS[i]);
      if (!res.ok) throw new Error('Could not fetch data (HTTP ' + res.status + ').');
      var text = await res.text();
      total += parseCSVData(text);
    }
    if (total === 0) throw new Error('No records found in the data file.');
    statusEl.innerHTML = '';
    document.getElementById('appInput').disabled = false;
    document.getElementById('checkBtn').disabled = false;
    document.getElementById('appInput').focus();
  } catch (err) {
    statusEl.innerHTML = '<div class="error-bar">&#9888;&#65039; Could not load admission data. ' + err.message + '<br>Please refresh the page or contact the admission office.</div>';
  }
}

function checkResult() {
  var raw = document.getElementById('appInput').value.trim();
  var resultEl = document.getElementById('result');
  if (!raw) {
    resultEl.innerHTML = '<div class="result-box result-fail"><p style="font-size:14px;color:#7a2020;">&#9888;&#65039; Please enter your Application Number before checking.</p></div>';
    return;
  }
  var key = raw.toUpperCase();
  var record = admissionData[key];
  if (record) {
    resultEl.innerHTML =
      '<div class="result-box result-success">' +
        '<div class="res-header">' +
          '<div class="res-icon icon-success">&#127881;</div>' +
          '<div class="res-header-text">' +
            '<div class="res-tag">&#10003; Qualified</div>' +
            '<h3>Congratulations!</h3>' +
          '</div>' +
        '</div>' +
        '<div class="res-divider"></div>' +
        '<div class="res-row"><div class="res-label">App. No.</div><div class="res-val">' + key + '</div></div>' +
        '<div class="res-row"><div class="res-label">1st Choice Program</div><div class="res-val program">' + record.program + '</div></div>' +
        '<div class="congrats-note">' +
          'You have qualified for your first choice program. Please proceed to the ' +
          '<strong>SLSU Student Admission Office</strong> on your scheduled confirmation date. ' +
          'Bring all required documents and arrive at least <strong>30 minutes early</strong>. ' +
          'Non-appearance means <strong>forfeiture of your slot</strong>.' +
        '</div>' +
      '</div>';
  } else {
    resultEl.innerHTML =
      '<div class="result-box result-fail">' +
        '<div class="res-header">' +
          '<div class="res-icon icon-fail">&#10069;</div>' +
          '<div class="res-header-text">' +
            '<div class="res-tag res-tag-fail">Not on Qualifier List</div>' +
            '<h3 class="h3-fail">No Qualifier Record Found</h3>' +
          '</div>' +
        '</div>' +
        '<div class="res-divider-red"></div>' +
        '<p class="advisory-text">We regret to inform you that Examinee / Application Number <strong>' + key + '</strong> is not on the current qualifier list.</p>' +
        '<p class="advisory-text">However, the University will still release a <strong>DPWAS list</strong> for degree programs with available slots. The DPWAS list and the corresponding guidelines will be posted after the confirmation of slots for the qualifiers is completed.</p>' +
        '<p class="advisory-text">For updates and further instructions, please wait for announcements on the official SLSU Facebook page and website.</p>' +
      '</div>';
  }
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function switchTab(btn, tab) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

loadAllData();
