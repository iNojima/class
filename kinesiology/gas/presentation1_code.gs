const SPREADSHEET_ID = '1_bytLT4Ksj-2e4UBvOQrj19W1E7EvIgnMf5ZaLTMjGY';
const SHEET_NAME = 'presentation1';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
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
    '重心動揺3_感想'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
  }

  let p = {};

  if (e.postData && e.postData.contents) {
    try {
      p = JSON.parse(e.postData.contents);
    } catch (error) {
      p = e.parameter;
    }
  } else {
    p = e.parameter;
  }

  const row = [
    new Date(),
    p.student_id || '',
    p.own_group || '',

    p.strength_group_1 || '',
    p.strength_comment_1 || '',
    p.strength_group_2 || '',
    p.strength_comment_2 || '',
    p.strength_group_3 || '',
    p.strength_comment_3 || '',

    p.cop_group_1 || '',
    p.cop_comment_1 || '',
    p.cop_group_2 || '',
    p.cop_comment_2 || '',
    p.cop_group_3 || '',
    p.cop_comment_3 || ''
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: '回答を保存しました'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
