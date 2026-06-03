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

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

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

    'debug_parameter_json',
    'debug_query_string'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
  }

  const p = e && e.parameter ? e.parameter : {};

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
      received: p
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
