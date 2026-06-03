```javascript
// =====================================================================
// presentation1.js
// Kinesiology presentation survey
// =====================================================================

// Google Apps Script Web App URL
// Apps Scriptで「ウェブアプリ」としてデプロイした /exec で終わるURLを入れる
const GAS_URL = "https://script.google.com/macros/s/AKfycbwKkGAQ47jOUMlrUfd3sYOG0Eb774ulodO9aVm03krdweq7TPVEJWr2-ZpVZLN-X40r/exec";

const GROUPS = ["Group1", "Group2", "Group3", "Group4"];

// ---------------------------------------------------------------------
// 評価ブロック作成
// ---------------------------------------------------------------------
function createEvalBlock(sectionId, prefix, index) {
  const block = document.createElement("div");
  block.className = "eval-block";

  block.innerHTML = `
    <h3>${index + 1}グループ目</h3>

    <div class="form-row">
      <label for="${prefix}-group-${index}">
        発表グループ <span class="required">必須</span>
      </label>
      <select id="${prefix}-group-${index}" class="group-select" data-prefix="${prefix}">
        <option value="">選択してください</option>
        ${GROUPS.map(group => `<option value="${group}">${group}</option>`).join("")}
      </select>
    </div>

    <div class="form-row">
      <label for="${prefix}-comment-${index}">
        自由記載 <span class="required">必須</span>
      </label>
      <textarea
        id="${prefix}-comment-${index}"
        placeholder="発表内容で良かった点、わかりやすかった点、質問、今後の改善点などを記入してください。"
      ></textarea>
    </div>
  `;

  const section = document.getElementById(sectionId);
  if (section) {
    section.appendChild(block);
  }
}

// ---------------------------------------------------------------------
// 初期化
// ---------------------------------------------------------------------
function initForm() {
  for (let i = 0; i < 3; i++) {
    createEvalBlock("strength-section", "strength", i);
    createEvalBlock("cop-section", "cop", i);
  }

  const ownGroupEl = document.getElementById("own-group");
  if (ownGroupEl) {
    ownGroupEl.addEventListener("change", updateGroupOptions);
  }

  document.querySelectorAll(".group-select").forEach(select => {
    select.addEventListener("change", updateGroupOptions);
  });

  const submitBtn = document.getElementById("btn-submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitForm);
  }

  updateGroupOptions();
}

document.addEventListener("DOMContentLoaded", initForm);

// ---------------------------------------------------------------------
// 自分のグループを選択不可にする
// ---------------------------------------------------------------------
function updateGroupOptions() {
  const ownGroupEl = document.getElementById("own-group");
  const ownGroup = ownGroupEl ? ownGroupEl.value : "";

  document.querySelectorAll(".group-select").forEach(select => {
    const currentValue = select.value;

    Array.from(select.options).forEach(option => {
      if (!option.value) return;
      option.disabled = option.value === ownGroup;
    });

    if (currentValue === ownGroup) {
      select.value = "";
    }
  });
}

// ---------------------------------------------------------------------
// 各セクションの値取得
// ---------------------------------------------------------------------
function getSectionValues(prefix) {
  const values = [];

  for (let i = 0; i < 3; i++) {
    const groupEl = document.getElementById(`${prefix}-group-${i}`);
    const commentEl = document.getElementById(`${prefix}-comment-${i}`);

    values.push({
      group: groupEl ? groupEl.value : "",
      comment: commentEl ? commentEl.value.trim() : ""
    });
  }

  return values;
}

// ---------------------------------------------------------------------
// セクション単位のバリデーション
// ---------------------------------------------------------------------
function validateSection(values, ownGroup, sectionLabel) {
  const errors = [];
  const selectedGroups = values.map(v => v.group).filter(Boolean);

  if (values.some(v => !v.group)) {
    errors.push(`${sectionLabel}：発表グループを3つ選択してください。`);
  }

  if (values.some(v => !v.comment)) {
    errors.push(`${sectionLabel}：自由記載をすべて入力してください。`);
  }

  if (ownGroup && selectedGroups.includes(ownGroup)) {
    errors.push(`${sectionLabel}：自分のグループは選択できません。`);
  }

  if (new Set(selectedGroups).size !== selectedGroups.length) {
    errors.push(`${sectionLabel}：同じグループが重複しています。`);
  }

  if (ownGroup && selectedGroups.length === 3) {
    const expected = GROUPS.filter(group => group !== ownGroup).sort().join(",");
    const actual = [...new Set(selectedGroups)].sort().join(",");

    if (expected !== actual) {
      errors.push(`${sectionLabel}：自分以外の3グループをすべて選択してください。`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------
// フォーム全体のバリデーション
// ---------------------------------------------------------------------
function validateForm() {
  const errors = [];

  const studentIdEl = document.getElementById("student-id");
  const ownGroupEl = document.getElementById("own-group");

  const studentId = studentIdEl ? studentIdEl.value.trim() : "";
  const ownGroup = ownGroupEl ? ownGroupEl.value : "";

  const strength = getSectionValues("strength");
  const cop = getSectionValues("cop");

  if (!/^c\d{6}$/i.test(studentId)) {
    errors.push("学籍番号は c251111 の形式で入力してください。");
  }

  if (!ownGroup) {
    errors.push("自分のグループを選択してください。");
  }

  errors.push(...validateSection(strength, ownGroup, "筋力"));
  errors.push(...validateSection(cop, ownGroup, "重心動揺"));

  return {
    errors,
    studentId,
    ownGroup,
    strength,
    cop
  };
}

// ---------------------------------------------------------------------
// 送信処理
// ---------------------------------------------------------------------
function submitForm() {
  const errorEl = document.getElementById("error-message");
  const statusEl = document.getElementById("submit-status");
  const btn = document.getElementById("btn-submit");

  if (errorEl) errorEl.textContent = "";
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.className = "submit-status";
  }

  const { errors, studentId, ownGroup, strength, cop } = validateForm();

  if (errors.length > 0) {
    if (errorEl) {
      errorEl.textContent = errors.join("\n");
    }
    return;
  }

  if (!GAS_URL || GAS_URL.includes("ここに") || GAS_URL.includes("YOUR_GAS")) {
    if (statusEl) {
      statusEl.textContent = "※ 送信先未設定（js/presentation1.js の GAS_URL を設定してください）";
      statusEl.className = "submit-status error";
    }
    return;
  }

  if (btn) btn.disabled = true;

  if (statusEl) {
    statusEl.textContent = "送信中...";
    statusEl.className = "submit-status sending";
  }

  const params = new URLSearchParams();

  params.append("type", "presentation1");
  params.append("studentId", studentId);
  params.append("ownGroup", ownGroup);

  params.append("strengthGroup1", strength[0].group);
  params.append("strengthComment1", strength[0].comment);
  params.append("strengthGroup2", strength[1].group);
  params.append("strengthComment2", strength[1].comment);
  params.append("strengthGroup3", strength[2].group);
  params.append("strengthComment3", strength[2].comment);

  params.append("copGroup1", cop[0].group);
  params.append("copComment1", cop[0].comment);
  params.append("copGroup2", cop[1].group);
  params.append("copComment2", cop[1].comment);
  params.append("copGroup3", cop[2].group);
  params.append("copComment3", cop[2].comment);

  fetch(`${GAS_URL}?${params.toString()}`, {
    method: "GET",
    mode: "no-cors"
  })
    .then(() => {
      const formCard = document.getElementById("form-card");
      const thanksCard = document.getElementById("thanks-card");

      if (formCard) formCard.style.display = "none";
      if (thanksCard) thanksCard.style.display = "block";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    })
    .catch(error => {
      console.error(error);

      if (btn) btn.disabled = false;

      if (statusEl) {
        statusEl.textContent = "送信に失敗しました。ネットワーク環境を確認して、もう一度送信してください。";
        statusEl.className = "submit-status error";
      }
    });
}
```
