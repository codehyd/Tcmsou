import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FileUp, LoaderCircle } from "lucide-react";

import { ImportCompareTable } from "@/rooms/collection/components/ImportCompareTable";
import { OPEN_HERB_SOURCES, type OpenHerbSource } from "@/data/public-herb-packs";
import { useNarrowScreen } from "@/lib/use-narrow-screen";
import {
  busyPanel,
  dropZone,
  importDialog,
  packShelf,
  packShelfButton,
  packShelfHeader,
  packShelfClose,
  packShelfList,
  packShelfAction,
  packShelfActions,
  packShelfRow,
  pickStep,
  settledPanel,
} from "./styles";
import { Button } from "@/components/ui/button";
import {
  mergeHerbByPicks,
  parseHerbImportFile,
  picksForSide,
  type ParsedHerbImport,
} from "@/lib/herb-import";
import { useHerbCabinetStore } from "@/store/herb-cabinet";
import type { Herb, ImportFieldKey, ImportFieldPick } from "@/types/herb";

interface ImportHerbDialogProps {
  open: boolean;
  herbs: Herb[];
  onClose: () => void;
}

type ImportStep = "pick" | "compare";

// 左下角正在领哪一份、领来干什么：只存盘，还是存完马上拆进预览
type OpenSourceJob = {
  id: string;
  mode: "download" | "import";
  phase: "download" | "read";
};

// 窗口正中挂的牌子：正在下载，还是已经下完、正在拆表
type ImportBusy = {
  phase: "download" | "read";
};

// 收藏室的导入窗：左下角点开源药库就直接下载并导入，自己的文件也能拖进来；撞名的要对照后才入柜
export function ImportHerbDialog({ open, herbs, onClose }: ImportHerbDialogProps) {
  const applyHerbImport = useHerbCabinetStore((state) => state.applyHerbImport);

  // 手机没有拖文件，说明改成点按，免得对着虚线框发愣
  const narrow = useNarrowScreen();

  const [step, setStep] = useState<ImportStep>("pick");
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParsedHerbImport | null>(null);
  const [selectedFreshIds, setSelectedFreshIds] = useState<string[]>([]);
  const [reviewPicks, setReviewPicks] = useState<
    Record<number, Partial<Record<ImportFieldKey, ImportFieldPick>>>
  >({});

  // 记下文件是不是正悬在投放区上，用来换描边，像货箱挨着卸货口
  const [dragging, setDragging] = useState(false);

  // 左下角开源药库开没开，像拉开供货名录才看见能直接进的表
  const [catalogOpen, setCatalogOpen] = useState(false);

  // 左下角正在领哪一份表，像货单还在路上就先别再打电话
  const [loadingJob, setLoadingJob] = useState<OpenSourceJob | null>(null);

  // 窗口正中的等待牌。下载和拆表都要亮着，免得投放台空着像死机
  const [busy, setBusy] = useState<ImportBusy | null>(null);

  // 这一单的号。关窗或新开一单就作废，迟到的结果别写回已经关上的柜台
  const requestRef = useRef(0);

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
    setReviewPicks({});
    setDragging(false);
    setCatalogOpen(false);
    setLoadingJob(null);
    setBusy(null);
    requestRef.current += 1;
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
  async function importFile(file: File, token = requestRef.current + 1) {
    requestRef.current = token;

    // 先挂上「正在拆开」，大表要算一会儿，别让投放台干等
    setBusy({ phase: "read" });
    setError("");

    try {
      // 把这份表交给拆包员，成功就摊开预览桌
      const packed = await parseHerbImportFile(file, herbs);

      if (token !== requestRef.current) {
        return;
      }

      // 新药默认全勾。撞名的格子先站到导入这边，不点的话写入和导出才会带上新说明书，而不是教材原文
      const incomingPicks: Record<number, Partial<Record<ImportFieldKey, ImportFieldPick>>> = {};

      packed.duplicates.forEach((item, index) => {
        incomingPicks[index] = picksForSide(item.diffs, "incoming");
      });

      setParsed(packed);
      setSelectedFreshIds(packed.fresh.map((herb) => herb.id));
      setReviewPicks(incomingPicks);
      setError("");
      setDragging(false);
      setStep("compare");
    } catch (caught) {
      if (token !== requestRef.current) {
        return;
      }

      // 拆不开就把原因贴回选文件那一页，别让人走进空预览
      const message = caught instanceof Error ? caught.message : "这份文件读不出来";

      setError(message);
      setParsed(null);
      setDragging(false);
      setStep("pick");
    } finally {
      if (token === requestRef.current) {
        setBusy(null);
      }
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

  // 向开发服务要这份开源表，浏览器自己跨站会被拦住
  async function fetchOpenSourceFile(source: OpenHerbSource) {
    const response = await fetch(encodeURI(source.href));

    if (!response.ok) {
      throw new Error("这份开源表没下下来");
    }

    const blob = await response.blob();

    return new File([blob], source.filename);
  }

  // 只把表存到电脑，不拆进本室，像先把货单复印带走
  async function downloadOpenSource(source: OpenHerbSource) {
    // 还在领别的表就先排队，避免两份文件抢同一个保存
    if (loadingJob) {
      return;
    }

    const token = requestRef.current + 1;

    requestRef.current = token;
    setLoadingJob({ id: source.id, mode: "download", phase: "download" });
    setBusy({ phase: "download" });
    setError("");

    try {
      const file = await fetchOpenSourceFile(source);

      if (token !== requestRef.current) {
        return;
      }

      // 用临时地址点一下保存，存完就丢掉，免得占着内存
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");

      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      if (token !== requestRef.current) {
        return;
      }

      const message = caught instanceof Error ? caught.message : "这份开源表没下下来";

      setError(message);
    } finally {
      if (token === requestRef.current) {
        setLoadingJob(null);
        setBusy(null);
      }
    }
  }

  // 点「下载并导入」：表领下来马上拆进预览，不用先存到桌面再拖
  async function importOpenSource(source: OpenHerbSource) {
    // 同一条还在下载时别再领一次，像货单还没到就不要重复打电话
    if (loadingJob) {
      return;
    }

    const token = requestRef.current + 1;

    requestRef.current = token;
    setLoadingJob({ id: source.id, mode: "import", phase: "download" });
    setBusy({ phase: "download" });
    setError("");

    try {
      const file = await fetchOpenSourceFile(source);

      if (token !== requestRef.current) {
        return;
      }

      setCatalogOpen(false);
      setLoadingJob({ id: source.id, mode: "import", phase: "read" });
      await importFile(file, token);
    } catch (caught) {
      if (token !== requestRef.current) {
        return;
      }

      // 没领到就停在选文件这页，把原因写出来，别走进空预览
      const message = caught instanceof Error ? caught.message : "这份开源表没下下来";

      setError(message);
      setStep("pick");
      setBusy(null);
    } finally {
      if (token === requestRef.current) {
        setLoadingJob(null);
      }
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

  // 只改一味药的一栏：点本室或导入，像左右两张纸条里留下一张
  function pickField(index: number, key: ImportFieldKey, side: ImportFieldPick) {
    setReviewPicks((current) => ({
      ...current,
      [index]: {
        ...current[index],
        [key]: side,
      },
    }));
  }

  // 所有要对照的药一次性站到同一边，省得一栏栏点
  function fillAll(side: ImportFieldPick) {
    if (!parsed) {
      return;
    }

    setReviewPicks(() => {
      const next: Record<number, Partial<Record<ImportFieldKey, ImportFieldPick>>> = {};

      parsed.duplicates.forEach((item, index) => {
        next[index] = picksForSide(item.diffs, side);
      });

      return next;
    });
  }

  // 勾上的新药入活页。撞名的格子若没改回本室，就用导入的字盖上去，导出才不会只剩教材原文
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

  // 有新药或要对照的才摊大表；整包都一样就换说明页，别给一个按不下去的写入
  const canReview =
    parsed !== null && (parsed.fresh.length > 0 || parsed.duplicates.length > 0);

  const showSettled = step === "compare" && parsed !== null && !canReview;

  const nothingToWrite =
    parsed !== null &&
    parsed.duplicates.length === 0 &&
    (parsed.fresh.length === 0 || selectedFreshIds.length === 0);

  // 窗头跟着眼前这一步说话：等着、已经在柜里、还是可以对照
  const hint = busy
    ? busy.phase === "download"
      ? "正在下载药表，下完会接着拆开。"
      : "正在拆开药表，味数多的话会停一会儿。"
    : showSettled
      ? "这份和展柜里已有的一样，不用再写入。"
      : step === "compare"
        ? "整包都在表里。新药默认勾上；字不一样的格子先用导入，点一下可以改回本室。"
        : narrow
          ? "点开源药库可直接导入，或点上方选择自己的 JSON / Excel。药名重复的要对照后才写入。"
          : "默认货架不动。左下角点开源药库可直接导入；自己的 JSON 或 Excel 也能拖进来。药名重复的要对照后才写入。";

  return (
    <div className={importDialog.backdrop()}>
      <button
        type="button"
        aria-label="关闭导入"
        className={importDialog.scrim()}
        onClick={onClose}
      />

      <div
        className={importDialog.sheet({ wide: step === "compare" && canReview })}
        aria-busy={busy !== null}
      >
        <div className={importDialog.header()}>
          <h2 className={importDialog.title()}>导入</h2>

          <p className={importDialog.hint()}>{hint}</p>
        </div>

        <div className={importDialog.body()}>
          {busy ? <BusyStep phase={busy.phase} /> : null}

          {!busy && step === "pick" ? (
            <PickStep
              error={error}
              dragging={dragging}
              onFileChange={handleFileChange}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ) : null}

          {!busy && showSettled && parsed ? <SettledPack parsed={parsed} /> : null}

          {!busy && step === "compare" && parsed && canReview ? (
            <ImportCompareTable
              parsed={parsed}
              selectedFreshIds={selectedFreshIds}
              reviewPicks={reviewPicks}
              onToggleFresh={toggleFresh}
              onPickField={pickField}
            />
          ) : null}
        </div>

        <div className={importDialog.footer()}>
          {catalogOpen ? (
            <PackShelf
              loadingJob={loadingJob}
              onClose={() => setCatalogOpen(false)}
              onDownload={(source) => {
                void downloadOpenSource(source);
              }}
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
            disabled={busy !== null}
            onClick={() => setCatalogOpen((openShelf) => !openShelf)}
          >
            开源药库
          </button>

          <Button
            type="button"
            variant="ghost"
            className={importDialog.cancelAction()}
            onClick={onClose}
          >
            取消
          </Button>

          {step === "compare" && parsed && canReview && !busy ? (
            <div className={importDialog.footerActions()}>
              {parsed.duplicates.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className={importDialog.footerAction({ span: "half" })}
                  onClick={() => fillAll("local")}
                >
                  其余留本室
                </Button>
              ) : null}

              {parsed.duplicates.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className={importDialog.footerAction({ span: "half" })}
                  onClick={() => fillAll("incoming")}
                >
                  其余用导入
                </Button>
              ) : null}

              <Button
                type="button"
                className={importDialog.footerAction({ span: "full" })}
                onClick={commitImport}
                disabled={nothingToWrite}
              >
                写入展柜
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// 钮上的字跟着这一步走：下表、拆表，空闲时回到原来的动作
function shelfActionLabel(
  rowBusy: boolean,
  job: OpenSourceJob | null,
  mode: "download" | "import",
) {
  if (!rowBusy || !job || job.mode !== mode) {
    return mode === "import" ? "下载并导入" : "下载";
  }

  if (job.phase === "read") {
    return "正在拆开";
  }

  return "正在下载";
}

// 窗口正中的等待：转圈加上这一步在干什么，大表下载和拆包不再像卡住
function BusyStep({ phase }: { phase: ImportBusy["phase"] }) {
  return (
    <div className={busyPanel()} role="status" aria-live="polite">
      <LoaderCircle className="size-8 animate-spin text-intel" aria-hidden />

      <p className="text-base text-foreground">
        {phase === "download" ? "正在下载药表" : "正在拆开药表"}
      </p>

      <p className="max-w-sm text-sm leading-relaxed">
        {phase === "download"
          ? "文件还在路上，下完会自动接着拆。"
          : "味数多的表要算一会儿，算完就会列出要不要写入。"}
      </p>
    </div>
  );
}

// 整包都和展柜一样：换成说明，不再铺一张按不了写入的大表
function SettledPack({ parsed }: { parsed: ParsedHerbImport }) {
  const sameCount = parsed.unchanged.length;
  const broken = parsed.invalid.slice(0, 8);

  return (
    <div className={settledPanel()}>
      <p className="text-base text-foreground">
        {sameCount > 0 ? "这包已经在展柜里" : "这份表没有能写入的药"}
      </p>

      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {sameCount > 0
          ? `「${parsed.packName}」共 ${sameCount} 味，和现在展柜里的字一样。`
          : `「${parsed.packName}」里没有新药，也没有和本室不一样的字。`}
      </p>

      {parsed.invalid.length > 0 ? (
        <p className="max-w-md text-xs text-destructive">
          另有 {parsed.invalid.length} 味读不出来：
          {broken.map((item) => `${item.name}（${item.reason}）`).join("、")}
          {parsed.invalid.length > broken.length ? " 等" : ""}
        </p>
      ) : null}
    </div>
  );
}

// 左下角拉出的名单：只列药表，每份旁边是「下载并导入」和「下载」
function PackShelf({
  loadingJob,
  onClose,
  onDownload,
  onImport,
}: {
  loadingJob: OpenSourceJob | null;
  onClose: () => void;
  onDownload: (source: OpenHerbSource) => void;
  onImport: (source: OpenHerbSource) => void;
}) {
  return (
    <div className={packShelf()}>
      <div className={packShelfHeader()}>
        <p>公开药表</p>

        <button type="button" className={packShelfClose()} onClick={onClose}>
          收起
        </button>
      </div>

      <ul className={packShelfList()}>
        {OPEN_HERB_SOURCES.map((source) => {
          const busy = loadingJob?.id === source.id;

          return (
            <li key={source.id} className={packShelfRow()}>
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{source.name}</p>

                <p className="truncate text-xs text-muted-foreground">{source.detail}</p>
              </div>

              <div className={packShelfActions()}>
                {/* 两个钮分开：一个领进来对照，一个只把文件存到电脑 */}
                <button
                  type="button"
                  className={packShelfAction()}
                  disabled={loadingJob !== null}
                  onClick={() => onImport(source)}
                >
                  {shelfActionLabel(busy, loadingJob, "import")}
                </button>

                <button
                  type="button"
                  className={packShelfAction()}
                  disabled={loadingJob !== null}
                  onClick={() => onDownload(source)}
                >
                  {shelfActionLabel(busy, loadingJob, "download")}
                </button>
              </div>
            </li>
          );
        })}
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
  // 手机没有拖文件这回事，文案改成点按，免得人对着虚线框发愣
  const narrow = useNarrowScreen();

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
          {dragging ? "松开即可导入" : narrow ? "点这里选择文件" : "把文件拖到这里"}
        </span>

        <span className="text-xs">
          {narrow ? "JSON 或 SMHB Excel" : "JSON 或 SMHB Excel，也可点击选择"}
        </span>

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

