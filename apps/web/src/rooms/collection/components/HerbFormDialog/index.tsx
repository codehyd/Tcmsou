import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { CollectionSelect } from "@/rooms/collection/components/CollectionSelect";
import { HERB_CATEGORIES, getSubclassesByCategory } from "@/data/catalog/categories";
import { getDefaultSubclassId } from "@/data/catalog/herbs";
import { normalizeHerbName } from "@/lib/herb-import";
import type { CustomHerbDraft, Herb, HerbCategoryId, HerbSubclassId } from "@/types/herb";

import { herbForm } from "./styles";

// 新增时 herb 空着。编辑时带上柜里这一味，表单按它填
interface HerbFormDialogProps {
  open: boolean;
  herb: Herb | null;
  herbs: Herb[];
  onClose: () => void;
  onSubmit: (draft: CustomHerbDraft) => void;
}

// 空表的起点。分类先落在补虚，小节跟着该章的第一格
function emptyDraft(): CustomHerbDraft {
  const categoryId: HerbCategoryId = "bu_xu";

  return {
    name: "",
    pinyin: "",
    categoryId,
    subclassId: getDefaultSubclassId(categoryId),
    nature: "",
    meridians: "",
    functions: "",
    indications: "",
  };
}

// 编辑时把柜里这一味抄进表。编号不在表上改
function draftFromHerb(herb: Herb): CustomHerbDraft {
  return {
    name: herb.name,
    pinyin: herb.pinyin,
    categoryId: herb.categoryId,
    subclassId: herb.subclassId,
    nature: herb.nature,
    meridians: herb.meridians,
    functions: herb.functions,
    indications: herb.indications,
  };
}

// 收藏柜的新增、编辑窗。药名必填，和柜里已有的名字撞上就不写入
export function HerbFormDialog({ open, herb, herbs, onClose, onSubmit }: HerbFormDialogProps) {
  if (!open) {
    return null;
  }

  // 每次打开都换一把钥匙，表按这一味重新起填，不在效果里改状态
  return (
    <HerbFormBody
      key={herb?.id ?? "create"}
      herb={herb}
      herbs={herbs}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

// 表单本体。挂上时按传入的药填好，之后只跟手里的改动走
function HerbFormBody({
  herb,
  herbs,
  onClose,
  onSubmit,
}: {
  herb: Herb | null;
  herbs: Herb[];
  onClose: () => void;
  onSubmit: (draft: CustomHerbDraft) => void;
}) {
  // 表上正在填的字。新增是空表，编辑抄柜里这一味
  const [draft, setDraft] = useState<CustomHerbDraft>(() =>
    herb ? draftFromHerb(herb) : emptyDraft(),
  );

  // 药名空着或撞名时亮给填表的人
  const [error, setError] = useState("");

  // 开着才听 Esc
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // 当前章下面的节。换章时如果原来的节不属于这一章，就落到第一格
  const subclasses = getSubclassesByCategory(draft.categoryId);

  function update(patch: Partial<CustomHerbDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setError("");
  }

  function handleCategory(categoryId: HerbCategoryId) {
    const belongs = getSubclassesByCategory(categoryId).some(
      (item) => item.id === draft.subclassId,
    );

    update({
      categoryId,
      subclassId: belongs ? draft.subclassId : getDefaultSubclassId(categoryId),
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const name = draft.name.trim();

    if (!name) {
      setError("请填写药名");
      return;
    }

    // 编辑时不算自己。子项原名也算占用，避免再添一条炙黄芪
    const needle = normalizeHerbName(name);
    const taken = herbs.some((item) => {
      if (herb && item.id === herb.id) {
        return false;
      }

      if (normalizeHerbName(item.name) === needle) {
        return true;
      }

      return item.children?.some((child) => normalizeHerbName(child.name) === needle) ?? false;
    });

    if (taken) {
      setError("柜里已经有这个名字");
      return;
    }

    onSubmit({ ...draft, name });
  }

  return (
    <div className={herbForm.backdrop()}>
      <button type="button" aria-label="关闭" className={herbForm.scrim()} onClick={onClose} />

      <form className={herbForm.sheet()} onSubmit={handleSubmit}>
        <div className={herbForm.header()}>
          <h2 className={herbForm.title()}>{herb ? "编辑药品" : "新增药品"}</h2>
          <p className={herbForm.hint()}>药名必填。性味、归经、功效、主治可以先空着。</p>
        </div>

        <div className={herbForm.body()}>
          <div className={herbForm.fields()}>
            <label className={herbForm.field()}>
              <span className={herbForm.label()}>药名</span>
              <input
                value={draft.name}
                className={herbForm.control()}
                onChange={(event) => update({ name: event.target.value })}
              />
            </label>

            <label className={herbForm.field()}>
              <span className={herbForm.label()}>拼音</span>
              <input
                value={draft.pinyin}
                className={herbForm.control()}
                onChange={(event) => update({ pinyin: event.target.value })}
              />
            </label>

            <label className={herbForm.field()}>
              <span className={herbForm.label()}>功效分类</span>
              <CollectionSelect
                value={draft.categoryId}
                items={HERB_CATEGORIES.map((category) => ({
                  label: category.tag,
                  value: category.id,
                }))}
                align="start"
                triggerClassName="h-8 w-full rounded-sm border-white/15 bg-transparent"
                onChange={handleCategory}
              />
            </label>

            <label className={herbForm.field()}>
              <span className={herbForm.label()}>功用小类</span>
              <CollectionSelect
                value={draft.subclassId}
                items={subclasses.map((subclass) => ({
                  label: subclass.tag,
                  value: subclass.id,
                }))}
                align="start"
                triggerClassName="h-8 w-full rounded-sm border-white/15 bg-transparent"
                onChange={(value) => update({ subclassId: value as HerbSubclassId })}
              />
            </label>

            <label className={herbForm.field()}>
              <span className={herbForm.label()}>性味</span>
              <input
                value={draft.nature}
                className={herbForm.control()}
                onChange={(event) => update({ nature: event.target.value })}
              />
            </label>

            <label className={herbForm.field()}>
              <span className={herbForm.label()}>归经</span>
              <input
                value={draft.meridians}
                className={herbForm.control()}
                onChange={(event) => update({ meridians: event.target.value })}
              />
            </label>

            <label className={`${herbForm.field()} ${herbForm.wide()}`}>
              <span className={herbForm.label()}>功效</span>
              <textarea
                value={draft.functions}
                className={herbForm.area()}
                onChange={(event) => update({ functions: event.target.value })}
              />
            </label>

            <label className={`${herbForm.field()} ${herbForm.wide()}`}>
              <span className={herbForm.label()}>主治</span>
              <textarea
                value={draft.indications}
                className={herbForm.area()}
                onChange={(event) => update({ indications: event.target.value })}
              />
            </label>
          </div>

          {error ? <p className={herbForm.error()}>{error}</p> : null}
        </div>

        <div className={herbForm.footer()}>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">保存</Button>
        </div>
      </form>
    </div>
  );
}

// 删除前再问一句。挂在下面的炮制和来源会一起拿走
interface HerbDeleteDialogProps {
  herb: Herb | null;
  onClose: () => void;
  onConfirm: (herb: Herb) => void;
}

export function HerbDeleteDialog({ herb, onClose, onConfirm }: HerbDeleteDialogProps) {
  useEffect(() => {
    if (!herb) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [herb, onClose]);

  if (!herb) {
    return null;
  }

  // 子项名字写进确认句，免得删了本尊才发现炙黄芪也不见了
  const nested = herb.children?.map((child) => child.name) ?? [];
  const hint =
    nested.length > 0
      ? `「${herb.name}」会从收藏柜拿走，挂在下面的${nested.join("、")}也会一起拿走。`
      : `「${herb.name}」会从收藏柜拿走。`;

  return (
    <div className={herbForm.backdrop()}>
      <button type="button" aria-label="关闭" className={herbForm.scrim()} onClick={onClose} />

      <div className={herbForm.sheet()}>
        <div className={herbForm.header()}>
          <h2 className={herbForm.title()}>删除药品</h2>
          <p className={herbForm.hint()}>{hint}</p>
        </div>

        <div className={herbForm.footer()}>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={() => onConfirm(herb)}>
            删除
          </Button>
        </div>
      </div>
    </div>
  );
}
