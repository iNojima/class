const SHEET_NAME = 'clinical_reasoning_quiz';

function doGet(e) {
  return handleQuizRequest(e);
}

function doPost(e) {
  return handleQuizRequest(e);
}

function handleQuizRequest(e) {
  const p = e && e.parameter ? e.parameter : {};
  const callback = p.callback || '';
  const action = p.action || 'submit';

  let result;
  try {
    if (action === 'check') {
      result = checkAttempt(p);
    } else {
      result = saveQuizResult(p);
    }
  } catch (err) {
    result = { status: 'error', message: String(err) };
  }

  return outputResult(result, callback);
}

function checkAttempt(p) {
  const sheet = getQuizSheet();
  ensureHeader(sheet);

  const alreadyTaken = hasSubmittedAttempt(sheet, p.studentId, p.quizId);

  return {
    status: 'ok',
    canStart: !alreadyTaken,
    alreadyTaken: alreadyTaken
  };
}

function saveQuizResult(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getQuizSheet();
    ensureHeader(sheet);

    if (hasSubmittedAttempt(sheet, p.studentId, p.quizId)) {
      return {
        status: 'duplicate',
        alreadyTaken: true
      };
    }

    const score = Number(p.score || 0);
    const total = Number(p.total || 0);
    const rate = total > 0 ? score / total : '';

    sheet.appendRow([
      new Date(),
      p.timestamp || '',
      p.studentId || '',
      p.quizId || '',
      p.quizTitle || '',
      p.score || '',
      p.total || '',
      rate,
      p.answers || '',
      JSON.stringify(p)
    ]);

    return {
      status: 'ok',
      alreadyTaken: false
    };
  } finally {
    lock.releaseLock();
  }
}

function getQuizSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow([
    '受信日時',
    '画面側タイムスタンプ',
    '学籍番号',
    'クイズID',
    'クイズタイトル',
    '得点',
    '満点',
    '正答率',
    '回答結果',
    'debug_all_parameters'
  ]);
}

function hasSubmittedAttempt(sheet, studentId, quizId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const values = sheet.getRange(2, 3, lastRow - 1, 5).getValues();
  const targetStudentId = String(studentId || '').trim();
  const targetQuizId = String(quizId || '').trim();

  return values.some(row => {
    const rowStudentId = String(row[0] || '').trim();
    const rowQuizId = String(row[1] || '').trim();
    const rowScore = String(row[3] || '').trim();
    const rowTotal = String(row[4] || '').trim();

    return rowStudentId === targetStudentId &&
      rowQuizId === targetQuizId &&
      rowScore !== '' &&
      rowTotal !== '';
  });
}

function outputResult(result, callback) {
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(result) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
