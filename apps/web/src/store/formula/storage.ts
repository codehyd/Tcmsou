import { FORMULA_SHEETS_KEY } from "@/constants/formula";
import { isFormulaReady } from "@/lib/formula";
import {
  FORMULA_FOOTNOTES,
  FORMULA_PROCESSES,
  FORMULA_STANDARDS,
  type FormulaFootnoteId,
  type FormulaProcessId,
  type FormulaStandardId,
  type FormulaSheet,
  type FormulaSheetStatus,
} from "@/types/formula";
import { utils } from "@/utils";

const FOOTNOTE_IDS = new Set<string>(FORMULA_FOOTNOTES.map((item) => item.id));
const STANDARD_IDS = new Set<string>(FORMULA_STANDARDS.map((item) => item.id));
const PROCESS_IDS = new Set<string>(FORMULA_PROCESSES.map((item) => item.id));

function isFootnote(value: unknown): value is FormulaFootnoteId {
  return typeof value === "string" && FOOTNOTE_IDS.has(value);
}

// 空着或认不出的标准都当成还没选
function readStandard(value: unknown): FormulaStandardId {
  if (typeof value === "string" && STANDARD_IDS.has(value)) {
    return value as FormulaStandardId;
  }

  return "";
}

// 空着或认不出的炮制都当成还没标
function readProcess(value: unknown): FormulaProcessId {
  if (typeof value === "string" && PROCESS_IDS.has(value)) {
    return value as FormulaProcessId;
  }

  return "";
}

// 读出来的一条必须有药编号和药名，脚注不在清单里就改回无
function normalizeLine(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const line = value as Partial<FormulaSheet["lines"][number]>;

  if (typeof line.herbId !== "string" || typeof line.name !== "string") {
    return null;
  }

  return {
    lineId: typeof line.lineId === "string" && line.lineId ? line.lineId : line.herbId,
    herbId: line.herbId,
    name: line.name,
    categoryTag: typeof line.categoryTag === "string" ? line.categoryTag : "",
    unit: typeof line.unit === "string" && line.unit.trim() ? line.unit : "克",
    dose: typeof line.dose === "string" ? line.dose : "",
    standard: readStandard(line.standard),
    process: readProcess(line.process),
    source: typeof line.source === "string" ? line.source : "",
    footnote: isFootnote(line.footnote) ? line.footnote : "none",
  };
}

// 一张拟方至少要有编号。坏掉的行丢掉，同一行编号只留第一次出现的
function normalizeSheet(value: unknown): FormulaSheet | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const sheet = value as Partial<FormulaSheet>;

  if (typeof sheet.id !== "string") {
    return null;
  }

  const seen = new Set<string>();
  const lines = Array.isArray(sheet.lines)
    ? sheet.lines.flatMap((line) => {
        const normalized = normalizeLine(line);

        if (!normalized || seen.has(normalized.lineId)) {
          return [];
        }

        seen.add(normalized.lineId);

        return [normalized];
      })
    : [];

  const next: FormulaSheet = {
    id: sheet.id,
    createdAt: typeof sheet.createdAt === "string" ? sheet.createdAt : new Date().toISOString(),
    updatedAt: typeof sheet.updatedAt === "string" ? sheet.updatedAt : new Date().toISOString(),
    doseCount: typeof sheet.doseCount === "string" ? sheet.doseCount : "",
    dailyDoses: typeof sheet.dailyDoses === "string" ? sheet.dailyDoses : "",
    doseEach: typeof sheet.doseEach === "string" ? sheet.doseEach : "",
    name: typeof sheet.name === "string" ? sheet.name : "",
    usage: typeof sheet.usage === "string" ? sheet.usage : "",
    lines,
    // 先占个草稿，下面再按存过的状态或旧数据是否开齐来改
    status: "draft",
  };

  return {
    ...next,
    status: readStatus(sheet.status, next),
  };
}

// 认保存状态。旧数据没写这个字段时，处方名、剂数和剂量都齐了就当成已经保存过
function readStatus(value: unknown, sheet: FormulaSheet): FormulaSheetStatus {
  if (value === "saved" || value === "draft") {
    return value;
  }

  return isFormulaReady(sheet) ? "saved" : "draft";
}

// 打开页面时读拟方。没有或坏了就当一份都没有
export function loadFormulaSheets(): FormulaSheet[] {
  const stored = utils.cache.get<unknown[]>(FORMULA_SHEETS_KEY, "json");

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.flatMap((item) => {
    const sheet = normalizeSheet(item);

    return sheet ? [sheet] : [];
  });
}

// 把全部拟方写回浏览器
export function saveFormulaSheets(sheets: FormulaSheet[]) {
  utils.cache.set(FORMULA_SHEETS_KEY, sheets, "json");
}
