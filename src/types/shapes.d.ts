import {LineDashTypes} from "./config";

export interface ChartShapeBase {
    xRef?: string;
    yRef?: string;
    line?: {
        color?: string;
        width?: number;
        dash?: LineDashTypes;
    };
    fillColor?: string;
}

export interface HorizontalLineShape extends ChartShapeBase {
    type: 'hline';
    y: number;
}

export interface VerticalLineShape extends ChartShapeBase {
    type: 'vline';
    x: number;
}

export interface LineShape extends ChartShapeBase {
    type: 'line';
    x0: number | string;
    y0: number | string;
    x1: number | string;
    y1: number | string;
}

export interface RectangleShape extends ChartShapeBase {
    type: 'rect';
    x0: number | string;
    y0: number | string;
    x1: number | string;
    y1: number | string;
}

export interface CircleShape extends ChartShapeBase {
    type: 'circle';
    // Circle: centerX, centerY, radius
    centerX?: number;
    centerY?: number;
    radius?: number;
    // Ellipse: x0, y0, x1, y1
    x0?: number | string;
    y0?: number | string;
    x1?: number | string;
    y1?: number | string;
}

export interface PathShape extends ChartShapeBase {
    type: 'path';
    path: string; // SVG path string
}

export type ChartShape =
    | HorizontalLineShape
    | VerticalLineShape
    | LineShape
    | RectangleShape
    | CircleShape
    | PathShape;
