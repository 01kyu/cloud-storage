"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useDispatch } from "react-redux";

import { SortDirection, SortField } from "@cs/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui";

import { selectSort, setSortDirection, setSortField } from "../model/explorer-slice";

import { useExplorerSelector } from "./use-explorer-selector";

const FIELD_LABELS: Record<SortField, string> = {
  [SortField.Name]: "Имя",
  [SortField.Size]: "Размер",
  [SortField.CreatedAt]: "Дата создания",
  [SortField.UpdatedAt]: "Дата изменения",
};

const FIELD_OPTIONS = Object.values(SortField);

export const SortControl = () => {
  const dispatch = useDispatch();
  const sort = useExplorerSelector(selectSort);

  const directionIcon =
    sort.direction === SortDirection.Asc ? (
      <ArrowUpNarrowWide size={14} aria-hidden="true" />
    ) : (
      <ArrowDownWideNarrow size={14} aria-hidden="true" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" iconLeft={directionIcon}>
          {`Сортировка: ${FIELD_LABELS[sort.field]}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sort.field}
          onValueChange={(value) => dispatch(setSortField(value as SortField))}
        >
          {FIELD_OPTIONS.map((field) => (
            <DropdownMenuRadioItem key={field} value={field}>
              {FIELD_LABELS[field]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sort.direction}
          onValueChange={(value) => dispatch(setSortDirection(value as SortDirection))}
        >
          <DropdownMenuRadioItem value={SortDirection.Asc}>По возрастанию</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SortDirection.Desc}>По убыванию</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
