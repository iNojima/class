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
    result = {
      status: 'error',
      message: err && err.message ? err.message : String(err)
    };
  }

  return outputResult(result, callback);
}

function checkAttempt(p) {
  const sheet = getQuizSheet();
  ensureHeader(sheet);

  if (!p.studentId || !p.quizId) {
    return {
      status: 'error',
      canStart: false,
      message: 'studentId and quizId are required'
    };
  }

  const row = findAttemptRow(sheet, p.studentId, p.quizId);
  return {
    status: 'ok',
    canStart: row === -1,
    alreadyTaken: row !== -1
  };
}

function saveQuizResult(p) {
  const sheet = getQuizSheet();
  ensureHeader(sheet);

  if (!p.studentId || !p.quizId) {
    return {
      status: 'error',
      alreadyTaken: false,
      message: 'studentId and quizId are required'
    };
  }

  const existingRow = findAttemptRow(sheet, p.studentId, p.quizId);
  if (existingRow !== -1) {
    return {
      status: 'duplicate',
      alreadyTaken: true,
      message: 'This student has already submitted this quiz.'
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

function findAttemptRow(sheet, studentId, quizId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, 3, lastRow - 1, 2).getValues();
  const targetStudentId = String(studentId).trim();
  const targetQuizId = String(quizId).trim();

  for (let i = 0; i < values.length; i++) {
    const rowStudentId = String(values[i][0]).trim();
    const rowQuizId = String(values[i][1]).trim();
    if (rowStudentId === targetStudentId && rowQuizId === targetQuizId) {
      return i + 2;
    }
  }

  return -1;
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
