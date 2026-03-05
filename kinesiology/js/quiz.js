// =====================================================================
// Google Apps Script Web App URL（設定必須）
// gas/code.gs をデプロイ後、発行されたURLをここに貼り付ける
// =====================================================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbyDMQANz5d9924k10H2fkWnsQWAisE7WSeDewuWgijOaPxViNwwa0qOWPqnatgXmNFC/exec"; 

// =====================================================================
// 状態管理
// =====================================================================
let quizData = null;
let currentIndex = 0;
let answers = [];
let studentId = "";

// =====================================================================
// 初期化
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const quizId = params.get("id");

  if (!quizId) {
    showError("クイズIDが指定されていません。");
    return;
  }

  fetch(`data/quiz0${quizId}.json`)
    .then(r => {
      if (!r.ok) throw new Error("問題データが見つかりません");
      return r.json();
    })
    .then(data => {
      quizData = data;
      document.getElementById("quiz-title").textContent = data.title;
      showScreen("screen-id");
    })
    .catch(err => showError(err.message));
});

// =====================================================================
// 画面切り替え
// =====================================================================
function showScreen(id) {
  ["screen-id", "screen-question", "screen-result"].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? "block" : "none";
  });
}

function showError(msg) {
  document.getElementById("loading").innerHTML =
    `<p style="color:#e74c3c;font-weight:bold;">エラー: ${msg}</p>`;
}

// =====================================================================
// 学籍番号の確認・スタート
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("btn-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const input = document.getElementById("student-id").value.trim();
      if (!input) {
        alert("学籍番号を入力してください。");
        return;
      }
      studentId = input;
      currentIndex = 0;
      answers = [];
      showQuestion();
      showScreen("screen-question");
    });
  }
});

// =====================================================================
// 問題表示
// =====================================================================
function showQuestion() {
  const q = quizData.questions[currentIndex];
  const total = quizData.questions.length;

  // 進捗
  document.getElementById("progress-text").textContent =
    `問題 ${currentIndex + 1} / ${total}`;
  document.getElementById("progress-bar").style.width =
    `${(currentIndex / total) * 100}%`;

  // 問題文
  document.getElementById("question-text").textContent =
    `Q${currentIndex + 1}. ${q.question}`;

  // 選択肢を生成
  const list = document.getElementById("options-list");
  list.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = `${["①","②","③","④"][i]}　${opt}`;
    btn.addEventListener("click", () => selectAnswer(i));
    list.appendChild(btn);
  });

  // フィードバックをリセット
  const fb = document.getElementById("feedback-box");
  fb.style.display = "none";
  fb.className = "feedback-box";

  // 次へボタンをリセット
  const nextBtn = document.getElementById("btn-next");
  nextBtn.style.display = "none";
  nextBtn.textContent =
    currentIndex + 1 < quizData.questions.length ? "次の問題へ" : "結果を見る";
}

// =====================================================================
// 回答処理
// =====================================================================
function selectAnswer(selected) {
  const q = quizData.questions[currentIndex];
  const correct = q.answer;
  const btns = document.querySelectorAll(".option-btn");

  // ボタンを無効化
  btns.forEach(b => (b.disabled = true));

  // 正誤の色付け
  btns[correct].classList.add("correct");
  if (selected !== correct) {
    btns[selected].classList.add("incorrect");
  }

  // 回答を記録
  answers.push({ questionId: q.id, selected, correct, isCorrect: selected === correct });

  // フィードバック表示
  const fb = document.getElementById("feedback-box");
  fb.style.display = "block";
  fb.className = `feedback-box ${selected === correct ? "correct" : "incorrect"}`;
  fb.innerHTML = selected === correct
    ? `<strong>正解！</strong><p class="explanation">解説：${q.explanation}</p>`
    : `<strong>不正解</strong>（正解：${["①","②","③","④"][correct]}）<p class="explanation">解説：${q.explanation}</p>`;

  // 次へボタン表示
  document.getElementById("btn-next").style.display = "block";
}

// =====================================================================
// 次の問題 / 結果
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentIndex++;
      if (currentIndex < quizData.questions.length) {
        showQuestion();
      } else {
        showResult();
      }
    });
  }
});

// =====================================================================
// 結果表示
// =====================================================================
function showResult() {
  showScreen("screen-result");

  const total = quizData.questions.length;
  const correct = answers.filter(a => a.isCorrect).length;

  document.getElementById("result-score").textContent = `${correct} / ${total}`;
  document.getElementById("result-message").textContent =
    correct === total ? "全問正解！素晴らしい！" :
    correct >= total * 0.8 ? "よくできました！" :
    correct >= total * 0.6 ? "もう少し復習しましょう。" : "教科書を見直してみましょう。";

  // 正誤一覧
  const list = document.getElementById("result-list");
  list.innerHTML = "";
  answers.forEach((a, i) => {
    const q = quizData.questions[i];
    const li = document.createElement("li");
    li.className = `result-item ${a.isCorrect ? "ok" : "ng"}`;
    li.textContent = `Q${i + 1}：${a.isCorrect ? "○" : "×"}　${q.question.slice(0, 30)}…`;
    list.appendChild(li);
  });

  // スプレッドシートに送信
  submitToSpreadsheet(correct, total);
}

// =====================================================================
// Google スプレッドシートへの送信
// =====================================================================
function submitToSpreadsheet(correct, total) {
  const statusEl = document.getElementById("submit-status");

  if (!GAS_URL) {
    statusEl.textContent = "※ 送信先未設定（GAS_URLを設定してください）";
    statusEl.className = "submit-status error";
    return;
  }

  statusEl.textContent = "送信中...";
  statusEl.className = "submit-status sending";

  const payload = {
    timestamp: new Date().toLocaleString("ja-JP"),
    studentId,
    quizId: quizData.id,
    quizTitle: quizData.title,
    score: correct,
    total,
    answers: answers.map(a => (a.isCorrect ? "○" : "×")).join(",")
  };

    // no-corsモードではapplication/jsonが使えないためURLSearchParamsで送信
  const formData = new URLSearchParams();
  Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));

  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  })

    .then(() => {
      statusEl.textContent = "✓ 結果を送信しました";
      statusEl.className = "submit-status success";
    })
    .catch(() => {
      statusEl.textContent = "送信に失敗しました（ネットワークを確認してください）";
      statusEl.className = "submit-status error";
    });
}
