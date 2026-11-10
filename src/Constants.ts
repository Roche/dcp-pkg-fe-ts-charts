export const ChartType = {
    Bar: 'bar',
    Scatter: 'scatter',
    Pie: 'pie',
    Box: 'box',
    Radar: 'radar',
    Heatmap: 'heatmap',
    Histogram: 'histogram'
} as const;

export const ChartMode = {
    Lines: 'lines',
    Markers: 'markers',
    LinesAndMarkers: 'lines+markers'
} as const;

export const ChartOrientation = {
    Vertical: 'vertical',
    Horizontal: 'horizontal'
} as const;

export const AxisPosition = {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom'
} as const;

export const HorizontalAlign = {
    Left: 'left',
    Center: 'center',
    Right: 'right',
    Auto: 'auto'
} as const;

export const VerticalAlign = {
    Top: 'top',
    Middle: 'middle',
    Bottom: 'bottom',
    Auto: 'auto'
} as const;

export const ChartEventType = {
    Click: 'click',
    Select: 'select',
    Hover: 'hover',
    Unhover: 'unhover',
    DoubleClick: 'doubleclick',
    Deselect: 'deselect',
    ViewChange: 'viewchange',
    Action: 'action'
} as const;

export const InteractionMode = {
    None: 'none',
    Pan: 'pan',
    Zoom: 'zoom',
    Select: 'select'
} as const;

export const SelectMode = {
    None: 'none',
    Lasso: 'lasso',
    Box: 'box'
} as const;

export const LineDashType = {
    Solid: 'solid',
    Dash: 'dash',
    Dot: 'dot',
    DashDot: 'dashdot'
} as const;

export const LineShape = {
    Linear: 'linear',
    Spline: 'spline',
    Hv: 'hv',
    Vh: 'vh',
    Hvh: 'hvh',
    Vhv: 'vhv'
} as const;

export const FillAreaOption = {
    None: 'none',
    ToZeroX: 'tozerox',
    ToZeroY: 'tozeroy',
    ToNextX: 'tonextx',
    ToNextY: 'tonexty',
    ToSelf: 'toself'
} as const;

export const ChartShapeType = {
    HorizontalLine: 'hline',
    VerticalLine: 'vline',
    Line: 'line',
    Rectangle: 'rect',
    Circle: 'circle',
    Path: 'path'
} as const;