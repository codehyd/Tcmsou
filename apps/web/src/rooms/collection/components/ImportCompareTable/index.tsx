import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { useVirtualizer } from "@tanstack/react-virtual";

import { compareTable } from "./styles";
import { useNarrowScreen } from "@/lib/use-narrow-screen";
import { Input } from "@/components/ui/input";
import {
  getImportFieldValue,
  IMPORT_FIELD_LABELS,
  type ImportDuplicate,
  type ParsedHerbImport,
} from "@/lib/herb-import";
import type { Herb, ImportFieldKey, ImportFieldPick } from "@/types/herb";

// 表上要摊开的说明书栏目，拼音跟在药名下面，不单独占一列
const SHEET_FIELDS = ["class", "nature", "meridians", "functions", "indications"] as const;

type SheetField = (typeof SHEET_FIELDS)[number];

type RowStatus = "fresh" | "duplicate" | "unchanged";

// 表上的一行：新药、要对照的、和本室一样的，都收成同一种纸条
type ImportSheetRow = {
  id: string;
  status: RowStatus;
  name: string;
  incoming: Herb;
  existing?: Herb;
  diffs: ImportFieldKey[];
  duplicateIndex?: number;
};

// 筛子上的字，点它就只留下这一叠
const STATUS_LABEL: Record<RowStatus | "all", string> = {
  all: "全部",
  fresh: "新增",
  duplicate: "需对照",
  unchanged: "无变化",
};

// 格子回调用的口袋，列定义不用跟着勾选结果重建
type ImportTableMeta = {
  selectedFreshIds: string[];
  reviewPicks: Record<number, Partial<Record<ImportFieldKey, ImportFieldPick>>>;
  onToggleFresh: (herbId: string) => void;
  onPickField: (index: number, key: ImportFieldKey, side: ImportFieldPick) => void;
};

interface ImportCompareTableProps {
  parsed: ParsedHerbImport;
  selectedFreshIds: string[];
  reviewPicks: Record<number, Partial<Record<ImportFieldKey, ImportFieldPick>>>;
  onToggleFresh: (herbId: string) => void;
  onPickField: (index: number, key: ImportFieldKey, side: ImportFieldPick) => void;
}

// 把三堆药收成一张表：需对照在最上，新增其次，无变化垫底
function buildSheetRows(parsed: ParsedHerbImport): ImportSheetRow[] {
  const rows: ImportSheetRow[] = [];

  parsed.duplicates.forEach((item, index) => {
    rows.push(rowFromDuplicate(item, index));
  });

  for (const herb of parsed.fresh) {
    rows.push({
      id: herb.id,
      status: "fresh",
      name: herb.name,
      incoming: herb,
      diffs: [],
    });
  }

  for (const herb of parsed.unchanged) {
    rows.push({
      id: herb.id,
      status: "unchanged",
      name: herb.name,
      incoming: herb,
      existing: herb,
      diffs: [],
    });
  }

  return rows;
}

// 撞名的一行要记住原来的序号，写入时才知道勾的是哪一味
function rowFromDuplicate(item: ImportDuplicate, index: number): ImportSheetRow {
  return {
    id: item.existing.id,
    status: "duplicate",
    name: item.existing.name,
    incoming: item.incoming,
    existing: item.existing,
    diffs: item.diffs,
    duplicateIndex: index,
  };
}

// 整包对照表：筛选后只画窗口里的行，长名单也不会把页面撑死
export function ImportCompareTable({
  parsed,
  selectedFreshIds,
  reviewPicks,
  onToggleFresh,
  onPickField,
}: ImportCompareTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 手机装不下横表，改成一张张卡片；宽屏才摊开原来的大表
  const narrow = useNarrowScreen();

  // 记下筛的是哪一叠，像进货单上的分页签，默认看全部
  const [statusFilter, setStatusFilter] = useState<RowStatus | "all">("all");

  // 记下正在搜的药名，空着就不当成搜索
  const [query, setQuery] = useState("");

  const allRows = useMemo(() => buildSheetRows(parsed), [parsed]);

  // 先按状态筛，再按药名或拼音留，空搜索就整叠都在
  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return allRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return (
        row.name.toLowerCase().includes(needle) ||
        row.incoming.pinyin.toLowerCase().includes(needle)
      );
    });
  }, [allRows, query, statusFilter]);

  const columns = useMemo<LegacyColumnDef<ImportSheetRow>[]>(
    () => [
      {
        id: "check",
        header: "",
        cell: ({ row, table }) => (
          <RowCheck row={row.original} meta={table.options.meta as ImportTableMeta} />
        ),
      },
      {
        id: "name",
        header: "药名",
        cell: ({ row, table }) => (
          <NameCell row={row.original} meta={table.options.meta as ImportTableMeta} />
        ),
      },
      {
        id: "status",
        header: "状态",
        cell: ({ row }) => STATUS_LABEL[row.original.status],
      },
      ...SHEET_FIELDS.map(
        (field): LegacyColumnDef<ImportSheetRow> => ({
          id: field,
          header: IMPORT_FIELD_LABELS[field],
          cell: ({ row, table }) => (
            <FieldCell
              row={row.original}
              field={field}
              meta={table.options.meta as ImportTableMeta}
            />
          ),
        }),
      ),
    ],
    [],
  );

  const table = useLegacyTable({
    data: visibleRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: {
      selectedFreshIds,
      reviewPicks,
      onToggleFresh,
      onPickField,
    } satisfies ImportTableMeta,
  });

  const tableRows = table.getRowModel().rows;

  // 只准备窗口里看得到的行，下面没滚到的先不画，像只打开眼前这一页账
  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    // 卡片比表行高得多，先按这个估，真高度量完再校正，避免滚动条一下子跳很远
    estimateSize: () => (narrow ? 280 : 96),
    overscan: 8,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const counts: Record<RowStatus | "all", number> = {
    all: allRows.length,
    fresh: parsed.fresh.length,
    duplicate: parsed.duplicates.length,
    unchanged: parsed.unchanged.length,
  };

  return (
    <div className={compareTable.root()}>
      <p className="text-sm">
        药包「{parsed.packName}」共 {allRows.length} 味
        {parsed.invalid.length > 0 ? `，读不出 ${parsed.invalid.length} 味` : ""}。
      </p>

      {parsed.invalid.length > 0 ? (
        <p className="text-xs text-destructive">
          {parsed.invalid
            .slice(0, 8)
            .map((item) => `${item.name}（${item.reason}）`)
            .join("、")}
          {parsed.invalid.length > 8 ? " 等" : ""}
        </p>
      ) : null}

      <div className={compareTable.toolbar()}>
        <div className={compareTable.filters()}>
          {(Object.keys(STATUS_LABEL) as Array<RowStatus | "all">).map((status) => (
            <button
              key={status}
              type="button"
              className={compareTable.filter({ active: statusFilter === status })}
              onClick={() => setStatusFilter(status)}
            >
              {STATUS_LABEL[status]} {counts[status]}
            </button>
          ))}
        </div>

        <Input
          value={query}
          placeholder="搜药名"
          className={compareTable.search()}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div ref={scrollRef} className={compareTable.scroller()}>
        {/* 窄屏一张卡一味药；宽屏才铺那张要横滑的大表 */}
        {narrow ? (
          <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableRows[virtualRow.index];

              if (!row) {
                return null;
              }

              return (
                <div
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className={compareTable.card({ quiet: row.original.status === "unchanged" })}
                  style={{
                    position: "absolute",
                    top: virtualRow.start,
                    left: 0,
                    width: "100%",
                  }}
                >
                  <MobileImportCard row={row.original} meta={table.options.meta as ImportTableMeta} />
                </div>
              );
            })}
          </div>
        ) : (
        <div className="min-w-[78rem]">
          <div className={`${compareTable.track()} ${compareTable.head()}`}>
            {table.getHeaderGroups().flatMap((group) =>
              group.headers.map((header) => (
                <span
                  key={header.id}
                  className={
                    header.column.id === "name"
                      ? compareTable.nameCell()
                      : compareTable.cell()
                  }
                >
                  {String(header.column.columnDef.header)}
                </span>
              )),
            )}
          </div>

          <div
            className="relative"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableRows[virtualRow.index];

              if (!row) {
                return null;
              }

              return (
                <div
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className={`${compareTable.track()} ${compareTable.row({ quiet: row.original.status === "unchanged" })}`}
                  style={{
                    position: "absolute",
                    top: virtualRow.start,
                    left: 0,
                    width: "100%",
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const template = cell.column.columnDef.cell;

                    return (
                      <div
                        key={cell.id}
                        className={
                          cell.column.id === "name"
                            ? compareTable.nameCell({ clickable: row.original.status !== "unchanged" })
                            : `${compareTable.cell()} ${cell.column.id === "check" ? "flex items-start justify-center" : "min-w-0"}`
                        }
                        onClick={
                          cell.column.id === "name" && row.original.status !== "unchanged"
                            ? () => toggleSheetRow(row.original, table.options.meta as ImportTableMeta)
                            : undefined
                        }
                      >
                        {typeof template === "function" ? template(cell.getContext()) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

// 手机上的一味药：勾和名字在抬头，性味功效往下排，不用横着滑整张大表
function MobileImportCard({ row, meta }: { row: ImportSheetRow; meta: ImportTableMeta }) {
  return (
    <>
      <div className={compareTable.cardHead()}>
        <RowCheck row={row} meta={meta} />

        {/* 点药名就拨勾，和无变化的药点了也不动，免得误触 */}
        <div
          className={row.status === "unchanged" ? "min-w-0 flex-1" : "min-w-0 flex-1 cursor-pointer"}
          onClick={row.status !== "unchanged" ? () => toggleSheetRow(row, meta) : undefined}
        >
          <NameCell row={row} meta={meta} />
        </div>

        <span className={compareTable.cardStatus()}>{STATUS_LABEL[row.status]}</span>
      </div>

      {/* 性味、归经这些说明书往下排，一栏一个标题 */}
      <div className={compareTable.cardFields()}>
        {SHEET_FIELDS.map((field) => (
          <div key={field}>
            <p className={compareTable.fieldLabel()}>{IMPORT_FIELD_LABELS[field]}</p>

            <FieldCell row={row} field={field} meta={meta} />
          </div>
        ))}
      </div>
    </>
  );
}

// 药名格：点名字就拨最左边的勾。拼音若要对照，点那两张纸条不算拨勾
function NameCell({ row, meta }: { row: ImportSheetRow; meta: ImportTableMeta }) {
  const pinyinDiff = row.diffs.includes("pinyin") && row.existing && row.duplicateIndex !== undefined;
  return (
    <div className="min-w-0">
      <p className="truncate">{row.name}</p>

      {pinyinDiff ? (
        <div
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <FieldSides field="pinyin" row={row} meta={meta} />
        </div>
      ) : (
        <p className="mt-1 truncate text-xs text-muted-foreground">{row.incoming.pinyin}</p>
      )}
    </div>
  );
}

// 最左边的勾：新药决定写不写入；需对照则整行留本室或改用导入
function RowCheck({ row, meta }: { row: ImportSheetRow; meta: ImportTableMeta }) {
  const boxRef = useRef<HTMLInputElement>(null);
  const choice = rowChoice(row, meta);

  // 格子有的留本室、有的用导入时，勾画成半选，免得看起来像已经全定了
  useEffect(() => {
    if (!boxRef.current) {
      return;
    }

    boxRef.current.indeterminate = choice === "mixed";
  }, [choice]);

  if (row.status === "unchanged") {
    return null;
  }

  return (
    <input
      ref={boxRef}
      type="checkbox"
      className="mt-1 size-5 md:size-4"
      checked={choice === "on"}
      onChange={() => toggleSheetRow(row, meta)}
      aria-label={row.status === "fresh" ? `写入${row.name}` : `整行改用导入 ${row.name}`}
    />
  );
}

// 这一行的勾现在是全选、不选，还是两边都有
function rowChoice(row: ImportSheetRow, meta: ImportTableMeta): "on" | "off" | "mixed" {
  if (row.status === "fresh") {
    return meta.selectedFreshIds.includes(row.id) ? "on" : "off";
  }

  if (row.status !== "duplicate" || row.duplicateIndex === undefined) {
    return "off";
  }

  const picks = meta.reviewPicks[row.duplicateIndex] ?? {};
  const incomingCount = row.diffs.filter((key) => picks[key] === "incoming").length;

  if (incomingCount === 0) {
    return "off";
  }

  if (incomingCount === row.diffs.length) {
    return "on";
  }

  return "mixed";
}

// 点药名或最左边的勾：新药换写不写入，需对照则整行换边
function toggleSheetRow(row: ImportSheetRow, meta: ImportTableMeta) {
  if (row.status === "fresh") {
    meta.onToggleFresh(row.id);
    return;
  }

  if (row.status !== "duplicate" || row.duplicateIndex === undefined) {
    return;
  }

  const nextSide: ImportFieldPick = rowChoice(row, meta) === "on" ? "local" : "incoming";

  for (const key of row.diffs) {
    meta.onPickField(row.duplicateIndex, key, nextSide);
  }
}

// 普通栏目：有差异就叠两张纸条，没有就只显示一边的字
function FieldCell({
  row,
  field,
  meta,
}: {
  row: ImportSheetRow;
  field: SheetField;
  meta: ImportTableMeta;
}) {
  const differs = row.diffs.includes(field) && row.existing && row.duplicateIndex !== undefined;

  if (differs) {
    return <FieldSides field={field} row={row} meta={meta} />;
  }

  const shown = row.status === "duplicate" && row.existing ? row.existing : row.incoming;

  return <p className="text-xs leading-relaxed break-words">{getImportFieldValue(shown, field) || "（空）"}</p>;
}

// 同一栏的本室和导入叠在一起，点中的那张才算数
function FieldSides({
  row,
  field,
  meta,
}: {
  row: ImportSheetRow;
  field: ImportFieldKey;
  meta: ImportTableMeta;
}) {
  const index = row.duplicateIndex ?? 0;
  const existing = row.existing;
  const selected = meta.reviewPicks[index]?.[field] ?? "local";

  if (!existing) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={compareTable.side({ selected: selected === "local" })}
        onClick={() => meta.onPickField(index, field, "local")}
      >
        本室 {getImportFieldValue(existing, field) || "（空）"}
      </button>

      <button
        type="button"
        className={compareTable.side({ selected: selected === "incoming" })}
        onClick={() => meta.onPickField(index, field, "incoming")}
      >
        导入 {getImportFieldValue(row.incoming, field) || "（空）"}
      </button>
    </div>
  );
}
