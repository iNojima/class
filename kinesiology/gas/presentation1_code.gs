function doGet(e) {
  const sheetName = 'presentation1';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const header = [
    'timestamp',
    'studentId',
    'ownGroup',
    'strengthGroup1', 'strengthComment1',
    'strengthGroup2', 'strengthComment2',
    'strengthGroup3', 'strengthComment3',
    'copGroup1', 'copComment1',
    'copGroup2', 'copComment2',
    'copGroup3', 'copComment3'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
  }

  const p = e.parameter;
  sheet.appendRow(header.map(key => p[key] || ''));

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
