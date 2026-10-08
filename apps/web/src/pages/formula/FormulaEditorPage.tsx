import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Navigate, useParams } from "react-router";

import type { Herb, HerbChild } from "@/types/herb";
import type { FormulaLine, FormulaProcessId, FormulaSheet, FormulaStandardId } from "@/types/formula";

import { CollectionHeader } from "@/rooms/collection/components/CollectionHeader";
import { CollectionNavRail } from "@/rooms/collection/components/CollectionNavRail";
import { FormulaLinePreview, FormulaSortableRow } from "@/rooms/formula/components/FormulaSortableRow";
import { HerbNamePicker } from "@/rooms/formula/components/HerbNamePicker";
import { alignFormulaLineName } from "@/lib/herb-identity";
import { applyHerbPickToLine, isFormulaReady, lineFromHerb } from "@/lib/formula";
import { countAllHerbs } from "@/lib/herb-catalog";
import { useCabinetHerbs } from "@/store/herb-cabinet";
import { useFormulaStore } from "@/store/formula";

import { formulaPage, formulaTable } from "./styles";

// 这味药已经在方里时，子项写到还空着的那一行。每一栏都填过，就改最后一行
function chooseHerbLine(lines: FormulaLine[], child?: HerbChild) {
  if (!child) {
    return lines.find((line) => !line.process && !line.source) ?? lines[lines.length - 1];
  }

  if (child.process && !child.source) {
    return lines.find((line) => !line.process) ?? lines[lines.length - 1];
  }

  if (child.source && !child.process) {
    return lines.find((line) => !line.source) ?? lines[lines.length - 1];
  }

  return lines[lines.length - 1];
}

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

  // 选本尊就只写药名。这味药已经在方里时，再选炙黄芪只改这一行的炮制，不另起一行
  function handlePick(herb: Herb, child?: HerbChild) {
    const sameHerb = current.lines.filter((line) => line.herbId === herb.id);

    // 方里还没有这味药，才新开一行
    if (sameHerb.length === 0) {
      const nextLine = lineFromHerb(herb, {
        process: child?.process ?? "",
        source: child?.source ?? "",
        lineKey: child?.id ?? "base",
      });

      commit((sheet) => {
        if (sheet.lines.some((line) => line.herbId === herb.id)) {
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

      return;
    }

    // 子项只补炮制或来源。没写的那一栏保持这一行原来的值
    const target = chooseHerbLine(sameHerb, child);
    const nextProcess = child?.process || target.process;
    const nextSource = child?.source || target.source;
    const already = sameHerb.find(
      (line) => line.process === nextProcess && line.source === nextSource,
    );

    // 再点本尊，或这一行已经是要选的炮制和来源，就回到它
    if (!child || already) {
      const focusLine = already ?? target;

      window.setTimeout(() => {
        doseRefs.current[focusLine.lineId]?.focus();
      }, 0);

      return;
    }

    commit((sheet) => ({
      ...sheet,
      lines: sheet.lines.map((line) =>
        line.lineId === target.lineId
          ? { ...line, process: nextProcess, source: nextSource }
          : line,
      ),
    }));

    window.setTimeout(() => {
      doseRefs.current[target.lineId]?.focus();
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
                  <colgroup>
                    <col className={formulaTable.colName()} />
                    <col className={formulaTable.colDose()} />
                    <col className={formulaTable.colSelect()} />
                    <col className={formulaTable.colSelect()} />
                    <col className={formulaTable.colSelect()} />
                    <col className={formulaTable.colAction()} />
                  </colgroup>
                  <thead>
                    <tr className={formulaTable.head()}>
                      <th className={formulaTable.cell()}>药名</th>
                      <th className={formulaTable.cell()}>剂量</th>
                      <th className={formulaTable.cell()}>脚注</th>
                      <th className={formulaTable.cell()}>标准</th>
                      <th className={formulaTable.cell()}>炮制</th>
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
                          herbs={herbs}
                          takenLines={current.lines.map((item) => ({
                            herbId: item.herbId,
                            process: item.process,
                            source: item.source,
                          }))}
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
                          onReplace={(herb, child) => {
                            commit((sheet) => ({
                              ...sheet,
                              lines: sheet.lines.map((item) =>
                                item.lineId === line.lineId ? applyHerbPickToLine(item, herb, child) : item,
                              ),
                            }));

                            window.setTimeout(() => {
                              doseRefs.current[line.lineId]?.focus();
                            }, 0);
                          }}
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
                      <td className={formulaTable.cell()} colSpan={6}>
                        <HerbNamePicker
                          herbs={herbs}
                          takenLines={current.lines.map((line) => ({
                            herbId: line.herbId,
                            process: line.process,
                            source: line.source,
                          }))}
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
