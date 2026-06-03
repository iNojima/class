const SPREADSHEET_ID = '1_bytLT4Ksj-2e4UBvOQrj19W1E7EvIgnMf5ZaLTMjGY';
const SHEET_NAME = 'presentation1';

function doGet(e) {
  return saveResponse(e);
}

function doPost(e) {
  return saveResponse(e);
}

function saveResponse(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const header = [
    'タイムスタンプ',
    '学籍番号',
    '自分のグループ',
    '筋力1_Group',
    '筋力1_感想',
    '筋力2_Group',
    '筋力2_感想',
    '筋力3_Group',
    '筋力3_感想',
    '重心動揺1_Group',
    '重心動揺1_感想',
    '重心動揺2_Group',
    '重心動揺2_感想',
    '重心動揺3_Group',
    '重心動揺3_感想',
    'debug_all_parameters',
    'debug_query_string'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
  }

  let p = {};
  if (e && e.parameter) {
    p = e.parameter;
  }

  if ((!p || Object.keys(p).length === 0) && e && e.queryString) {
    p = parseQueryString(e.queryString);
  }

  const row = [
    new Date(),

    p.studentId || '',
    p.ownGroup || '',

    p.strengthGroup1 || '',
    p.strengthComment1 || '',
    p.strengthGroup2 || '',
    p.strengthComment2 || '',
    p.strengthGroup3 || '',
    p.strengthComment3 || '',

    p.copGroup1 || '',
    p.copComment1 || '',
    p.copGroup2 || '',
    p.copComment2 || '',
    p.copGroup3 || '',
    p.copComment3 || '',

    JSON.stringify(p),
    e && e.queryString ? e.queryString : ''
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      received: p,
      queryString: e && e.queryString ? e.queryString : ''
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseQueryString(queryString) {
  const params = {};

  queryString.split('&').forEach(function(pair) {
    const parts = pair.split('=');
    const key = decodeURIComponent((parts[0] || '').replace(/\+/g, ' '));
    const value = decodeURIComponent((parts.slice(1).join('=') || '').replace(/\+/g, ' '));

    if (key) {
      params[key] = value;
    }
  });

  return params;
}
