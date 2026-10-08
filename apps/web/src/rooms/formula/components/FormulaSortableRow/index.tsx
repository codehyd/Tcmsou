import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { CollectionSelect } from "@/rooms/collection/components/CollectionSelect";
import { HerbNamePicker } from "@/rooms/formula/components/HerbNamePicker";

import type { Herb, HerbChild } from "@/types/herb";
import {
  FORMULA_FOOTNOTES,
  FORMULA_PROCESSES,
  FORMULA_STANDARDS,
  type FormulaFootnoteId,
  type FormulaLine,
  type FormulaProcessId,
  type FormulaStandardId,
} from "@/types/formula";

import { formulaHerbName } from "@/lib/formula";

import { formulaTable } from "@/pages/formula/styles";

// 方子里已经占用的一行。选药框用来标出哪些药已经在这张方上
interface TakenLine {
  herbId: string;
  process: string;
  source: string;
}

// 标准和炮制可以空着。空不能用空字符串当选项值，下拉组件会把它当成没选
const UNSET = "__unset__";

// 拟方表格里的下拉。和收藏柜用同一套菜单，不走浏览器自带下拉
const formulaSelectTrigger =
  "h-8 w-full min-w-20 rounded-sm border-white/15 bg-background";

// 表格里的一行。把手交给排序库，拖的时候原位变淡，抽出的那份在外面画
interface FormulaSortableRowProps {
  line: FormulaLine;
  herbs: Herb[];
  takenLines: TakenLine[];
  onDoseChange: (dose: string) => void;
  onStandardChange: (standard: FormulaStandardId) => void;
  onProcessChange: (process: FormulaProcessId) => void;
  onReplace: (herb: Herb, child?: HerbChild) => void;
  onFootnoteChange: (footnote: FormulaFootnoteId) => void;
  onDelete: () => void;
  doseRef: (node: HTMLInputElement | null) => void;
}

export function FormulaSortableRow({
  line,
  herbs,
  takenLines,
  onDoseChange,
  onStandardChange,
  onProcessChange,
  onReplace,
  onFootnoteChange,
  onDelete,
  doseRef,
}: FormulaSortableRowProps) {
  // 点了药名之后只打开下拉。药名留在格子里，表格宽度不跟着变
  const [picking, setPicking] = useState(false);

  // 下拉贴着这个药名按钮，不另插一个会把列撑宽的输入框
  const nameAnchorRef = useRef<HTMLButtonElement>(null);

  // 这一行在排序里的位置。把手单独作为拖拽起点，剂量和脚注仍可点
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: line.lineId });

  // 其他行让位时用。正在被拖的那行由抽出的浮层跟着指针，这里不再自己位移
  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isDragging ? formulaTable.rowDragging() : undefined}
    >
      <td className={formulaTable.nameCellTd()}>
        <div className={formulaTable.nameCell()}>
          <button
            type="button"
            aria-label="拖拽排序"
            className={formulaTable.dragHandle()}
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <button
            type="button"
            ref={nameAnchorRef}
            className={formulaTable.nameButton()}
            onMouseDown={(event) => {
              // 下拉还没开，这次按下交给后面的点击去打开
              if (!picking) {
                return;
              }

              // 下拉已经开着时，再按药名不要抢走焦点，否则列表会先收起再弹开
              event.preventDefault();
            }}
            onClick={() => setPicking(true)}
          >
            {formulaHerbName(line)}
          </button>
          {picking ? (
            <HerbNamePicker
              herbs={herbs}
              takenLines={takenLines}
              initialKeyword={line.name}
              autoFocus
              anchorRef={nameAnchorRef}
              onPick={(herb, child) => {
                onReplace(herb, child);
                setPicking(false);
              }}
              onDismiss={() => setPicking(false)}
            />
          ) : null}
        </div>
      </td>

      <td className={formulaTable.cell()}>
        <div className={formulaTable.doseRow()}>
          <input
            ref={doseRef}
            inputMode="decimal"
            value={line.dose}
            placeholder="每一剂"
            className={formulaTable.dose()}
            onChange={(event) => onDoseChange(event.target.value)}
          />
          <span className={formulaTable.unit()}>{line.unit}</span>
        </div>
      </td>

      <td className={formulaTable.cell()}>
        <CollectionSelect
          value={line.footnote}
          items={FORMULA_FOOTNOTES.map((item) => ({ label: item.label, value: item.id }))}
          align="start"
          triggerClassName={formulaSelectTrigger}
          onChange={(value) => onFootnoteChange(value as FormulaFootnoteId)}
        />
      </td>

      <td className={formulaTable.cell()}>
        <CollectionSelect
          value={line.standard || UNSET}
          items={[
            { label: "空", value: UNSET },
            ...FORMULA_STANDARDS.map((item) => ({ label: item.label, value: item.id })),
          ]}
          align="start"
          triggerClassName={formulaSelectTrigger}
          onChange={(value) => onStandardChange(value === UNSET ? "" : (value as FormulaStandardId))}
        />
      </td>

      <td className={formulaTable.cell()}>
        <CollectionSelect
          value={line.process || UNSET}
          items={[
            { label: "空", value: UNSET },
            ...FORMULA_PROCESSES.map((item) => ({ label: item.label, value: item.id })),
          ]}
          align="start"
          triggerClassName={formulaSelectTrigger}
          onChange={(value) => onProcessChange(value === UNSET ? "" : (value as FormulaProcessId))}
        />
      </td>

      <td className={formulaTable.cell()}>
        <button type="button" className={formulaTable.iconButton()} onClick={onDelete}>
          删除
        </button>
      </td>
    </tr>
  );
}

// 拖拽时浮在表格外的那一行。空着的剂量、脚注「无」、没选的标准和炮制都不写上去
export function FormulaLinePreview({ line }: { line: FormulaLine }) {
  // 脚注默认是无，无就不当成要展示的字
  const footnote =
    line.footnote === "none" ? "" : (FORMULA_FOOTNOTES.find((item) => item.id === line.footnote)?.label ?? "");

  // 标准和炮制没选时没有文案
  const standard = FORMULA_STANDARDS.find((item) => item.id === line.standard)?.label ?? "";
  const process = FORMULA_PROCESSES.find((item) => item.id === line.process)?.label ?? "";

  return (
    <div className={formulaTable.overlay()}>
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      <span className={formulaTable.name()}>{formulaHerbName(line)}</span>
      {line.dose ? (
        <span className="text-muted-foreground">
          {line.dose} {line.unit}
        </span>
      ) : null}
      {footnote ? <span>{footnote}</span> : null}
      {standard ? <span>{standard}</span> : null}
      {process ? <span>{process}</span> : null}
    </div>
  );
}
