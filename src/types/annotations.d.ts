export interface ChartAnnotationStyle {
    color?: string;
    fontSize?: number;
    backgroundColor?: string;
}

export interface ChartAnnotation {
    text: string;
    x: number | string;
    y: number | string;
    xRef?: string;
    yRef?: string;
    xAxisId?: string;
    yAxisId?: string;
    xShift?: number;
    yShift?: number;
    showArrow?: boolean;
    style?: ChartAnnotationStyle;
}