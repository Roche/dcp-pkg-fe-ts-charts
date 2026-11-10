import { ChartOrientation, ChartMode } from '../../Constants';

export class PlotlyMapper {
    static mapOrientation(orientation?: string): 'v' | 'h' {
        if (!orientation) return 'v';

        switch (orientation) {
            case ChartOrientation.Horizontal:
                return 'h';
            case ChartOrientation.Vertical:
                return 'v';
            default:
                return 'v';
        }
    }

    static mapMode(mode?: string): 'lines' | 'markers' | 'lines+markers' {
        if (!mode) return 'lines';

        switch (mode) {
            case ChartMode.Markers:
                return 'markers';
            case ChartMode.LinesAndMarkers:
                return 'lines+markers';
            default:
                return 'lines';
        }
    }

    static mapFill(fill?: string): string | undefined {
        if (!fill || fill === 'none') return undefined;
        
        const fillMap: Record<string, string> = {
            'tozeroy': 'tozeroy',
            'tozerox': 'tozerox',
            'tonexty': 'tonexty',
            'tonextx': 'tonextx',
            'toself': 'toself',
            'tonext': 'tonext',
            'none': undefined as any
        };

        return fillMap[fill] || fill;
    }
}