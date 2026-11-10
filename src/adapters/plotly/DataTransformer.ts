import { ChartSeries } from '../../types/config';
import { SeriesTransformer } from './SeriesTransformer';

export class DataTransformer {
    private readonly seriesTransformer = new SeriesTransformer();

    transform(data: ChartSeries[], axisIdToPlotlyKey: Record<string, string>): any[] {
        const singleTraceTypes = ['pie', 'heatmap'];
        const mainType = data[0]?.type;

        if (singleTraceTypes.includes(mainType ?? '')) {
            return this.seriesTransformer.transform([data[0]], axisIdToPlotlyKey);
        }

        return data
            .map(series => this.seriesTransformer.transform([series], axisIdToPlotlyKey))
            .reduce((acc, val) => acc.concat(val), []);
    }
}