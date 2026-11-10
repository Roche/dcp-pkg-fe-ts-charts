import { ChartAnnotation } from '../../types/annotations';

export class AnnotationTransformer {
    transform(annotations: ChartAnnotation[], axisIdToPlotlyKey: Record<string, string>): any[] {
        return annotations.map((annotation) => this.transformAnnotation(annotation, axisIdToPlotlyKey));
    }

    private transformAnnotation(annotation: ChartAnnotation, axisIdToPlotlyKey: Record<string, string>): any {
        const xref = annotation.xRef ?? this.resolveAxisReference(annotation.xAxisId, axisIdToPlotlyKey, 'x');
        const yref = annotation.yRef ?? this.resolveAxisReference(annotation.yAxisId, axisIdToPlotlyKey, 'y');

        return {
            text: annotation.text,
            x: annotation.x,
            y: annotation.y,
            xref,
            yref,
            showarrow: annotation.showArrow ?? false,
            xshift: annotation.xShift,
            yshift: annotation.yShift,
            bgcolor: annotation.style?.backgroundColor,
            font: {
                color: annotation.style?.color,
                size: annotation.style?.fontSize
            }
        };
    }

    private resolveAxisReference(
        axisId: string | undefined,
        axisIdToPlotlyKey: Record<string, string>,
        fallbackType: 'x' | 'y'
    ): string {
        if (!axisId) {
            return fallbackType;
        }

        return axisIdToPlotlyKey[axisId] ?? fallbackType;
    }
}