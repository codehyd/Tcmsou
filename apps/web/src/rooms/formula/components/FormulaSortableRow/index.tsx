import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical } from "lucide-react";

import {
  FORMULA_FOOTNOTES,
  FORMULA_PROCESSES,
  FORMULA_STANDARDS,
  type FormulaFootnoteId,
  type FormulaLine,
  type FormulaProcessId,
  type FormulaStandardId,
} from "@/types/formula";

import { formulaTable } from "@/pages/formula/styles";

// 表格里的一行。把手交给排序库，拖的时候原位变淡，抽出的那份在外面画
interface FormulaSortableRowProps {
  line: FormulaLine;
  sources: string[];
  onDoseChange: (dose: string) => void;
  onStandardChange: (standard: FormulaStandardId) => void;
  onProcessChange: (process: FormulaProcessId) => void;
  onSourceChange: (source: string) => void;
  onFootnoteChange: (footnote: FormulaFootnoteId) => void;
  onDelete: () => void;
  doseRef: (node: HTMLInputElement | null) => void;
}

export function FormulaSortableRow({
  line,
  sources,
  onDoseChange,
  onStandardChange,
  onProcessChange,
  onSourceChange,
  onFootnoteChange,
  onDelete,
  doseRef,
}: FormulaSortableRowProps) {
  // 这一行在排序里的位置。把手单独作为拖拽起点，剂量和脚注仍可点
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: line.lineId });

  // 这一行可选的来源。当前值不在清单里时也留着，避免已选的名字从下拉里消失
  const sourceOptions =
    line.source && !sources.includes(line.source) ? [line.source, ...sources] : sources;

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
      <td className={formulaTable.cell()}>
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
          <span className={formulaTable.name()}>{line.name}</span>
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
        <div className={formulaTable.selectWrap()}>
          <select
            value={line.footnote}
            className={formulaTable.select()}
            onChange={(event) => onFootnoteChange(event.target.value as FormulaFootnoteId)}
          >
            {FORMULA_FOOTNOTES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown className={formulaTable.selectIcon()} />
        </div>
      </td>

      <td className={formulaTable.cell()}>
        <div className={formulaTable.selectWrap()}>
          <select
            value={line.standard ?? ""}
            className={formulaTable.select()}
            onChange={(event) => onStandardChange(event.target.value as FormulaStandardId)}
          >
            <option value="">空</option>
            {FORMULA_STANDARDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown className={formulaTable.selectIcon()} />
        </div>
      </td>

      <td className={formulaTable.cell()}>
        <div className={formulaTable.selectWrap()}>
          <select
            value={line.process ?? ""}
            className={formulaTable.select()}
            onChange={(event) => onProcessChange(event.target.value as FormulaProcessId)}
          >
            <option value="">空</option>
            {FORMULA_PROCESSES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown className={formulaTable.selectIcon()} />
        </div>
      </td>

      <td className={formulaTable.cell()}>
        <div className={formulaTable.selectWrap()}>
          <select
            value={line.source ?? ""}
            className={formulaTable.sourceSelect()}
            onChange={(event) => onSourceChange(event.target.value)}
          >
            <option value="">空</option>
            {sourceOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown className={formulaTable.selectIcon()} />
        </div>
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
  const source = line.source.trim();

  return (
    <div className={formulaTable.overlay()}>
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      <span className={formulaTable.name()}>{line.name}</span>
      {line.dose ? (
        <span className="text-muted-foreground">
          {line.dose} {line.unit}
        </span>
      ) : null}
      {footnote ? <span>{footnote}</span> : null}
      {standard ? <span>{standard}</span> : null}
      {process ? <span>{process}</span> : null}
      {source ? <span>{source}</span> : null}
    </div>
  );
}
