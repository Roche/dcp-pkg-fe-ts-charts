import Plotly from '../Plotly';
import { AxisTransformer } from './plotly/AxisTransformer';
import { DataTransformer } from './plotly/DataTransformer';
import { LayoutTransformer } from './plotly/LayoutTransformer';
import { ChartEventHandler, ChartEventData, ChartEventTypes } from '../types/interactions';
import { ChartEventType, InteractionMode, SelectMode } from '../Constants';
import { InteractionModes, SelectModes } from '../types/config';

export class PlotlyAdapter {
    private readonly axisTransformer = new AxisTransformer();
    private readonly dataTransformer = new DataTransformer();
    private readonly layoutTransformer = new LayoutTransformer();
    private readonly eventHandlers = new Map<ChartEventTypes, ChartEventHandler>();
    private currentContainer?: HTMLElement;

    render(container: HTMLElement, config: any): void {
        const axisIdToPlotlyKey = this.axisTransformer.transformAxes(config.axes, config.layout);
        const layout = this.layoutTransformer.transform(config.layout, config.data, config.shapes, config.annotations, config.axes, axisIdToPlotlyKey);
        const plotlyData = this.dataTransformer.transform(config.data, axisIdToPlotlyKey);

        const plotlyConfig = {
            displayModeBar: 'hover',
            displaylogo: false,
            modeBarButtonsToRemove: ['sendDataToCloud'],
            ...(config.options ?? {})
        };

        Plotly.newPlot(container, plotlyData, layout, plotlyConfig);
        this.currentContainer = container;

        if (config.events) {
            Object.entries(config.events).forEach(([eventType, handler]) => {
                this.on(eventType as ChartEventTypes, handler as ChartEventHandler);
            });
        }
    }

    setInteractionMode(mode: InteractionModes): void {
        if (!this.currentContainer) return;

        const dragmode = this.mapInteractionModeToPlotlyDragmode(mode);
        const update: any = { dragmode };

        if (mode === InteractionMode.None) {
            update['xaxis.fixedrange'] = true;
            update['yaxis.fixedrange'] = true;
        } else {
            update['xaxis.fixedrange'] = false;
            update['yaxis.fixedrange'] = false;
        }

        Plotly.relayout(this.currentContainer, update);
    }

    setSelectMode(mode: SelectModes): void {
        if (!this.currentContainer) return;

        const dragmode = mode === SelectMode.Lasso ? 'lasso' : 'select';
        Plotly.relayout(this.currentContainer, { dragmode });
    }

    deselect(): void {
        if (!this.currentContainer) return;

        Plotly.restyle(this.currentContainer, { selectedpoints: null });
        // selections is a valid Plotly property but not in @types/plotly.js
        Plotly.relayout(this.currentContainer, { selections: [] } as any);
    }

    private mapInteractionModeToPlotlyDragmode(mode: InteractionModes, selectMode?: SelectModes): string | false {
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

    on(eventType: ChartEventTypes, handler: ChartEventHandler): void {
        if (!this.currentContainer) return;

        this.eventHandlers.set(eventType, handler);

        const plotlyEventName = this.mapToPlotlyEvent(eventType);
        const wrappedHandler = (data: any) => {
            const eventData = this.transformPlotlyEventData(data, eventType);
            handler(eventData);
        };

        (this.currentContainer as any).on(plotlyEventName, wrappedHandler);
    }

    off(eventType: ChartEventTypes): void {
        if (!this.currentContainer) return;

        const plotlyEventName = this.mapToPlotlyEvent(eventType);
        (this.currentContainer as any).removeAllListeners(plotlyEventName);
        this.eventHandlers.delete(eventType);
    }

    private mapToPlotlyEvent(eventType: ChartEventTypes): string {
        const eventMap: Record<ChartEventTypes, string> = {
            [ChartEventType.Click]: 'plotly_click',
            [ChartEventType.Select]: 'plotly_selected',
            [ChartEventType.Hover]: 'plotly_hover',
            [ChartEventType.Unhover]: 'plotly_unhover',
            [ChartEventType.DoubleClick]: 'plotly_doubleclick',
            [ChartEventType.Deselect]: 'plotly_deselect',
            [ChartEventType.ViewChange]: 'plotly_relayout',
            [ChartEventType.Action]: 'plotly_buttonclicked'
        };
        return eventMap[eventType];
    }

    private transformPlotlyEventData(plotlyData: any, eventType: ChartEventTypes): ChartEventData {
        const points = (plotlyData?.points ?? []).map((pt: any) => ({
            x: pt.x,
            y: pt.y,
            seriesIndex: pt.curveNumber,
            pointIndex: pt.pointIndex ?? pt.pointNumber,
            seriesName: pt.data?.name,
            data: pt
        }));

        const eventData: ChartEventData = {
            points,
            event: plotlyData?.event
        };

        if (eventType === ChartEventType.ViewChange && this.isRecord(plotlyData)) {
            eventData.view = {
                changes: plotlyData
            };
        }

        if (eventType === ChartEventType.Action) {
            eventData.action = {
                name: plotlyData?.button?.name,
                category: plotlyData?.button?._cat,
                value: plotlyData?.button?.val,
                activeIndex: typeof plotlyData?.active === 'number' ? plotlyData.active : undefined
            };
        }

        if (eventType === ChartEventType.Select) {
            eventData.selection = {
                mode: plotlyData?.lassoPoints ? SelectMode.Lasso : plotlyData?.range ? SelectMode.Box : undefined
            };
        }

        return eventData;
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    destroy(container: HTMLElement): void {
        // Remove all event listeners
        this.eventHandlers.forEach((_, eventType) => {
            this.off(eventType);
        });

        Plotly.purge(container);
        this.currentContainer = undefined;
    }
}