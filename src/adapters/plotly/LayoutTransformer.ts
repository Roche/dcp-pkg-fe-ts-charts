import { ChartSeries, ChartLayout } from '../../types/config';
import { ChartShape } from '../../types/shapes';
import { AxisConfig } from "../../types/config";
import { InteractionMode, SelectMode } from '../../Constants';
import { ShapeTransformer } from './ShapeTransformer';
import { PlotlyMapper } from './PlotlyMapper';
import { ChartAnnotation } from '../../types/annotations';
import { AnnotationTransformer } from './AnnotationTransformer';

export class LayoutTransformer {
    private readonly shapeTransformer = new ShapeTransformer();
    private readonly annotationTransformer = new AnnotationTransformer();

    transform(
        layout: Partial<ChartLayout> | undefined,
        data: ChartSeries[] | undefined,
        shapes: ChartShape[] | undefined,
        annotations: ChartAnnotation[] | undefined,
        axes: AxisConfig[] | undefined,
        axisIdToPlotlyKey: Record<string, string>
    ): any {
        const plotlyLayout: any = { ...layout };

        if (data?.some(s => s.type === 'radar')) {
            plotlyLayout.polar = plotlyLayout.polar ?? {
                radialaxis: { visible: true }
            };
        }

        // Ensure default axes have gridlines hidden (Plotly defaults show them)
        // This applies when no custom axes are defined
        if (!axes || axes.length === 0) {
            plotlyLayout.xaxis = plotlyLayout.xaxis ?? { showgrid: false };
            plotlyLayout.yaxis = plotlyLayout.yaxis ?? { showgrid: false };
        }

        const interactionMode = layout?.interactionMode ?? InteractionMode.None;
        const selectMode = layout?.selectMode ?? SelectMode.Box;

        plotlyLayout.dragmode = this.mapInteractionModeToPlotly(interactionMode, selectMode);

        if (shapes && shapes.length > 0) {
            plotlyLayout.shapes = this.shapeTransformer.transform(shapes, axisIdToPlotlyKey);
        }

        if (annotations && annotations.length > 0) {
            const userAnnotations = this.annotationTransformer.transform(annotations, axisIdToPlotlyKey);
            // Merge with any axis-title annotations already injected by AxisTransformer
            plotlyLayout.annotations = [...(plotlyLayout.annotations ?? []), ...userAnnotations];
        }

        if (layout?.style) {
            if (layout.style.backgroundColor) {
                plotlyLayout.paper_bgcolor = layout.style.backgroundColor;
                plotlyLayout.plot_bgcolor = layout.style.backgroundColor;
            }

            if (layout.style.showLegend !== undefined) {
                plotlyLayout.showlegend = layout.style.showLegend;
            }

            if (layout.style.forceLegend) {
                plotlyLayout.showlegend = true;
            }

            if (layout.style.legendPosition) {
                const legendConfig: any = {};

                if (layout.style.legendPosition.x !== undefined) {
                    legendConfig.x = layout.style.legendPosition.x;
                }
                if (layout.style.legendPosition.y !== undefined) {
                    legendConfig.y = layout.style.legendPosition.y;
                }
                if (layout.style.legendPosition.xAlign) {
                    legendConfig.xanchor = layout.style.legendPosition.xAlign;
                }
                if (layout.style.legendPosition.yAlign) {
                    legendConfig.yanchor = layout.style.legendPosition.yAlign;
                }
                if (layout.style.legendPosition.orientation) {
                    legendConfig.orientation = PlotlyMapper.mapOrientation(layout.style.legendPosition.orientation);
                }

                plotlyLayout.legend = legendConfig;
            }
        }

        return plotlyLayout;
    }

    private mapInteractionModeToPlotly(mode: string, selectMode: string): string | false {
        switch (mode) {
            case InteractionMode.None:
                return false;
            case InteractionMode.Pan:
                return 'pan';
            case InteractionMode.Zoom:
                return 'zoom';
            case InteractionMode.Select:
                return selectMode === SelectMode.Lasso ? 'lasso' : 'select';
            default:
                return false;
        }
    }
}