import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { ALL_CATEGORY_ID, type CategoryFilterId, type Herb, type HerbChild } from "@/types/herb";

import { getHerbClassTag, getVisibleHerbCategories } from "@/lib/herb-catalog";

import { herbPicker } from "./styles";

// 选项列表最多占这么高，超出后只在列表自己里面滚
const MENU_MAX_HEIGHT = 256;

// 列表和输入框之间留的缝
const MENU_GAP = 4;

// 方子里已经占用的一行。本尊和子项分开认，炙黄芪在方里时，黄芪本身还不算占用
interface TakenLine {
  herbId: string;
  process: string;
  source: string;
}

// 药名格子里的选药框。从当前药柜里挑，选中后由外面决定是新开一行还是改已有的一行
interface HerbNamePickerProps {
  herbs: Herb[];
  takenLines: TakenLine[];
  onPick: (herb: Herb, child?: HerbChild) => void;
  // 点表格里的药名重新选时带上。一出现就打开，并先按这个药名筛
  initialKeyword?: string;
  autoFocus?: boolean;
  // 点药名时传入这个按钮。下拉贴着它打开，搜索框不进表格，列宽保持不动
  anchorRef?: RefObject<HTMLElement | null>;
  // 点到外面时调用。表格里用来把下拉关上
  onDismiss?: () => void;
}

// 关键字打在子项上时，只露出对上的子项。打在本尊上时，子项都露出来
function matchingChildren(herb: Herb, needle: string): HerbChild[] {
  const children = herb.children ?? [];

  if (!needle) {
    return children;
  }

  const parentHit =
    herb.name.toLowerCase().includes(needle) || herb.pinyin.toLowerCase().includes(needle);

  if (parentHit) {
    return children;
  }

  return children.filter(
    (child) =>
      child.name.toLowerCase().includes(needle) ||
      child.pinyin.toLowerCase().includes(needle) ||
      child.functions.toLowerCase().includes(needle) ||
      child.source.toLowerCase().includes(needle),
  );
}

// 子项是炮制还是植物来源。两边都写了的，按炮制显示，来源仍会写进拟方
function childKindLabel(child: HerbChild) {
  if (child.process) {
    return "炮制";
  }

  return "来源";
}

// 下拉贴着药名或底部输入框。下方空间不够时改贴在上沿，并避开窗口右缘
function placeMenu(anchor: HTMLElement, menuWidth: number) {
  const rect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
  const spaceAbove = rect.top - MENU_GAP;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
  const maxHeight = Math.min(MENU_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow);
  const width = Math.max(rect.width, menuWidth);
  const maxLeft = Math.max(8, window.innerWidth - width - 8);

  return {
    top: openUp ? undefined : rect.bottom + MENU_GAP,
    bottom: openUp ? window.innerHeight - rect.top + MENU_GAP : undefined,
    left: Math.min(Math.max(8, rect.left), maxLeft),
    width,
    maxHeight,
  };
}

export function HerbNamePicker({
  herbs,
  takenLines,
  onPick,
  initialKeyword = "",
  autoFocus = false,
  anchorRef,
  onDismiss,
}: HerbNamePickerProps) {
  // 正在敲的药名。重新选药时先带着当前药名，空着就列出药柜里靠前的药
  const [keyword, setKeyword] = useState(initialKeyword);

  // 当前选中的分类。全部表示不按柜门收窄
  const [categoryId, setCategoryId] = useState<CategoryFilterId>(ALL_CATEGORY_ID);

  // 列表开没开。点药名重新选时一出来就开着，点到药或点外面再关上
  const [open, setOpen] = useState(autoFocus);

  // 选药输入框，用来算列表该出现在哪
  const inputRef = useRef<HTMLInputElement>(null);

  // 点外面关列表的定时器。选完药卸掉输入框时把它清掉，避免下一轮选药框被关掉
  const dismissTimer = useRef<number | null>(null);

  // 组件卸掉时取消还没到点的关闭。否则刚选完药，定时器还会把药名再收一次
  useEffect(() => {
    return () => {
      if (dismissTimer.current == null) {
        return;
      }

      window.clearTimeout(dismissTimer.current);
    };
  }, []);

  // 列表当前贴着药名或输入框的位置。关着时没有
  const [menuBox, setMenuBox] = useState<ReturnType<typeof placeMenu> | null>(null);

  // 已经聚焦过就不再抢。滚动时下拉会重算位置，不能把光标一次次拉回搜索框
  const didFocusRef = useRef(false);

  // 点药名打开时直接聚焦下拉里的搜索框。下拉画出来之后才能找到这个输入框
  useLayoutEffect(() => {
    if (!autoFocus || !menuBox || didFocusRef.current) {
      return;
    }

    inputRef.current?.focus();
    didFocusRef.current = true;
  }, [autoFocus, menuBox]);

  // 这味药已经在方里。再点本尊不会另起一行
  function isHerbTaken(herbId: string) {
    return takenLines.some((line) => line.herbId === herbId);
  }

  // 子项的炮制或来源已经写在这味药那一行上
  function isChildTaken(herbId: string, child: HerbChild) {
    return takenLines.some((line) => {
      if (line.herbId !== herbId) {
        return false;
      }

      if (child.process && line.process !== child.process) {
        return false;
      }

      if (child.source && line.source !== child.source) {
        return false;
      }

      return Boolean(child.process || child.source);
    });
  }

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
          herb.sources?.some((source) => source.toLowerCase().includes(needle)) ||
          matchingChildren(herb, needle).length > 0
        );
      })
      .slice(0, activeCategoryId === ALL_CATEGORY_ID && !needle ? 12 : 80);
  }, [activeCategoryId, herbs, keyword]);

  // 打开时把列表放到药名或底部输入框旁边。页面滚动或窗口变大小时重新贴一次
  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function place() {
      const anchor = anchorRef?.current ?? inputRef.current;

      if (!anchor) {
        return;
      }

      // 下拉至少 320 宽。药名格子再窄，列表也按这个宽度打开，不回头撑表格
      setMenuBox(placeMenu(anchor, 320));
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, open]);

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
            {anchorRef ? (
              <div className={herbPicker.menuSearch()}>
                <input
                  ref={inputRef}
                  value={keyword}
                  placeholder="选药"
                  className={herbPicker.input()}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setOpen(true);
                  }}
                  onBlur={() => {
                    dismissTimer.current = window.setTimeout(() => {
                      setOpen(false);
                      onDismiss?.();
                    }, 120);
                  }}
                />
              </div>
            ) : null}

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

            <ul
              className={herbPicker.list()}
              style={{ maxHeight: Math.max(96, menuBox.maxHeight - (anchorRef ? 96 : 44)) }}
            >
              {matches.length === 0 ? (
                <li className={herbPicker.empty()}>药柜里没有这味</li>
              ) : (
                matches.map((herb) => {
                  const children = matchingChildren(herb, keyword.trim().toLowerCase());

                  return (
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
                        {isHerbTaken(herb.id) ? (
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

                    {children.length > 0 ? (
                      <div className={herbPicker.childGroup()}>
                        {children.map((child) => (
                          <button
                            key={`${child.id}-${child.process}-${child.source}`}
                            type="button"
                            className={herbPicker.child()}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onPick(herb, child);
                              setKeyword("");
                              setOpen(false);
                            }}
                          >
                            <span className={herbPicker.childBody()}>
                              <span className={herbPicker.childName()}>{child.name}</span>
                              {child.functions.trim() ? (
                                <span className={herbPicker.optionMeta()}>{child.functions}</span>
                              ) : null}
                            </span>
                            {/* 右栏只标这一条是炮制还是来源，和左边药名分开 */}
                            <span className={herbPicker.childRail()}>
                              <span className={herbPicker.childKind()}>{childKindLabel(child)}</span>
                              {isChildTaken(herb.id, child) ? (
                                <span className={herbPicker.taken()}>已在方中</span>
                              ) : null}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  // 点药名时只留下下拉。搜索框在下拉里，表格格子不再被撑开
  if (anchorRef) {
    return menu;
  }

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
          dismissTimer.current = window.setTimeout(() => {
            setOpen(false);
            onDismiss?.();
          }, 120);
        }}
      />

      {menu}
    </div>
  );
}
