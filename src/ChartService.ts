import { BehaviorSubject, Subscription } from 'rxjs';
import { AxisService } from './AxisService';
import { ChartConfig, ChartAdapter, SelectModes, InteractionModes, AxisConfig } from './types/config';
import { ChartEventHandler, ChartEventTypes } from './types/interactions';

export class ChartService {
    private readonly config$ = new BehaviorSubject<ChartConfig | null>(null);
    private readonly axisService = new AxisService();
    private readonly configSubscription?: Subscription;
    private container?: HTMLElement;

    constructor(
        private readonly chartId: string,
        private readonly adapter: ChartAdapter
    ) {
        this.configSubscription = this.config$.subscribe(() => {
            this.render();
        });
    }

    getChartId(): string {
        return this.chartId;
    }

    setConfig(config: ChartConfig): void {
        this.config$.next(config);

        if (config.axes) {
            const currentAxes = this.axisService.getAxes();
            currentAxes.forEach(axis => this.axisService.removeAxis(axis.id));
            config.axes.forEach(axis => this.axisService.addAxis(axis));
        }
    }

    setInteractionMode(mode: InteractionModes): void {
        this.adapter.setInteractionMode(mode);

        const currentConfig = this.config$.getValue();
        if (currentConfig?.layout) {
            this.setConfig({
                ...currentConfig,
                layout: {
                    ...currentConfig.layout,
                    interactionMode: mode
                }
            });
        }
    }

    setSelectMode(mode: SelectModes): void {
        this.adapter.setSelectMode(mode);

        const currentConfig = this.config$.getValue();
        if (currentConfig?.layout) {
            this.setConfig({
                ...currentConfig,
                layout: {
                    ...currentConfig.layout,
                    selectMode: mode
                }
            });
        }
    }

    deselect(): void {
        this.adapter.deselect();
    }

    addAxis(config: AxisConfig): void {
        this.axisService.addAxis(config);
    }

    removeAxis(axisId: string): void {
        this.axisService.removeAxis(axisId);
        this.render();
    }

    mount(container: HTMLElement): void {
        this.container = container;
        this.render();
    }

    on(eventType: ChartEventTypes, handler: ChartEventHandler): void {
        this.adapter.on(eventType, handler);
    }

    off(eventType: ChartEventTypes): void {
        this.adapter.off(eventType);
    }

    private render(): void {
        const config = this.config$.getValue();

        if (!(config && this.container)) return;
        if (!config?.layout?.responsive && (!config?.layout?.width || !config?.layout?.height)) return;

        const updatedLayout = this.axisService.getUpdatedLayout(config.layout ?? {});

        this.adapter.render(this.container as HTMLElement, {
            ...config,
            layout: updatedLayout
        });
    }

    destroy(): void {
        if (this.container) {
            this.adapter.destroy(this.container as HTMLElement);
        }
        if (this.configSubscription) {
            this.configSubscription.unsubscribe();
        }
    }
}
