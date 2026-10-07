import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ALL_CATEGORY_ID, type CategoryFilterId, type Herb } from "@/types/herb";

import { getHerbClassTag, getVisibleHerbCategories } from "@/lib/herb-catalog";

import { herbPicker } from "./styles";

// 选项列表最多占这么高，超出后只在列表自己里面滚
const MENU_MAX_HEIGHT = 256;

// 列表和输入框之间留的缝
const MENU_GAP = 4;

// 药名格子里的选药框。从当前药柜里挑，选中后由外面决定是新开一行还是改已有的一行
interface HerbNamePickerProps {
  herbs: Herb[];
  takenHerbIds: string[];
  onPick: (herb: Herb) => void;
}

// 选项列表贴着输入框。下方空间不够时改贴在输入框上沿，短列表也不会悬空
function placeMenu(anchor: HTMLInputElement) {
  const rect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
  const spaceAbove = rect.top - MENU_GAP;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
  const maxHeight = Math.min(MENU_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow);

  return {
    top: openUp ? undefined : rect.bottom + MENU_GAP,
    bottom: openUp ? window.innerHeight - rect.top + MENU_GAP : undefined,
    left: rect.left,
    width: Math.max(rect.width, 320),
    maxHeight,
  };
}

export function HerbNamePicker({ herbs, takenHerbIds, onPick }: HerbNamePickerProps) {
  // 正在敲的药名。空着就列出药柜里靠前的药
  const [keyword, setKeyword] = useState("");

  // 当前选中的分类。全部表示不按柜门收窄
  const [categoryId, setCategoryId] = useState<CategoryFilterId>(ALL_CATEGORY_ID);

  // 列表开没开。点到药或点外面再关上
  const [open, setOpen] = useState(false);

  // 选药输入框，用来算列表该出现在哪
  const inputRef = useRef<HTMLInputElement>(null);

  // 列表当前贴着输入框的位置。关着时没有
  const [menuBox, setMenuBox] = useState<ReturnType<typeof placeMenu> | null>(null);

  const taken = useMemo(() => new Set(takenHerbIds), [takenHerbIds]);

  // 只列出药柜里真正有药的分类，空柜门不出现在选药里
  const categories = useMemo(() => {
    const used = new Set(herbs.map((herb) => herb.categoryId));

    return getVisibleHerbCategories(herbs).filter((category) => used.has(category.id));
  }, [herbs]);

  // 选中的分类如果已经不在药柜里，就当没选，回到全部
  const activeCategoryId = categories.some((category) => category.id === categoryId)
    ? categoryId
    : ALL_CATEGORY_ID;

  // 先按分类，再按药名或拼音。已经在这张方里的药也留着，点它会回到原来那一行
  const matches = useMemo(() => {
    const needle = keyword.trim().toLowerCase();

    return herbs
      .filter((herb) => {
        if (activeCategoryId !== ALL_CATEGORY_ID && herb.categoryId !== activeCategoryId) {
          return false;
        }

        if (!needle) {
          return true;
        }

        return (
          herb.name.toLowerCase().includes(needle) ||
          herb.pinyin.toLowerCase().includes(needle) ||
          herb.aliases?.some((alias) => alias.toLowerCase().includes(needle)) ||
          herb.sources?.some((source) => source.toLowerCase().includes(needle))
        );
      })
      .slice(0, activeCategoryId === ALL_CATEGORY_ID && !needle ? 12 : 80);
  }, [activeCategoryId, herbs, keyword]);

  // 打开时把列表放到输入框旁边。页面滚动或窗口变大小时重新贴一次
  useLayoutEffect(() => {
    const anchor = inputRef.current;

    if (!open || !anchor) {
      return;
    }

    function place() {
      if (!inputRef.current) {
        return;
      }

      setMenuBox(placeMenu(inputRef.current));
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const menu =
    open && menuBox
      ? createPortal(
          <div
            className={herbPicker.menu()}
            style={{
              top: menuBox.top,
              bottom: menuBox.bottom,
              left: menuBox.left,
              width: menuBox.width,
              maxHeight: menuBox.maxHeight,
            }}
          >
            {/* 按下分类时先拦住失焦，否则列表会在点中之前收起 */}
            <div className={herbPicker.filters()}>
              <button
                type="button"
                className={herbPicker.chip({ active: activeCategoryId === ALL_CATEGORY_ID })}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setCategoryId(ALL_CATEGORY_ID);
                }}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={herbPicker.chip({ active: activeCategoryId === category.id })}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setCategoryId(category.id);
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <ul className={herbPicker.list()} style={{ maxHeight: Math.max(96, menuBox.maxHeight - 44) }}>
              {matches.length === 0 ? (
                <li className={herbPicker.empty()}>药柜里没有这味</li>
              ) : (
                matches.map((herb) => (
                  <li key={herb.id}>
                    <button
                      type="button"
                      className={herbPicker.option()}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onPick(herb);
                        setKeyword("");
                        setOpen(false);
                      }}
                    >
                      <span className={herbPicker.optionHead()}>
                        <span>{herb.name}</span>
                        {taken.has(herb.id) ? (
                          <span className={herbPicker.taken()}>已在方中</span>
                        ) : null}
                      </span>
                      {/* 分类、性味、功效写在药名下面，方笺表格里不再贴这些标签 */}
                      <span className={herbPicker.optionMeta()}>
                        {[getHerbClassTag(herb), herb.nature.trim(), herb.functions.trim()]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={herbPicker.wrap()}>
      <input
        ref={inputRef}
        value={keyword}
        placeholder="选药"
        className={herbPicker.input()}
        onChange={(event) => {
          setKeyword(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
      />

      {menu}
    </div>
  );
}
