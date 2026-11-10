import { ChartEventType } from "../Constants";

export interface ChartViewData {
    changes: Record<string, unknown>;
}

export interface ChartActionData {
    name?: string;
    category?: string;
    value?: unknown;
    activeIndex?: number;
}

export interface ChartSelectionData {
    mode?: string;
}

export interface ChartEventData {
    points: ChartPoint[];
    event?: MouseEvent;
    view?: ChartViewData;
    action?: ChartActionData;
    selection?: ChartSelectionData;
}

export interface ChartPoint {
    x: any;
    y: any;
    seriesIndex: number;
    pointIndex: number;
    seriesName?: string;
    data?: any;
}

export type ChartEventHandler = (eventData: ChartEventData) => void;
export type ChartEventTypes = typeof ChartEventType[keyof typeof ChartEventType];