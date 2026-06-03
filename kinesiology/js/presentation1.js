// =====================================================================
// Google Apps Script Web App URL（設定必須）
// gas/presentation1_code.gs をデプロイ後、発行されたURLをここに貼り付ける
// =====================================================================
const GAS_URL = "";

const GROUPS = ["Group1", "Group2", "Group3", "Group4"];

function createEvalBlock(sectionId, prefix, index) {
  const block = document.createElement("div");
  block.className = "eval-block";
  block.innerHTML = `
    <h3>${index + 1}グループ目</h3>
    <div class="form-row">
      <label for="${prefix}-group-${index}">発表グループ <span class="required">必須</span></label>
      <select id="${prefix}-group-${index}" class="group-select" data-prefix="${prefix}">
        <option value="">選択してください</option>
        ${GROUPS.map(g => `<option value="${g}">${g}</option>`).join("")}
      </select>
    </div>
    <div class="form-row">
      <label for="${prefix}-comment-${index}">自由記載 <span class="required">必須</span></label>
      <textarea id="${prefix}-comment-${index}" placeholder="発表内容で良かった点、わかりやすかった点、質問、今後の改善点などを記入してください。"></textarea>
    </div>
  `;
  document.getElementById(sectionId).appendChild(block);
}

function initForm() {
  for (let i = 0; i < 3; i++) {
    createEvalBlock("strength-section", "strength", i);
    createEvalBlock("cop-section", "cop", i);
  }
  document.getElementById("own-group").addEventListener("change", updateGroupOptions);
  document.querySelectorAll(".group-select").forEach(el => {
    el.addEventListener("change", updateGroupOptions);
  });
  document.getElementById("btn-submit").addEventListener("click", submitForm);
}

document.addEventListener("DOMContentLoaded", initForm);

function updateGroupOptions() {
  const ownGroup = document.getElementById("own-group").value;
  document.querySelectorAll(".group-select").forEach(select => {
    const currentValue = select.value;
    [...select.options].forEach(opt => {
      if (!opt.value) return;
      opt.disabled = opt.value === ownGroup;
    });
    if (currentValue === ownGroup) select.value = "";
  });
}

function getSectionValues(prefix) {
  const values = [];
  for (let i = 0; i < 3; i++) {
    values.push({
      group: document.getElementById(`${prefix}-group-${i}`).value,
      comment: document.getElementById(`${prefix}-comment-${i}`).value.trim()
    });
  }
  return values;
}

function validateSection(values, ownGroup, sectionLabel) {
  const errors = [];
  const selectedGroups = values.map(v => v.group).filter(Boolean);

  if (values.some(v => !v.group)) {
    errors.push(`${sectionLabel}：発表グループを3つ選択してください。`);
  }
  if (values.some(v => !v.comment)) {
    errors.push(`${sectionLabel}：自由記載をすべて入力してください。`);
  }
  if (selectedGroups.includes(ownGroup)) {
    errors.push(`${sectionLabel}：自分のグループは選択できません。`);
  }
  if (new Set(selectedGroups).size !== selectedGroups.length) {
    errors.push(`${sectionLabel}：同じグループが重複しています。`);
  }

  const expected = GROUPS.filter(g => g !== ownGroup).sort().join(",");
  const actual = [...new Set(selectedGroups)].sort().join(",");
  if (ownGroup && selectedGroups.length === 3 && expected !== actual) {
    errors.push(`${sectionLabel}：自分以外の3グループをすべて選択してください。`);
  }
  return errors;
}

function validateForm() {
  const errors = [];
  const studentId = document.getElementById("student-id").value.trim();
  const ownGroup = document.getElementById("own-group").value;
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

  return { errors, studentId, ownGroup, strength, cop };
}

function submitForm() {
  const errorEl = document.getElementById("error-message");
  const statusEl = document.getElementById("submit-status");
  errorEl.textContent = "";
  statusEl.textContent = "";

  const { errors, studentId, ownGroup, strength, cop } = validateForm();
  if (errors.length > 0) {
    errorEl.textContent = errors.join("\n");
    return;
  }

  if (!GAS_URL) {
    statusEl.textContent = "※ 送信先未設定（js/presentation1.js の GAS_URL を設定してください）";
    statusEl.className = "submit-status error";
    return;
  }

  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  statusEl.textContent = "送信中...";
  statusEl.className = "submit-status sending";

  const params = new URLSearchParams({
    type: "presentation1",
    timestamp: new Date().toLocaleString("ja-JP"),
    studentId,
    ownGroup,
    strengthGroup1: strength[0].group,
    strengthComment1: strength[0].comment,
    strengthGroup2: strength[1].group,
    strengthComment2: strength[1].comment,
    strengthGroup3: strength[2].group,
    strengthComment3: strength[2].comment,
    copGroup1: cop[0].group,
    copComment1: cop[0].comment,
    copGroup2: cop[1].group,
    copComment2: cop[1].comment,
    copGroup3: cop[2].group,
    copComment3: cop[2].comment
  });

  fetch(`${GAS_URL}?${params.toString()}`, { mode: "no-cors" })
    .then(() => {
      document.getElementById("form-card").style.display = "none";
      document.getElementById("thanks-card").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
    .catch(() => {
      btn.disabled = false;
      statusEl.textContent = "送信に失敗しました（ネットワークを確認してください）";
      statusEl.className = "submit-status error";
    });
}
