const GAS_URL = "";

let quizData = null;
let currentIndex = 0;
let answers = [];
let studentId = "";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const quizId = params.get("id");

  if (!quizId) {
    showError("クイズIDが指定されていません。");
    return;
  }

  const normalizedQuizId = String(Number(quizId)).padStart(2, "0");

  fetch(`data/quiz${normalizedQuizId}.json`)
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

  document.getElementById("btn-start").addEventListener("click", startQuiz);
  document.getElementById("btn-next").addEventListener("click", moveNext);
});

function showScreen(id) {
  ["loading", "screen-id", "screen-question", "screen-result"].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? "block" : "none";
  });
}

function showError(msg) {
  const loading = document.getElementById("loading");
  loading.style.display = "block";
  loading.innerHTML = `<p class="error-text">エラー: ${msg}</p>`;
}

function setAttemptStatus(message, className = "") {
  const statusEl = document.getElementById("attempt-status");
  statusEl.textContent = message;
  statusEl.className = `attempt-status ${className}`.trim();
}

async function startQuiz() {
  const input = document.getElementById("student-id").value.trim();
  if (!input) {
    alert("学籍番号を入力してください。");
    return;
  }

  studentId = input;

  if (GAS_URL) {
    const startBtn = document.getElementById("btn-start");
    startBtn.disabled = true;
    startBtn.textContent = "受験状況を確認中...";
    setAttemptStatus("過去の回答を確認しています...", "checking");

    try {
      const result = await sendToGas({
        action: "check",
        studentId,
        quizId: String(quizData.id)
      });

      if (result.alreadyTaken || result.status === "duplicate" || result.canStart === false) {
        setAttemptStatus("この学籍番号はすでに回答済みです。再受験はできません。", "error");
        startBtn.textContent = "回答済み";
        return;
      }

      setAttemptStatus("", "");
      startBtn.disabled = false;
      startBtn.textContent = "テストを開始する";
    } catch (err) {
      setAttemptStatus("受験状況を確認できませんでした。時間をおいて再度お試しください。", "error");
      startBtn.disabled = false;
      startBtn.textContent = "テストを開始する";
      return;
    }
  }

  currentIndex = 0;
  answers = [];
  showQuestion();
  showScreen("screen-question");
}

function showQuestion() {
  const q = quizData.questions[currentIndex];
  const total = quizData.questions.length;

  document.getElementById("progress-text").textContent =
    `問題 ${currentIndex + 1} / ${total}`;
  document.getElementById("progress-bar").style.width =
    `${((currentIndex + 1) / total) * 100}%`;
  document.getElementById("question-text").textContent =
    `Q${currentIndex + 1}. ${q.question}`;

  const list = document.getElementById("options-list");
  list.innerHTML = "";
  q.options.forEach((opt, i) => {
    const item = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = `${["①","②","③","④"][i]}　${opt}`;
    btn.addEventListener("click", () => selectAnswer(i));
    item.appendChild(btn);
    list.appendChild(item);
  });

  const fb = document.getElementById("feedback-box");
  fb.style.display = "none";
  fb.className = "feedback-box";

  const nextBtn = document.getElementById("btn-next");
  nextBtn.style.display = "none";
  nextBtn.textContent =
    currentIndex + 1 < total ? "次の問題へ" : "結果を見る";
}

function selectAnswer(selected) {
  const q = quizData.questions[currentIndex];
  const correct = q.answer;
  const btns = document.querySelectorAll(".option-btn");

  btns.forEach(b => {
    b.disabled = true;
  });

  btns[correct].classList.add("correct");
  if (selected !== correct) {
    btns[selected].classList.add("incorrect");
  }

  answers.push({
    questionId: q.id,
    selected,
    correct,
    isCorrect: selected === correct
  });

  const fb = document.getElementById("feedback-box");
  fb.style.display = "block";
  fb.className = `feedback-box ${selected === correct ? "correct" : "incorrect"}`;
  fb.innerHTML = selected === correct
    ? `<strong>正解！</strong><p class="explanation">解説：${q.explanation}</p>`
    : `<strong>不正解</strong>（正解：${["①","②","③","④"][correct]}）<p class="explanation">解説：${q.explanation}</p>`;

  document.getElementById("btn-next").style.display = "block";
}

function moveNext() {
  currentIndex++;
  if (currentIndex < quizData.questions.length) {
    showQuestion();
    return;
  }

  showResult();
}

function showResult() {
  showScreen("screen-result");

  const total = quizData.questions.length;
  const correct = answers.filter(a => a.isCorrect).length;

  document.getElementById("result-score").textContent = `${correct} / ${total}`;
  document.getElementById("result-message").textContent =
    correct === total ? "全問正解！よく整理できています。" :
    correct >= total * 0.8 ? "よくできました。" :
    correct >= total * 0.6 ? "もう少し復習しましょう。" : "資料を見直してみましょう。";

  const list = document.getElementById("result-list");
  list.innerHTML = "";
  answers.forEach((a, i) => {
    const q = quizData.questions[i];
    const li = document.createElement("li");
    li.className = `result-item ${a.isCorrect ? "ok" : "ng"}`;
    li.textContent = `Q${i + 1}：${a.isCorrect ? "○" : "×"}　${q.question.slice(0, 30)}…`;
    list.appendChild(li);
  });

  submitToSpreadsheet(correct, total);
}

function submitToSpreadsheet(correct, total) {
  const statusEl = document.getElementById("submit-status");

  if (!GAS_URL) {
    statusEl.textContent = "※ 送信先未設定：必要に応じてjs/quiz.jsのGAS_URLを設定してください";
    statusEl.className = "submit-status error";
    return;
  }

  statusEl.textContent = "送信中...";
  statusEl.className = "submit-status sending";

  sendToGas({
    action: "submit",
    timestamp: new Date().toLocaleString("ja-JP"),
    studentId,
    quizId: String(quizData.id),
    quizTitle: quizData.title,
    score: String(correct),
    total: String(total),
    answers: answers.map(a => (a.isCorrect ? "○" : "×")).join(",")
  })
    .then(result => {
      if (result.alreadyTaken || result.status === "duplicate") {
        statusEl.textContent = "この学籍番号はすでに回答済みです。今回の結果は保存されませんでした。";
        statusEl.className = "submit-status error";
        return;
      }

      statusEl.textContent = "✓ 結果を送信しました";
      statusEl.className = "submit-status success";
    })
    .catch(() => {
      statusEl.textContent = "送信に失敗しました（ネットワークを確認してください）";
      statusEl.className = "submit-status error";
    });
}

function sendToGas(params) {
  return new Promise((resolve, reject) => {
    const callbackName = `quizCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, 10000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = result => {
      cleanup();
      resolve(result || {});
    };

    const query = new URLSearchParams({
      ...params,
      callback: callbackName
    });

    script.onerror = () => {
      cleanup();
      reject(new Error("script load error"));
    };

    script.src = `${GAS_URL}?${query.toString()}`;
    document.body.appendChild(script);
  });
}
