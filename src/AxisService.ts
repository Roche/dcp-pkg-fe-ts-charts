import { BehaviorSubject } from 'rxjs';
import type { AxisConfig } from './types/config';
import { AxisPosition } from './Constants';

type AxisLike = {
    title?: unknown;
    [key: string]: unknown;
};

type LayoutLike = {
    margin?: {
        l?: number;
        r?: number;
        t?: number;
        b?: number;
        pad?: number;
    };
    [key: string]: unknown;
};

export class AxisService {
    private readonly axes$ = new BehaviorSubject<AxisConfig[]>([]);

    addAxis(config: AxisConfig): void {
        const currentAxes = this.axes$.getValue();
        if (currentAxes.find(axis => axis.id === config.id)) return; // Prevent duplicates

        this.axes$.next([...currentAxes, config]);
    }

    removeAxis(axisId: string): void {
        this.axes$.next(this.axes$.getValue().filter(axis => axis.id !== axisId));
    }

    getAxes(): AxisConfig[] {
        return this.axes$.getValue();
    }

    isAxis(value: any): value is AxisLike {
        if (!value || typeof value !== 'object') {
            return false;
        }
        return 'title' in value;
    }

    getUpdatedLayout(baseLayout: Partial<LayoutLike>): Partial<LayoutLike> {
        const axes = this.getAxes();
        const leftAxes = axes.filter(a => a.position === AxisPosition.Left);
        const rightAxes = axes.filter(a => a.position === AxisPosition.Right);

        const marginLeft = 40 + leftAxes.length * 20;
        const marginRight = 40 + rightAxes.length * 20;

        const layout: Partial<LayoutLike> = {
            ...baseLayout,
            margin: {
                ...(baseLayout.margin ?? {}),
                l: marginLeft,
                r: marginRight,
            },
        };

        return layout;
    }
}
