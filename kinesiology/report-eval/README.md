# 運動学実習 発表評価フォーム — セットアップ手順

学生が発表を採点し、結果が Google スプレッドシートに自動記録されるフォームです。

## 構成

- `index.html` — 入力画面(GitHub Pages で公開)
- `config.js` — GAS ウェブアプリの URL を設定
- `../gas/report_eval_code.gs` — スプレッドシート書き込み用の Apps Script

保存先: スプレッドシート(ID: `15XyZojOEbbTCwbKyI4atjFGFtEY03pMK6v0GgFNIfE4`)に「report-eval」シートが自動作成されます。

## 1. Apps Script のデプロイ

1. https://script.google.com で「新しいプロジェクト」を作成(既存の presentation1 プロジェクトに関数を足すのではなく、別プロジェクト推奨)
2. `gas/report_eval_code.gs` の内容をエディタに貼り付けて保存
3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
   - 実行ユーザー: **自分**
   - アクセスできるユーザー: **全員**
4. 「デプロイ」を押し、承認画面で許可
5. 表示されたウェブアプリ URL(`https://script.google.com/macros/s/.../exec`)をコピー

## 2. config.js に URL を設定

```js
const GAS_URL = "https://script.google.com/macros/s/xxxxx/exec";
```

## 3. GitHub に push して公開

リポジトリ(`class`)のルートで:

```sh
git add kinesiology/report-eval kinesiology/gas/report_eval_code.gs
git commit -m "Add report evaluation form with GAS backend"
git push
```

GitHub Pages が有効なら、公開 URL は:

```
https://inojima.github.io/class/kinesiology/report-eval/
```

(Pages 未設定の場合: リポジトリの Settings → Pages → Branch を `main` / `(root)` にして Save)

## 4. 動作確認

公開 URL を開き、テスト送信 → スプレッドシートの「report-eval」シートに1行追加されれば成功。

## 記録される列

タイムスタンプ / 採点者 / 評価対象グループ / 課題 / 各評価項目1〜6(各5点) / 合計(30点満点) / コメント

## 注意

- GAS のコードを修正した場合は「デプロイ」→「デプロイを管理」→ 編集(鉛筆)→ バージョン「新バージョン」で再デプロイしないと反映されません(URL は変わりません)。
- 質問項目やグループ・課題の選択肢を変える場合は `index.html` を編集して push するだけで反映されます(列名を変える場合は `.gs` 側の header も合わせて修正)。
