"use client";

import { LayoutGrid, List } from "lucide-react";
import { useDispatch } from "react-redux";

import { SegmentedControl, type SegmentedControlOption } from "@shared/ui";

import { selectViewMode, setViewMode, type ExplorerViewMode } from "../model/explorer-slice";

import { useExplorerSelector } from "./use-explorer-selector";

const OPTIONS: SegmentedControlOption[] = [
  { value: "list", label: "Список", icon: <List size={14} aria-hidden="true" /> },
  { value: "grid", label: "Сетка", icon: <LayoutGrid size={14} aria-hidden="true" /> },
];

export const ViewModeControl = () => {
  const dispatch = useDispatch();
  const viewMode = useExplorerSelector(selectViewMode);

  return (
    <SegmentedControl
      aria-label="Режим отображения"
      options={OPTIONS}
      value={viewMode}
      onValueChange={(value) => dispatch(setViewMode(value as ExplorerViewMode))}
    />
  );
};
