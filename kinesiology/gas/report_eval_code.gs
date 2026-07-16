const SPREADSHEET_ID = '15XyZojOEbbTCwbKyI4atjFGFtEY03pMK6v0GgFNIfE4';
const SHEET_NAME = 'report-eval';

function doPost(e) {
  return saveResponse(e);
}

function doGet(e) {
  return saveResponse(e);
}

function saveResponse(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    const header = [
      'タイムスタンプ',
      '採点者',
      '評価対象グループ',
      '課題',
      '1_解析結果の提示',
      '2_方法の再現性',
      '3_考察の論理性',
      '4_発表態度',
      '5_質疑応答への姿勢',
      '6_発表全体',
      '合計',
      'コメント'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(header);
    }

    // フォームは JSON を POST 本文 (text/plain) で送信する
    let p = {};
    if (e && e.postData && e.postData.contents) {
      p = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      p = e.parameter;
    }

    const row = [
      new Date(),
      p.grader || '',
      p.group || '',
      p.task || '',
      Number(p.s1) || '',
      Number(p.s2) || '',
      Number(p.s3) || '',
      Number(p.s4) || '',
      Number(p.s5) || '',
      Number(p.s6) || '',
      Number(p.total) || '',
      p.comment || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
