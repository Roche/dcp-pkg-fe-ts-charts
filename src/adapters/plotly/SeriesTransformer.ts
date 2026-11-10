import { PlotlyMapper } from './PlotlyMapper';
import { ChartSeries } from '../../types/config';
import { ChartType } from '../../Constants';

export class SeriesTransformer {
    transform(data: ChartSeries[], axisIdToPlotlyKey: Record<string, string>): any[] {
        return data.map(series => {
            const trace = this.transformSeriesByType(series);
            this.attachAxes(trace, series, axisIdToPlotlyKey);
            return trace;
        });
    }

    private transformSeriesByType(series: ChartSeries): any {
        switch (series.type) {
            case ChartType.Scatter:
                return {
                    type: ChartType.Scatter,
                    x: series.x,
                    y: series.y,
                    mode: PlotlyMapper.mapMode(series.mode),
                    name: series.name,
                    fill: PlotlyMapper.mapFill(series.fill),
                    ...this.getStyleProps(series.style, ['marker', 'line', 'selected', 'unselected']),
                };
            case ChartType.Bar:
                return {
                    type: ChartType.Bar,
                    x: series.x,
                    y: series.y,
                    name: series.name,
                    orientation: PlotlyMapper.mapOrientation(series.style?.orientation),
                    ...this.getStyleProps(series.style, ['marker', 'selected', 'unselected']),
                };
            case ChartType.Histogram: {
                const isHorizontal = series.style?.orientation === 'horizontal';
                return {
                    type: ChartType.Histogram,
                    ...(isHorizontal ? { y: series.x } : { x: series.x }),
                    name: series.name,
                    ...this.getStyleProps(series.style, ['marker', 'selected', 'unselected']),
                };
            }
            case ChartType.Pie:
                return {
                    type: ChartType.Pie,
                    labels: series.x,
                    values: series.y,
                    name: series.name,
                    hole: series.hole ?? 0,
                    ...this.getStyleProps(series.style, ['marker', 'selected', 'unselected']),
                };
            case ChartType.Box:
                return {
                    type: ChartType.Box,
                    y: series.y,
                    x: series.x,
                    name: series.name,
                    ...this.getStyleProps(series.style, ['marker', 'line', 'selected', 'unselected']),
                };
            case ChartType.Heatmap:
                return {
                    type: ChartType.Heatmap,
                    z: (series as any).z ?? [],
                    x: series.x,
                    y: series.y,
                    name: series.name,
                    colorscale: series.style?.colorScale,
                };
            case ChartType.Radar:
                return {
                    type: 'scatterpolar',
                    theta: series.x,
                    r: series.y,
                    mode: PlotlyMapper.mapMode(series.mode),
                    name: series.name,
                    fill: PlotlyMapper.mapFill(series.fill ?? 'toself'),
                    ...this.getStyleProps(series.style, ['marker', 'line', 'selected', 'unselected']),
                };
            default:
                return { ...series };
        }
    }

    private attachAxes(trace: any, series: ChartSeries, axisIdToPlotlyKey: Record<string, string>): void {
        if (series.axis) {
            if (series.axis.x && axisIdToPlotlyKey[series.axis.x]) {
                trace.xaxis = axisIdToPlotlyKey[series.axis.x];
            }
            if (series.axis.y && axisIdToPlotlyKey[series.axis.y]) {
                trace.yaxis = axisIdToPlotlyKey[series.axis.y];
            }
        }
    }

    private getStyleProps(style?: ChartSeries['style'], allowedProps: ('marker' | 'line' | 'selected' | 'unselected')[] = []): any {
        const props: any = {};
        if (allowedProps.includes('marker') && style?.marker) {
            props.marker = style.marker;
        }
        if (allowedProps.includes('line') && style?.line) {
            props.line = style.line;
        }
        if (allowedProps.includes('selected') && style?.selected) {
            props.selected = style.selected;
        }
        if (allowedProps.includes('unselected') && style?.unselected) {
            props.unselected = style.unselected;
        }
        return props;
    }
}