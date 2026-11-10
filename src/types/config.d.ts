import { ChartShape } from "./shapes";
import { ChartAnnotation } from './annotations';
import { ChartType, ChartMode, ChartOrientation, AxisPosition, InteractionMode, SelectMode, LineDashType, LineShape, FillAreaOption, ChartShapeType, HorizontalAlign, VerticalAlign } from "../Constants";
import { ChartEventHandler, ChartEventTypes } from "./interactions";

type Margin = {
    l?: number;
    r?: number;
    t?: number;
    b?: number;
    pad?: number;
};

type Padding = {
    l?: number;
    r?: number;
    t?: number;
    b?: number;
};

// 1. Define chart types based on Constants
export type ChartTypes = typeof ChartType[keyof typeof ChartType];
export type ChartModes = typeof ChartMode[keyof typeof ChartMode];
export type ChartOrientations = typeof ChartOrientation[keyof typeof ChartOrientation];
export type AxisPositions = typeof AxisPosition[keyof typeof AxisPosition];
export type InteractionModes = typeof InteractionMode[keyof typeof InteractionMode];
export type SelectModes = typeof SelectMode[keyof typeof SelectMode];
export type LineDashTypes = typeof LineDashType[keyof typeof LineDashType];
export type LineShapes = typeof LineShape[keyof typeof LineShape];
export type FillAreaTypes = typeof FillAreaOption[keyof typeof FillAreaOption];
export type ChartShapeTypes = typeof ChartShapeType[keyof typeof ChartShapeType];
export type HorizontalAlignments = typeof HorizontalAlign[keyof typeof HorizontalAlign];
export type VerticalAlignments = typeof VerticalAlign[keyof typeof VerticalAlign];

type MarkerStyle = {
    color?: string;
    size?: number;
    opacity?: number;
};

export interface ChartSeriesStyle {
    marker?: MarkerStyle;
    selected?: {
        marker?: MarkerStyle;
    };
    unselected?: {
        marker?: MarkerStyle;
    };
    line?: {
        color?: string;
        width?: number;
        dash?: LineDashTypes;
        shape?: LineShapes;
    };
    orientation?: ChartOrientations;
    colorScale?: string | Array<[number, string]>;
}

export interface ChartSeries {
    x: number[] | string[];
    y?: number[] | string[];
    z?: number[] | string[];
    axis?: {
        x?: string,
        y?: string,
        z?: string
    };
    type?: ChartTypes;
    mode?: ChartModes;
    hole?: number;
    name?: string;
    fill?: FillAreaTypes;
    style?: ChartSeriesStyle;
}

export interface ChartLayoutStyle {
    backgroundColor?: string;
    showLegend?: boolean;
    forceLegend?: boolean;
    legendPosition?: {
        x?: number;
        y?: number;
        xAlign?: HorizontalAlignments;
        yAlign?: VerticalAlignments;
        orientation?: ChartOrientations;
    };
}

export interface ChartLayout {
    width: number;
    height: number;
    margin?: Partial<Margin>;
    padding?: Partial<Padding>;
    responsive?: boolean;
    title?: string;
    style?: ChartLayoutStyle;
    interactionMode?: InteractionModes;
    selectMode?: SelectModes;
}

// 2. Remove direct Plotly reference from ChartConfig
export interface ChartConfig {
    data: ChartSeries[];
    shapes?: ChartShape[];
    annotations?: ChartAnnotation[];
    axes?: AxisConfig[];
    layout?: Partial<ChartLayout>;
    options?: any;
    events?: Partial<Record<ChartEventTypes, ChartEventHandler>>;
}

// 3. ChartAdapter stays generic
export interface ChartAdapter {
    render(container: HTMLElement, config: any): void;
    destroy(container: HTMLElement): void;
    on(eventType: ChartEventTypes, handler: ChartEventHandler): void;
    off(eventType: ChartEventTypes): void;
    setInteractionMode(mode: InteractionModes): void;
    setSelectMode(mode: SelectModes): void;
    deselect(): void;
}

export interface AxisConfig {
    id: string;
    title?: string;
    position: AxisPositions;
    type?: 'linear' | 'log';
    range?: [number, number] | string;
    color?: string;
    categoryOrder?: number[] | string[];
    gridlines?: {
        show?: boolean;
        width?: number;
        color?: string;
    };
}
