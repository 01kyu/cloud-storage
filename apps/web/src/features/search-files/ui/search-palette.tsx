"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";

import { LIMITS, NodeType, type Node } from "@cs/shared";
import { describeFile, NodeIcon } from "@entities/file";
import { ROUTES } from "@shared/config";
import { cn } from "@shared/lib";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  LoadMore,
  Modal,
  ModalContent,
  Skeleton,
} from "@shared/ui";

import {
  SEARCH_FILTERS,
  SEARCH_FILTER_LABELS,
  SearchFilter,
  searchFilterLabel,
} from "../model/search-filters";
import { useSearch } from "../model/use-search";

import styles from "./search-palette.module.scss";

const LIST_ID = "search-results";

const optionId = (nodeId: string): string => `search-option-${nodeId}`;

const describeResult = (node: Node): string =>
  node.type === NodeType.Folder ? `Папка · объектов: ${node.childCount}` : describeFile(node);

/** Файл открывается в своей папке — отдельного роута у файла пока нет. */
const hrefOf = (node: Node, query: string): string => {
  if (node.type === NodeType.Folder) {
    return ROUTES.folder(node.id);
  }

  return ROUTES.folderSearch(node.folderId, node.id, query);
};

export type SearchPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Состояние открытия держит `AppShell`: палитру зовут из сайдбара и по Ctrl+K. */
export const SearchPalette = ({ open, onOpenChange }: SearchPaletteProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<SearchFilter>(SearchFilter.All);
  const [activeIndex, setActiveIndex] = useState(0);

  const { results, hasMore, isReady, isFetching, isError, loadMore, refetch } = useSearch(
    term,
    filter,
  );
  const activeResult = results[activeIndex];

  /** Радикс отдаёт фокус кнопке «Закрыть», а палитре нужен ввод. */
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTerm("");
      setFilter(SearchFilter.All);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [term, filter]);

  useEffect(() => {
    if (activeResult) {
      document.getElementById(optionId(activeResult.id))?.scrollIntoView({ block: "nearest" });
    }
  }, [activeResult]);

  const openNode = (node: Node): void => {
    onOpenChange(false);
    router.push(hrefOf(node, term));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.length === 0 ? 0 : (index + 1) % results.length));

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? 0 : (index - 1 + results.length) % results.length,
      );

      return;
    }

    if (event.key === "Enter" && activeResult) {
      event.preventDefault();
      openNode(activeResult);
    }
  };

  const renderResults = () => {
    if (!isReady) {
      return (
        <p className={styles.message}>
          {`Введите минимум ${LIMITS.searchQueryMinLength} символа — поиск идёт по имени папок и файлов.`}
        </p>
      );
    }

    if (isError) {
      return (
        <div className={styles.message}>
          <p>Не удалось выполнить поиск. Проверьте соединение и попробуйте ещё раз.</p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Повторить
          </Button>
        </div>
      );
    }

    if (isFetching && results.length === 0) {
      return (
        <div className={styles.skeletonList}>
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <p className={styles.message}>
          {`Ничего не найдено по запросу «${term.trim()}». Попробуйте изменить запрос или фильтр.`}
        </p>
      );
    }

    return (
      <ul
        id={LIST_ID}
        role="listbox"
        aria-label="Результаты поиска"
        aria-busy={isFetching}
        className={styles.list}
      >
        {results.map((node, index) => (
          <li
            key={node.id}
            id={optionId(node.id)}
            role="option"
            aria-selected={index === activeIndex}
            tabIndex={-1}
            className={cn(styles.item, index === activeIndex && styles.itemActive)}
            onMouseDown={(event) => {
              event.preventDefault();
              openNode(node);
            }}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <NodeIcon node={node} />
            <span className={styles.itemText}>
              <span className={styles.itemName}>{node.name}</span>
              <span className={styles.itemMeta}>{describeResult(node)}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        title="Поиск"
        description="Папки и файлы по имени — по всему хранилищу."
        size="lg"
        className={styles.dialog}
      >
        <div className={styles.controls}>
          <div className={styles.field}>
            <SearchIcon className={styles.fieldIcon} size={16} aria-hidden="true" />
            <Input
              ref={inputRef}
              role="combobox"
              aria-label="Поиск по имени"
              aria-autocomplete="list"
              aria-expanded={results.length > 0}
              aria-controls={LIST_ID}
              aria-activedescendant={activeResult ? optionId(activeResult.id) : undefined}
              className={styles.fieldInput}
              placeholder="Название папки или файла"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                {`Тип: ${searchFilterLabel(filter)}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Искать среди</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filter}
                onValueChange={(value) => setFilter(value as SearchFilter)}
              >
                {SEARCH_FILTERS.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {SEARCH_FILTER_LABELS[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={styles.results}>
          {renderResults()}
          {results.length > 0 ? (
            <LoadMore
              hasMore={hasMore}
              loadedCount={results.length}
              loading={isFetching}
              onLoadMore={loadMore}
            />
          ) : null}
        </div>

        <footer className={styles.hints}>
          <span>
            <kbd className={styles.key}>↑</kbd>
            <kbd className={styles.key}>↓</kbd> навигация
          </span>
          <span>
            <kbd className={styles.key}>Enter</kbd> открыть
          </span>
          <span>
            <kbd className={styles.key}>Esc</kbd> закрыть
          </span>
        </footer>
      </ModalContent>
    </Modal>
  );
};
