import { emptyBook, validateBook } from "./model.js";
export const STORAGE_KEY = "medical-challenge-teacher-v1";
export function createStore(storage) {
  let raw = storage.getItem(STORAGE_KEY);
  let book = raw === null ? emptyBook() : validateBook(JSON.parse(raw));
  let undo = null;
  return {
    get book() {
      return structuredClone(book);
    },
    get canUndo() {
      return !!undo;
    },
    get undoLabel() {
      return undo?.label || "";
    },
    commit(change, label) {
      // Guard against another tab overwriting a newer saved revision.
      if (storage.getItem(STORAGE_KEY) !== raw)
        throw new Error("另一個分頁已更新紀錄。請備份後重新整理，避免覆寫。");
      const next = structuredClone(book);
      change(next);
      const valid = validateBook(next),
        text = JSON.stringify(valid);
      if (text === JSON.stringify(book)) return false;
      storage.setItem(STORAGE_KEY, text); // failure leaves current memory + saved book unchanged
      undo = { book, label };
      book = valid;
      raw = text;
      return true;
    },
    undo() {
      if (!undo) return false;
      if (storage.getItem(STORAGE_KEY) !== raw)
        throw new Error("另一個分頁已更新，請重新整理後再操作。");
      const text = JSON.stringify(undo.book);
      storage.setItem(STORAGE_KEY, text);
      book = undo.book;
      raw = text;
      undo = null;
      return true;
    },
  };
}
