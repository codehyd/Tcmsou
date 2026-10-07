import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Navigate, useParams } from "react-router";

import type { Herb } from "@/types/herb";
import type { FormulaProcessId, FormulaSheet, FormulaStandardId } from "@/types/formula";

import { CollectionHeader } from "@/rooms/collection/components/CollectionHeader";
import { CollectionNavRail } from "@/rooms/collection/components/CollectionNavRail";
import { FormulaLinePreview, FormulaSortableRow } from "@/rooms/formula/components/FormulaSortableRow";
import { HerbNamePicker } from "@/rooms/formula/components/HerbNamePicker";
import { alignFormulaLineName } from "@/lib/herb-identity";
import { isFormulaReady, lineFromHerb } from "@/lib/formula";
import { countAllHerbs } from "@/lib/herb-catalog";
import { useCabinetHerbs } from "@/store/herb-cabinet";
import { useFormulaStore } from "@/store/formula";

import { formulaPage, formulaTable } from "./styles";

// 打开一张拟方，在同一张上改剂数、用法和每一味药
export function FormulaEditorPage() {
  const { formulaId } = useParams();
  const herbs = useCabinetHerbs();
  const herbCount = countAllHerbs(herbs);
  const sheet = useFormulaStore((state) => state.sheets.find((item) => item.id === formulaId));
  const updateSheet = useFormulaStore((state) => state.updateSheet);
  const deleteSheet = useFormulaStore((state) => state.deleteSheet);
  const doseRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 正在被拖起来的那一行。松手或取消后清空
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // 稍微挪开才算拖，避免点一下把手就换行
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // 药名里夹着的炮制和来源拆到对应栏。柜里的药一变就再对一次
  useEffect(() => {
    if (!sheet) {
      return;
    }

    const knownNames = new Set(herbs.map((herb) => herb.name));
    const lines = sheet.lines.map((line) => alignFormulaLineName(line, knownNames));
    const changed = lines.some((line, index) => line !== sheet.lines[index]);

    if (!changed) {
      return;
    }

    updateSheet(sheet.id, (current) => ({
      ...current,
      lines: current.lines.map((line) => alignFormulaLineName(line, knownNames)),
    }));
  }, [herbs, sheet, updateSheet]);

  if (!sheet) {
    return <Navigate to="/formulas" replace />;
  }

  // 找到之后固定用这一张。后面的函数不能再拿可能为空的查找结果
  const current = sheet;

  // 改这张方时调用。用方的编号去改最新内容，不拿页面上可能过时的整张去覆盖
  function commit(change: (sheet: FormulaSheet) => FormulaSheet) {
    updateSheet(current.id, change);
  }

  // 同一味药、炮制和来源都空着的那一行还在，就回到它。否则再开一行，方便生和炙各写一行
  function handlePick(herb: Herb) {
    const existing = current.lines.find(
      (line) => line.herbId === herb.id && !line.process && !line.source,
    );

    if (existing) {
      // 等选药列表收起后再聚焦，避免列表被拆掉时把焦点带走
      window.setTimeout(() => {
        doseRefs.current[existing.lineId]?.focus();
      }, 0);

      return;
    }

    const nextLine = lineFromHerb(herb);

    commit((sheet) => {
      if (sheet.lines.some((line) => line.herbId === herb.id && !line.process && !line.source)) {
        return sheet;
      }

      return {
        ...sheet,
        lines: [...sheet.lines, nextLine],
      };
    });

    window.setTimeout(() => {
      doseRefs.current[nextLine.lineId]?.focus();
    }, 0);
  }

  // 按下把手时调用。记下被抽起来的那一行
  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id));
  }

  // 松手时调用。按放下的位置重排，剂量和脚注跟着这一行走
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setDraggingId(null);

    if (!over || active.id === over.id) {
      return;
    }

    commit((sheet) => {
      const from = sheet.lines.findIndex((line) => line.lineId === active.id);
      const to = sheet.lines.findIndex((line) => line.lineId === over.id);

      if (from < 0 || to < 0) {
        return sheet;
      }

      return { ...sheet, lines: arrayMove(sheet.lines, from, to) };
    });
  }

  const draggingLine = current.lines.find((line) => line.lineId === draggingId) ?? null;

  return (
    <div className={formulaPage.page()}>
      <CollectionHeader title="拟方" herbCount={herbCount} backTo="/formulas" />

      <div className={formulaPage.stage()}>
        <CollectionNavRail />

        <div className={formulaPage.main()}>
          <div className={formulaPage.toolbar()}>
            <label className={formulaPage.field()}>
              共几剂
              <input
                inputMode="numeric"
                value={current.doseCount}
                placeholder="7"
                className={formulaPage.input()}
                onChange={(event) =>
                  commit((sheet) => ({ ...sheet, doseCount: event.target.value }))
                }
              />
            </label>

            <label className={formulaPage.field()}>
              用法
              <input
                value={current.usage}
                placeholder="水煎服，日一剂"
                className={formulaPage.input()}
                onChange={(event) => commit((sheet) => ({ ...sheet, usage: event.target.value }))}
              />
            </label>

            <p className={formulaPage.status()}>{isFormulaReady(current) ? "已拟" : "草稿"}</p>
          </div>

          <div className={formulaPage.body()}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setDraggingId(null)}
            >
              <div className={formulaPage.tableScroll()}>
                <table className={formulaTable.table()}>
                  <thead>
                    <tr className={formulaTable.head()}>
                      <th className={formulaTable.cell()}>药名</th>
                      <th className={formulaTable.cell()}>剂量</th>
                      <th className={formulaTable.cell()}>脚注</th>
                      <th className={formulaTable.cell()}>标准</th>
                      <th className={formulaTable.cell()}>炮制</th>
                      <th className={formulaTable.cell()}>来源</th>
                      <th className={formulaTable.cell()}>操作</th>
                    </tr>
                  </thead>

                  <tbody>
                    <SortableContext
                      items={current.lines.map((line) => line.lineId)}
                      strategy={verticalListSortingStrategy}
                    >
                      {current.lines.map((line) => (
                        <FormulaSortableRow
                          key={line.lineId}
                          line={line}
                          sources={herbs.find((herb) => herb.id === line.herbId)?.sources ?? []}
                          doseRef={(node) => {
                            doseRefs.current[line.lineId] = node;
                          }}
                          onDoseChange={(dose) =>
                            commit((sheet) => ({
                              ...sheet,
                              lines: sheet.lines.map((item) =>
                                item.lineId === line.lineId ? { ...item, dose } : item,
                              ),
                            }))
                          }
                          onStandardChange={(standard: FormulaStandardId) =>
                            commit((sheet) => ({
                              ...sheet,
                              lines: sheet.lines.map((item) =>
                                item.lineId === line.lineId ? { ...item, standard } : item,
                              ),
                            }))
                          }
                          onProcessChange={(process: FormulaProcessId) =>
                            commit((sheet) => ({
                              ...sheet,
                              lines: sheet.lines.map((item) =>
                                item.lineId === line.lineId ? { ...item, process } : item,
                              ),
                            }))
                          }
                          onSourceChange={(source) =>
                            commit((sheet) => ({
                              ...sheet,
                              lines: sheet.lines.map((item) =>
                                item.lineId === line.lineId ? { ...item, source } : item,
                              ),
                            }))
                          }
                          onFootnoteChange={(footnote) =>
                            commit((sheet) => ({
                              ...sheet,
                              lines: sheet.lines.map((item) =>
                                item.lineId === line.lineId ? { ...item, footnote } : item,
                              ),
                            }))
                          }
                          onDelete={() =>
                            commit((sheet) => ({
                              ...sheet,
                              lines: sheet.lines.filter((item) => item.lineId !== line.lineId),
                            }))
                          }
                        />
                      ))}
                    </SortableContext>

                    <tr>
                      <td className={formulaTable.cell()} colSpan={7}>
                        <HerbNamePicker
                          herbs={herbs}
                          takenHerbIds={current.lines.map((line) => line.herbId)}
                          onPick={handlePick}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 抽出的那一行画在表格外面，跟着指针走 */}
              <DragOverlay>
                {draggingLine ? <FormulaLinePreview line={draggingLine} /> : null}
              </DragOverlay>
            </DndContext>

            <div className={formulaPage.actions()}>
              <button
                type="button"
                className={formulaTable.iconButton()}
                onClick={() => {
                  deleteSheet(current.id);
                }}
              >
                删除这张拟方
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
