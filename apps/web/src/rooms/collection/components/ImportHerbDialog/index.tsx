import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { FileUp } from "lucide-react";

import { OPEN_HERB_SOURCES, type OpenHerbSource } from "@/data/public-herb-packs";
import {
  dropZone,
  fieldChoice,
  importDialog,
  packShelf,
  packShelfButton,
  packShelfHeader,
  packShelfList,
  packShelfRow,
  pickStep,
} from "./styles";
import { Button } from "@/components/ui/button";
import {
  getImportFieldValue,
  IMPORT_FIELD_LABELS,
  mergeHerbByPicks,
  parseHerbImportFile,
  picksForSide,
  type ImportDuplicate,
  type ParsedHerbImport,
} from "@/lib/herb-import";
import { useHerbCabinetStore } from "@/store/herb-cabinet";
import type { Herb, ImportFieldKey, ImportFieldPick } from "@/types/herb";

interface ImportHerbDialogProps {
  open: boolean;
  herbs: Herb[];
  onClose: () => void;
}

type ImportStep = "pick" | "preview" | "review";

// 收藏室的导入窗：左下角点开源药库就直接下载并导入，自己的文件也能拖进来；撞名的要对照后才入柜
export function ImportHerbDialog({ open, herbs, onClose }: ImportHerbDialogProps) {
  const applyHerbImport = useHerbCabinetStore((state) => state.applyHerbImport);

  const [step, setStep] = useState<ImportStep>("pick");
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParsedHerbImport | null>(null);
  const [selectedFreshIds, setSelectedFreshIds] = useState<string[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewPicks, setReviewPicks] = useState<
    Record<number, Partial<Record<ImportFieldKey, ImportFieldPick>>>
  >({});

  // 记下文件是不是正悬在投放区上，用来换描边，像货箱挨着卸货口
  const [dragging, setDragging] = useState(false);

  // 左下角开源药库开没开，像拉开供货名录才看见能直接进的表
  const [catalogOpen, setCatalogOpen] = useState(false);

  // 正在下载哪一条，避免连点两下把同一张表领两遍
  const [loadingSourceId, setLoadingSourceId] = useState<string | null>(null);

  // 开着窗才听 Esc，关上就别误伤列表页
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      // 清单开着就先收抽屉，别一下把整扇导入窗也关上
      if (catalogOpen) {
        setCatalogOpen(false);
        return;
      }

      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, catalogOpen]);

  // 门一关就把桌上的纸擦掉，下次开门是空白手续
  useEffect(() => {
    if (open) {
      return;
    }

    setStep("pick");
    setError("");
    setParsed(null);
    setSelectedFreshIds([]);
    setReviewIndex(0);
    setReviewPicks({});
    setDragging(false);
    setCatalogOpen(false);
    setLoadingSourceId(null);
  }, [open]);

  // 窗开着时拦住整页的拖放，免得文件落到投放区外被浏览器当成打开新页
  useEffect(() => {
    if (!open) {
      return;
    }

    function preventWindowDrop(event: Event) {
      // 整页都先说「我接着」，文件才不会落到地址栏变成打开网页
      event.preventDefault();
    }

    window.addEventListener("dragover", preventWindowDrop);
    window.addEventListener("drop", preventWindowDrop);

    return () => {
      window.removeEventListener("dragover", preventWindowDrop);
      window.removeEventListener("drop", preventWindowDrop);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  // 读选中或拖进来的 JSON / Excel：拆出新药和撞名，格式不对就把原因写在门口
  async function importFile(file: File) {
    try {
      // 把这份表交给拆包员，成功就摊开预览桌
      const packed = await parseHerbImportFile(file, herbs);

      // 新药默认全勾，对照从第一味开始，投放灯先关掉
      setParsed(packed);
      setSelectedFreshIds(packed.fresh.map((herb) => herb.id));
      setReviewIndex(0);
      setReviewPicks({});
      setError("");
      setDragging(false);
      setStep("preview");
    } catch (caught) {
      // 拆不开就把原因贴回选文件那一页，别让人走进空预览
      const message = caught instanceof Error ? caught.message : "这份文件读不出来";

      setError(message);
      setParsed(null);
      setDragging(false);
      setStep("pick");
    }
  }

  // 点选文件：把第一份递去拆包，再把输入框清空方便下次再选同一份
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    // 先抓住选框，拆完包还要把它清空，不然同一份点第二次没反应
    const picker: HTMLInputElement = event.target;

    // 没选到文件就当路过，别空拆一包
    const file = picker.files?.[0];

    if (!file) {
      return;
    }

    await importFile(file);

    // 清空选框，下次还能再点同一份
    picker.value = "";
  }

  // 拖进投放区时允许放下，并点亮边框提醒可以松手
  function handleDragOver(event: DragEvent<HTMLElement>) {
    // 先拦住默认行为，否则浏览器会把文件当成新标签页打开
    event.preventDefault();

    // 告诉浏览器这是复印进来，不是把原文件从桌面搬走
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }

    // 点亮投放台描边，提醒可以松手
    setDragging(true);
  }

  // 拖出投放区才熄灯，在子元素之间移动不算离开
  function handleDragLeave(event: DragEvent<HTMLElement>) {
    // 看鼠标接下来进了谁，用来判断是不是还在投放台里
    const next = event.relatedTarget;

    // 还在投放台内部挪位置，别把灯关掉
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }

    setDragging(false);
  }

  // 松开鼠标就把拖来的第一份文件当选中的表
  async function handleDrop(event: DragEvent<HTMLElement>) {
    // 拦住浏览器抢文件，同时把投放台灯熄掉
    event.preventDefault();
    setDragging(false);

    // 只取拖进来的第一份，一次拆一张表
    const file = event.dataTransfer?.files[0];

    // 没拖进文件就当路过
    if (!file) {
      return;
    }

    await importFile(file);
  }

  // 点开源药库的一行：替人把表下载下来，马上拆进预览，不用先存到桌面再拖
  async function importOpenSource(source: OpenHerbSource) {
    // 同一条还在下载时别再领一次，像货单还没到就不要重复打电话
    if (loadingSourceId) {
      return;
    }

    setLoadingSourceId(source.id);
    setError("");

    try {
      // 向开发服务要这份表，它再去开源站取，浏览器自己跨站会被拦住
      const response = await fetch(encodeURI(source.href));

      if (!response.ok) {
        throw new Error("这份开源表没下下来");
      }

      // 下到的内容装成一份文件，后面的拆包流程和拖进来的表走同一条路
      const blob = await response.blob();
      const file = new File([blob], source.filename);

      setCatalogOpen(false);
      await importFile(file);
    } catch (caught) {
      // 没领到就停在选文件这页，把原因写出来，别走进空预览
      const message = caught instanceof Error ? caught.message : "这份开源表没下下来";

      setError(message);
      setStep("pick");
    } finally {
      setLoadingSourceId(null);
    }
  }

  // 新药清单上勾或不勾，像进货单勾选要上架的货
  function toggleFresh(herbId: string) {
    setSelectedFreshIds((current) => {
      if (current.includes(herbId)) {
        return current.filter((id) => id !== herbId);
      }

      return [...current, herbId];
    });
  }

  // 当前这味药所有差异栏勾同一边，省得一栏栏点
  function setCurrentPicks(side: ImportFieldPick) {
    if (!parsed) {
      return;
    }

    const diffs = parsed.duplicates[reviewIndex]?.diffs ?? [];

    setReviewPicks((current) => ({
      ...current,
      [reviewIndex]: picksForSide(diffs, side),
    }));
  }

  // 只改一栏：性味用本室、功效用药包，像左右说明书各撕半页
  function pickField(key: ImportFieldKey, side: ImportFieldPick) {
    setReviewPicks((current) => ({
      ...current,
      [reviewIndex]: {
        ...current[reviewIndex],
        [key]: side,
      },
    }));
  }

  // 从当前这味起，后面重复的全用同一边，避免十几味逐个点完
  function fillRemaining(side: ImportFieldPick) {
    if (!parsed) {
      return;
    }

    setReviewPicks((current) => {
      const next = { ...current };

      parsed.duplicates.forEach((item, index) => {
        if (index < reviewIndex) {
          return;
        }

        next[index] = picksForSide(item.diffs, side);
      });

      return next;
    });
  }

  // 勾完的新药入活页，对照完的教材盖修订；没勾的栏目默认留本室
  function commitImport() {
    if (!parsed) {
      return;
    }

    const extras = parsed.fresh.filter((herb) => selectedFreshIds.includes(herb.id));
    const overrides: Herb[] = [];

    parsed.duplicates.forEach((item, index) => {
      const merged = mergeHerbByPicks(
        item.existing,
        item.incoming,
        reviewPicks[index] ?? {},
      );

      if (item.existing.origin === "builtin") {
        overrides.push(merged);
      } else {
        extras.push(merged);
      }
    });

    applyHerbImport({ extras, overrides });
    onClose();
  }

  const duplicate = parsed?.duplicates[reviewIndex];
  const currentPicks = reviewPicks[reviewIndex] ?? {};

  return (
    <div className={importDialog.backdrop()}>
      <button
        type="button"
        aria-label="关闭导入"
        className={importDialog.scrim()}
        onClick={onClose}
      />

      <div className={importDialog.sheet()}>
        <div className={importDialog.header()}>
          <h2 className={importDialog.title()}>导入</h2>

          <p className={importDialog.hint()}>
            默认货架不动。左下角点开源药库可直接导入；自己的 JSON 或 Excel 也能拖进来。药名重复的要对照后才写入。
          </p>
        </div>

        <div className={importDialog.body()}>
          {step === "pick" ? (
            <PickStep
              error={error}
              dragging={dragging}
              onFileChange={handleFileChange}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ) : null}

          {step === "preview" && parsed ? (
            <PreviewStep
              parsed={parsed}
              selectedFreshIds={selectedFreshIds}
              onToggleFresh={toggleFresh}
              onSelectAllFresh={() =>
                setSelectedFreshIds(parsed.fresh.map((herb) => herb.id))
              }
              onClearFresh={() => setSelectedFreshIds([])}
            />
          ) : null}

          {step === "review" && parsed && duplicate ? (
            <ReviewStep
              parsed={parsed}
              duplicate={duplicate}
              reviewIndex={reviewIndex}
              picks={currentPicks}
              onPickField={pickField}
              onPickAll={setCurrentPicks}
            />
          ) : null}
        </div>

        <div className={importDialog.footer()}>
          {catalogOpen ? (
            <PackShelf
              loadingSourceId={loadingSourceId}
              onClose={() => setCatalogOpen(false)}
              onImport={(source) => {
                void importOpenSource(source);
              }}
            />
          ) : null}

          {/* 开源药库单独放左下角，点开才列出能直接下载并导入的表 */}
          <button
            type="button"
            className={packShelfButton()}
            aria-expanded={catalogOpen}
            onClick={() => setCatalogOpen((openShelf) => !openShelf)}
          >
            开源药库
          </button>

          <div className={importDialog.footerActions()}>
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>

          {step === "preview" && parsed && parsed.duplicates.length > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep("review")}>
              去对照重复（{parsed.duplicates.length}）
            </Button>
          ) : null}

          {step === "preview" && parsed && parsed.duplicates.length === 0 ? (
            <Button
              type="button"
              onClick={commitImport}
              disabled={parsed.fresh.length > 0 && selectedFreshIds.length === 0}
            >
              写入展柜
            </Button>
          ) : null}

          {step === "review" && parsed ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => fillRemaining("local")}
              >
                其余留本室
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => fillRemaining("incoming")}
              >
                其余用导入
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={reviewIndex === 0}
                onClick={() => setReviewIndex((index) => Math.max(0, index - 1))}
              >
                上一味
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={reviewIndex >= parsed.duplicates.length - 1}
                onClick={() =>
                  setReviewIndex((index) =>
                    Math.min(parsed.duplicates.length - 1, index + 1),
                  )
                }
              >
                下一味
              </Button>

              <Button type="button" onClick={commitImport}>
                写入展柜
              </Button>
            </>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// 左下角拉出的开源药库：列出能直接下载并导入的药材表
function PackShelf({
  loadingSourceId,
  onClose,
  onImport,
}: {
  loadingSourceId: string | null;
  onClose: () => void;
  onImport: (source: OpenHerbSource) => void;
}) {
  return (
    <div className={packShelf()}>
      <div className={packShelfHeader()}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-foreground">开源药库</p>

          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={onClose}>
            收起
          </button>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          点一条就下载并导入。和本室重名的会进对照。
        </p>
      </div>

      <ul className={packShelfList()}>
        {OPEN_HERB_SOURCES.map((source) => (
          <li key={source.id} className="border-b border-white/8 last:border-b-0">
            {/* 整行都是按钮，点下去就领这张表，不用再另存再拖 */}
            <button
              type="button"
              className={packShelfRow()}
              disabled={loadingSourceId !== null}
              onClick={() => onImport(source)}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{source.name}</p>

                <p className="truncate text-xs text-muted-foreground">{source.detail}</p>
              </div>

              <span className="shrink-0 text-xs text-intel">
                {loadingSourceId === source.id ? "正在下载" : "导入"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 第一步：大块地方用来拖文件或点选，领表在窗的左下角
function PickStep({
  error,
  dragging,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  error: string;
  dragging: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <div className={pickStep()}>
      {/* 投放台占满窗口，拖文件进来或点一下开选单 */}
      <label
        data-drop-zone
        aria-label="投放区：拖入或点击选择导入文件"
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={dropZone({ active: dragging })}
      >
        <FileUp className="size-10 shrink-0" aria-hidden />

        <span className="text-base text-foreground">
          {dragging ? "松开即可导入" : "把文件拖到这里"}
        </span>

        <span className="text-xs">JSON 或 SMHB Excel，也可点击选择</span>

        {/* 真选文件的暗门，点投放台会走到这里，拖放则不经过它免得抢事件 */}
        <input
          type="file"
          accept=".json,application/json,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={onFileChange}
          className="pointer-events-none sr-only"
        />
      </label>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

// 拆包预览：新药可勾选，撞名的要去下一页对照，废票把原因列出来
function PreviewStep({
  parsed,
  selectedFreshIds,
  onToggleFresh,
  onSelectAllFresh,
  onClearFresh,
}: {
  parsed: ParsedHerbImport;
  selectedFreshIds: string[];
  onToggleFresh: (id: string) => void;
  onSelectAllFresh: () => void;
  onClearFresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        药包「{parsed.packName}」：新增 {parsed.fresh.length} 味，需对照{" "}
        {parsed.duplicates.length} 味
        {parsed.invalid.length > 0 ? `，读不出 ${parsed.invalid.length} 味` : ""}。
      </p>

      {parsed.invalid.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground">读不出的条目</p>

          <ul className="mt-1 space-y-1 text-sm text-destructive">
            {parsed.invalid.map((item) => (
              <li key={`${item.name}-${item.reason}`}>
                {item.name}：{item.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsed.fresh.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">新药（勾选后写入）</p>

            <button
              type="button"
              className="text-xs text-intel hover:underline"
              onClick={() => {
                if (selectedFreshIds.length === parsed.fresh.length) {
                  onClearFresh();
                  return;
                }

                onSelectAllFresh();
              }}
            >
              {selectedFreshIds.length === parsed.fresh.length ? "取消全选" : "全选新增"}
            </button>
          </div>

          <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
            {parsed.fresh.map((herb) => (
              <li key={herb.id}>
                <label className="flex min-w-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedFreshIds.includes(herb.id)}
                    onChange={() => onToggleFresh(herb.id)}
                  />

                  <span className="truncate">{herb.name}</span>

                  <span className="truncate text-xs text-muted-foreground">
                    {getImportFieldValue(herb, "class")}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsed.duplicates.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          与本室药名相同 {parsed.duplicates.length} 味，请点「去对照重复」。
        </p>
      ) : null}

      {parsed.fresh.length === 0 && parsed.duplicates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          没有新药，也没有需要对照的差异。
        </p>
      ) : null}
    </div>
  );
}

// 左右对照一栏栏勾：左边本室，右边药包，点亮的那张才写进柜
function ReviewStep({
  parsed,
  duplicate,
  reviewIndex,
  picks,
  onPickField,
  onPickAll,
}: {
  parsed: ParsedHerbImport;
  duplicate: ImportDuplicate;
  reviewIndex: number;
  picks: Partial<Record<ImportFieldKey, ImportFieldPick>>;
  onPickField: (key: ImportFieldKey, side: ImportFieldPick) => void;
  onPickAll: (side: ImportFieldPick) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          对照 {reviewIndex + 1}/{parsed.duplicates.length}：{duplicate.existing.name}
        </p>

        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onPickAll("local")}>
            本室全部
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPickAll("incoming")}
          >
            导入全部
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[5.5rem_1fr_1fr] gap-2 text-xs text-muted-foreground">
        <span>栏目</span>
        <span>本室</span>
        <span>药包</span>
      </div>

      {duplicate.diffs.map((key) => {
        const selected = picks[key] ?? "local";

        return (
          <div key={key} className="grid grid-cols-[5.5rem_1fr_1fr] gap-2">
            <p className="pt-2 text-xs text-muted-foreground">{IMPORT_FIELD_LABELS[key]}</p>

            <FieldChoice
              selected={selected === "local"}
              value={getImportFieldValue(duplicate.existing, key)}
              onClick={() => onPickField(key, "local")}
            />

            <FieldChoice
              selected={selected === "incoming"}
              value={getImportFieldValue(duplicate.incoming, key)}
              onClick={() => onPickField(key, "incoming")}
            />
          </div>
        );
      })}
    </div>
  );
}

// 对照表上的一格说明书，点它等于选用这一边的字
function FieldChoice({
  value,
  selected,
  onClick,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={fieldChoice({ selected })}
    >
      {value || "（空）"}
    </button>
  );
}
