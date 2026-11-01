import { createStore, STORAGE_KEY } from "./store.js";
import {
  addClass,
  saveGroup,
  adjust,
  validateBook,
  exportCsv,
  rankings,
} from "./model.js";
import { lookupDiseaseCode } from "../data/disease-catalog.js";
import { teacherView, groupForm, rankingList, codeLookupForm } from "./view.js";
import { button as b, escapeHtml as e } from "../ui/components.js";
function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export class TeacherApp {
  constructor(main, dialog, { leave, announce }) {
    this.main = main;
    this.dialog = dialog;
    this.leave = leave;
    this.announce = announce;
    this.stage = 1;
    this.section = "scores";
    this.query = "";
    this.abort = new AbortController();
    try {
      this.store = createStore(localStorage);
    } catch {
      this.loadError =
        "無法讀取本機紀錄：儲存功能可能被停用，或備份資料已損壞。原資料不會被自動覆寫。請匯出原檔或還原有效備份。";
    }
    const options = { signal: this.abort.signal };
    main.addEventListener("click", (event) => this.click(event), options);
    main.addEventListener("submit", (event) => this.submit(event), options);
    main.addEventListener("change", (event) => this.change(event), options);
    main.addEventListener(
      "input",
      (event) => {
        if (event.target.id === "group-search") {
          this.query = event.target.value;
          this.filter();
        }
      },
      options,
    );
    dialog.addEventListener("click", (event) => this.click(event), options);
    dialog.addEventListener("submit", (event) => this.submit(event), options);
    dialog.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        this.close();
      },
      options,
    );
    this.draw();
  }
  dispose() {
    this.abort.abort();
    this.close();
    this.main.replaceChildren();
  }
  get current() {
    return (
      this.store?.book.classes.find((entry) => entry.id === this.classId) ||
      this.store?.book.classes[0]
    );
  }
  draw() {
    const active = document.activeElement;
    const selector = active?.dataset.action
      ? '[data-action="' +
        active.dataset.action +
        '"]' +
        ["id", "stage", "section"]
          .filter((key) => active.dataset[key])
          .map(
            (key) =>
              "[data-" + key + '="' + CSS.escape(active.dataset[key]) + '"]',
          )
          .join("")
      : active?.id
        ? "#" + CSS.escape(active.id)
        : "#screen-title";
    if (this.loadError)
      this.main.innerHTML = `<section class="panel"><h1 id="screen-title" tabindex="-1">紀錄尚未載入</h1><p role="alert">${e(this.loadError)}</p><p id="teacher-error" class="form-error" role="alert"></p><div class="backup-controls">${b("匯出原始資料", "t-raw")}<label class="button secondary file-label">匯入 JSON 還原<input type="file" id="import-file" accept=".json,application/json"></label>${b("鎖定畫面", "t-lock")}</div></section>`;
    else {
      this.classId = this.current?.id;
      this.main.innerHTML = teacherView(
        this.store.book,
        this.classId,
        this.stage,
        this.section,
        this.store.canUndo,
        this.store.undoLabel,
        this.query,
      );
      this.filter();
    }
    this.main.querySelector(selector)?.focus({ preventScroll: true });
  }
  error(error, target = "teacher-error") {
    const el = document.getElementById(target);
    if (el) el.textContent = error.message || String(error);
  }
  commit(change, label) {
    try {
      this.store.commit(change, label);
      this.error("");
      this.announce(`${label}，已保存於這台裝置。`);
      return true;
    } catch (error) {
      this.error(new Error(`未保存，紀錄維持原值。${error.message}`));
      return false;
    }
  }
  open(markup, confirm) {
    this.confirm = confirm;
    this.origin = document.activeElement;
    this.dialog.innerHTML = markup;
    this.dialog.showModal();
  }
  close() {
    if (this.dialog.open) this.dialog.close();
    this.dialog.replaceChildren();
    this.confirm = null;
    if (this.origin?.isConnected) this.origin.focus({ preventScroll: true });
  }
  confirmBox(title, text, action) {
    this.open(
      `<h2 id="dialog-title">${e(title)}</h2><p>${e(text)}</p><div class="dialog-actions">${b("取消", "t-cancel")}${b("確認", "t-confirm", { kind: "primary" })}</div>`,
      action,
    );
  }
  click(event) {
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    if (!action.startsWith("t-")) return;
    if (action === "t-lock" || action === "t-logout") {
      this.leave(action === "t-lock" ? "lock" : "home");
      return;
    }
    if (action === "t-cancel") return this.close();
    if (action === "t-code-lookup") return this.open(codeLookupForm());
    if (action === "t-confirm") {
      const confirm = this.confirm;
      this.close();
      confirm?.();
      return;
    }
    if (action === "t-raw") {
      try {
        download(
          localStorage.getItem(STORAGE_KEY) || "",
          "medical-teacher-original.json",
          "application/json",
        );
      } catch (error) {
        this.error(error);
      }
      return;
    }
    if (!this.store) return;
    if (action === "t-backup")
      return download(
        JSON.stringify(this.store.book, null, 2),
        "medical-teacher-backup.json",
        "application/json",
      );
    if (action === "t-csv")
      return download(
        exportCsv(this.store.book),
        "medical-scores.csv",
        "text/csv;charset=utf-8",
      );
    if (action === "t-undo") {
      try {
        const label = this.store.undoLabel;
        if (this.store.undo()) {
          this.draw();
          this.announce(`已復原：${label}`);
        }
      } catch (error) {
        this.error(error);
      }
      return;
    }
    if (action === "t-section") {
      this.section = target.dataset.section;
      if (this.section === "scores" && this.stage === 3) this.stage = 1;
      this.draw();
      return;
    }
    if (action === "t-stage") {
      this.stage = Number(target.dataset.stage);
      this.draw();
      return;
    }
    if (action === "t-add-group") return this.open(groupForm());
    const current = this.current,
      group = current?.groups.find((item) => item.id === target.dataset.id);
    if (!group) return;
    if (action === "t-edit-group") return this.open(groupForm(group));
    if (action === "t-delete-group")
      return this.confirmBox(
        `刪除第 ${group.number} 組？`,
        "這會刪除本組座號、兩階段成績與病例安排，其他組別不受影響。可用最近一次操作復原。",
        () => {
          if (
            this.commit((book) => {
              const entry = book.classes.find((item) => item.id === current.id);
              entry.groups = entry.groups.filter(
                (item) => item.id !== group.id,
              );
            }, `刪除第 ${group.number} 組`)
          )
            this.draw();
        },
      );
    if (action === "t-adjust") {
      const field = target.dataset.field,
        delta = Number(target.dataset.delta);
      if (
        this.commit(
          (book) =>
            adjust(
              book.classes
                .find((item) => item.id === current.id)
                .groups.find((item) => item.id === group.id),
              this.stage,
              field,
              delta,
            ),
          `${current.name}班第${group.number}組${field === "questions" ? "問題數" : "完成數"}${delta > 0 ? "增加" : "減少"}一次`,
        )
      )
        this.refreshScores();
    }
  }
  filter() {
    const current = this.current;
    if (!current) return;
    const query = this.query.trim();
    let count = 0;
    for (const group of current.groups) {
      const show =
        !query ||
        String(group.number).includes(query) ||
        group.seats.some((seat) => seat.includes(query));
      if (show) count++;
      for (const attr of ["data-group", "data-plan-group"]) {
        const row = this.main.querySelector(
          "[" + attr + '="' + group.id + '"]',
        );
        if (row) row.hidden = !show;
      }
    }
    const status = this.main.querySelector("#filter-status");
    if (status)
      status.textContent = `顯示 ${count} / ${current.groups.length} 組，正式排名仍涵蓋全班。`;
  }
  refreshScores() {
    const current = this.current;
    for (const group of current.groups) {
      const row = this.main.querySelector(`[data-group="${group.id}"]`);
      if (!row) continue;
      for (const field of ["questions", "completed"]) {
        const cell = row.querySelector(`[data-field="${field}"]`),
          value = group.scores[this.stage][field];
        cell.querySelector("output").textContent = value;
        cell.querySelector('[data-delta="-1"]').disabled = value === 0;
        cell.querySelector('[data-delta="1"]').disabled =
          value === (field === "completed" ? 5 : Number.MAX_SAFE_INTEGER);
      }
      row.querySelector("[data-progress]").textContent =
        `${group.scores[this.stage].completed}/5 已完成`;
    }
    this.main.querySelector("[data-ranking]").innerHTML = rankingList(
      current,
      this.stage,
    );
    // Derive badges from the same ranking output while leaving interactive row nodes stable.
    {
      for (const { group, rank } of rankings(this.current.groups, this.stage)) {
        const badge = this.main.querySelector(
          `[data-group="${group.id}"] [data-rank]`,
        );
        if (badge)
          badge.textContent = rank === null ? "進行中" : `第 ${rank} 名`;
      }
    }
    const undo = this.main.querySelector('[data-action="t-undo"]');
    undo.disabled = !this.store.canUndo;
    undo.title = this.store.undoLabel;
  }
  submit(event) {
    const form = event.target;
    if (!["class-form", "group-form", "code-lookup-form"].includes(form.id))
      return;
    event.preventDefault();
    const data = new FormData(form);
    if (form.id === "code-lookup-form") {
      const match = lookupDiseaseCode(data.get("diseaseCode"));
      this.dialog.querySelector("#code-lookup-result").innerHTML = match
        ? `<p><strong>${e(match.disease)}</strong></p><p>病例編號：${e(match.caseNumber)}</p>`
        : "<p>查無對應疾病</p>";
      return;
    }

    if (form.id === "class-form") {
      let newId;
      try {
        if (
          this.commit((book) => {
            newId = addClass(book, data.get("className"));
          }, "新增班級")
        ) {
          this.classId = newId;
          this.draw();
        }
      } catch (error) {
        this.error(error);
      }
      return;
    }
    try {
      // Validate before commit to keep errors inside the modal.
      const entry = structuredClone(this.current);
      saveGroup(
        entry,
        form.dataset.id,
        Number(data.get("number")),
        Array.from({ length: 5 }, (_, i) => data.get(`seat${i}`)),
      );
      if (
        this.commit(
          (book) => {
            book.classes[
              book.classes.findIndex((item) => item.id === entry.id)
            ] = entry;
          },
          form.dataset.id ? "修改組別" : "新增組別",
        )
      ) {
        this.close();
        this.draw();
      } else
        this.error(
          "無法保存，請關閉視窗查看錯誤；原紀錄未更動。",
          "group-error",
        );
    } catch (error) {
      this.error(error, "group-error");
    }
  }
  async change(event) {
    if (event.target.id === "class-select") {
      this.query = "";
      this.classId = event.target.value;
      this.draw();
      return;
    }
    if (event.target.id !== "import-file") return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("備份檔案不可超過 2 MB。");
      const book = validateBook(JSON.parse(await file.text()));
      if (this.abort.signal.aborted) return;
      const original = localStorage.getItem(STORAGE_KEY);
      this.confirmBox(
        "以備份還原這台裝置？",
        `備份包含 ${book.classes.length} 個班級。確認後將取代目前所有班級及成績；建議先取消並下載 JSON 備份。`,
        () => {
          try {
            if (this.store) {
              if (
                !this.commit((next) => {
                  next.classes = book.classes;
                }, "匯入備份")
              )
                return;
            } else {
              if (localStorage.getItem(STORAGE_KEY) !== original)
                throw new Error("資料已由其他分頁更新，請重新整理。");
              localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
              this.store = createStore(localStorage);
              this.loadError = null;
            }
            this.classId = this.store.book.classes[0]?.id;
            this.draw();
            this.announce("備份已還原並保存在這台裝置。");
          } catch (error) {
            this.error(error);
          }
        },
      );
    } catch (error) {
      this.error(new Error(`未匯入，原資料未變更。${error.message}`));
    }
  }
}
