import { ChartType } from './Constants';

/**
 * Maps DCP chart types to their corresponding Plotly trace module names.
 * This is derived from SeriesTransformer's type-to-trace mapping logic.
 */
export const CHART_TYPE_TO_PLOTLY_TRACE: Record<string, string> = {
    [ChartType.Bar]: 'bar',
    [ChartType.Scatter]: 'scatter',
    [ChartType.Histogram]: 'histogram',
    [ChartType.Pie]: 'pie',
    [ChartType.Box]: 'box',
    [ChartType.Heatmap]: 'heatmap',
    [ChartType.Radar]: 'scatterpolar',
};

/**
 * Get all unique Plotly trace names from supported chart types.
 * @returns Array of Plotly trace module names (e.g., 'bar', 'scatter', 'scatterpolar')
 */
export function getSupportedTraces(): string[] {
    // Use Set to deduplicate (in case multiple chart types map to same trace)
    return Array.from(new Set(Object.values(CHART_TYPE_TO_PLOTLY_TRACE)));
}
