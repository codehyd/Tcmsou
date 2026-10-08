import { useEffect } from "react";
import { useNavigate } from "react-router";

import { CollectionHeader } from "@/rooms/collection/components/CollectionHeader";
import { CollectionNavRail } from "@/rooms/collection/components/CollectionNavRail";
import { alignFormulaLineName } from "@/lib/herb-identity";
import { formulaTitle, isFormulaReady } from "@/lib/formula";
import { countAllHerbs } from "@/lib/herb-catalog";
import { useCabinetHerbs } from "@/store/herb-cabinet";
import { useFormulaStore } from "@/store/formula";

import { formulaList, formulaPage } from "./styles";

// 拟方列表：已保存的方在这里，也可以新开一张空的
export function FormulaListPage() {
  const herbs = useCabinetHerbs();
  const herbCount = countAllHerbs(herbs);
  const sheets = useFormulaStore((state) => state.sheets);
  const createSheet = useFormulaStore((state) => state.createSheet);
  const deleteSheet = useFormulaStore((state) => state.deleteSheet);
  const updateSheet = useFormulaStore((state) => state.updateSheet);
  const navigate = useNavigate();

  // 列表上的药名收成药材名。炙黄芪会变成药名黄芪，炮制栏写成炙
  useEffect(() => {
    const knownNames = new Set(herbs.map((herb) => herb.name));

    for (const sheet of sheets) {
      const changed = sheet.lines.some((line) => alignFormulaLineName(line, knownNames) !== line);

      if (!changed) {
        continue;
      }

      updateSheet(sheet.id, (current) => ({
        ...current,
        lines: current.lines.map((line) => alignFormulaLineName(line, knownNames)),
      }));
    }
  }, [herbs, sheets, updateSheet]);

  // 点「新开一张」时调用。先在浏览器里建一张空方，再打开它
  function handleCreate() {
    const sheet = createSheet();

    navigate(`/formulas/${sheet.id}`);
  }

  return (
    <div className={formulaPage.page()}>
      <CollectionHeader title="拟方" herbCount={herbCount} backTo="/collection" />

      <div className={formulaPage.stage()}>
        <CollectionNavRail />

        <main className={formulaList.main()}>
          <button type="button" className={formulaList.create()} onClick={handleCreate}>
            新开一张
          </button>

          {sheets.length === 0 ? (
            <p className={formulaList.empty()}>还没有拟方。新开一张后，从药柜里把药添进行。</p>
          ) : (
            <ul className={formulaList.grid()}>
              {sheets.map((sheet) => {
                const ready = isFormulaReady(sheet);

                return (
                  <li key={sheet.id} className="flex flex-col gap-2">
                    <button
                      type="button"
                      className={formulaList.card()}
                      onClick={() => navigate(`/formulas/${sheet.id}`)}
                    >
                      <span className={formulaList.title()}>{formulaTitle(sheet)}</span>
                      <span className={ready ? formulaList.ready() : formulaList.draft()}>
                        {ready ? "已拟" : "草稿"}
                        {sheet.doseCount ? ` · ${sheet.doseCount} 剂` : ""}
                        {` · ${sheet.lines.length} 味`}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="self-start text-xs text-muted-foreground underline"
                      onClick={() => deleteSheet(sheet.id)}
                    >
                      删除
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
