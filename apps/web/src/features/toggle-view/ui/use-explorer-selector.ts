"use client";

import { useSelector } from "react-redux";

import type { ExplorerRootState } from "../model/explorer-slice";

/** Типизированный селектор фичи: её слой не знает про `RootState` приложения. */
export const useExplorerSelector = useSelector.withTypes<ExplorerRootState>();
