jest.mock('../Plotly', () => ({
    __esModule: true,
    default: {
        newPlot: jest.fn(),
        relayout: jest.fn(),
        restyle: jest.fn(),
        purge: jest.fn()
    }
}));

import Plotly from '../Plotly';
import { PlotlyAdapter } from '../adapters/PlotlyAdapter';
import { ChartEventType, SelectMode } from '../Constants';

describe('PlotlyAdapter', () => {
    let adapter: PlotlyAdapter;
    let container: {
        on: jest.Mock;
        removeAllListeners: jest.Mock;
    };
    let listeners: Map<string, (payload: unknown) => void>;

    beforeEach(() => {
        adapter = new PlotlyAdapter();
        listeners = new Map();
        container = {
            on: jest.fn((eventName: string, handler: (payload: unknown) => void) => {
                listeners.set(eventName, handler);
            }),
            removeAllListeners: jest.fn((eventName: string) => {
                listeners.delete(eventName);
            })
        };

        jest.clearAllMocks();
    });

    describe('Y-axis scale', () => {
        const renderAxes = (axes: { id: string; position: 'left' | 'bottom'; type?: 'linear' | 'log'; range?: [number, number] | string; categoryOrder?: string[] }[]) => {
            const layout: any = { width: 400, height: 300 };
            adapter.render(container as unknown as HTMLElement, { data: [], axes, layout });
            return (Plotly as any).newPlot.mock.calls[0][2];
        };

        it('defaults numeric Y axes to linear without changing the range', () => {
            const layout = renderAxes([{ id: 'y', position: 'left', range: [0, 100] }]);
            expect(layout.yaxis).toEqual(expect.objectContaining({ type: 'linear', range: [0, 100] }));
        });

        it('keeps an explicit linear Y range in data units', () => {
            const layout = renderAxes([{ id: 'y', position: 'left', type: 'linear', range: [-10, 100] }]);
            expect(layout.yaxis).toEqual(expect.objectContaining({ type: 'linear', range: [-10, 100] }));
        });

        it('maps log Y axes and converts positive data bounds to base-10 exponents', () => {
            const layout = renderAxes([{ id: 'y', position: 'left', type: 'log', range: [0.1, 1000] }]);
            expect(layout.yaxis).toEqual(expect.objectContaining({ type: 'log', range: [-1, 3] }));
        });

        it.each([[0, 100], [-1, 100], [1, 0], [100, 1], [1, Infinity], [NaN, 100]])(
            'lets Plotly auto-range invalid log bounds %s to %s', (min, max) => {
                const layout = renderAxes([{ id: 'y', position: 'left', type: 'log', range: [min, max] }]);
                expect(layout.yaxis.type).toBe('log');
                expect(layout.yaxis).not.toHaveProperty('range');
            }
        );

        it('lets Plotly auto-range a non-numeric log range', () => {
            const layout = renderAxes([{ id: 'y', position: 'left', type: 'log', range: 'auto' }]);
            expect(layout.yaxis).not.toHaveProperty('range');
        });

        it('leaves X axes and category Y axes unchanged', () => {
            const layout = renderAxes([
                { id: 'x', position: 'bottom', type: 'log', range: [1, 100] },
                { id: 'y', position: 'left', type: 'log', range: [0, 10], categoryOrder: ['a', 'b'] }
            ]);
            expect(layout.xaxis.type).toBeUndefined();
            expect(layout.xaxis.range).toEqual([1, 100]);
            expect(layout.yaxis).toEqual(expect.objectContaining({ type: 'category', range: [0, 10], categoryarray: ['a', 'b'] }));
        });
    });

    it('should emit DCP view change and action events after completed chart actions', () => {
        const onViewChange = jest.fn();
        const onAction = jest.fn();
        const onSelect = jest.fn();

        adapter.render(container as unknown as HTMLElement, {
            data: [],
            shapes: [],
            axes: [],
            layout: { width: 400, height: 300 },
            events: {
                [ChartEventType.ViewChange]: onViewChange,
                [ChartEventType.Action]: onAction,
                [ChartEventType.Select]: onSelect
            }
        });

        expect((Plotly as any).newPlot).toHaveBeenCalled();
        expect(listeners.has('plotly_relayout')).toBe(true);
        expect(listeners.has('plotly_buttonclicked')).toBe(true);
        expect(listeners.has('plotly_selected')).toBe(true);

        listeners.get('plotly_relayout')?.({
            'xaxis.range[0]': 10,
            'xaxis.range[1]': 20
        });

        listeners.get('plotly_buttonclicked')?.({
            button: {
                name: 'zoom2d',
                _cat: 'zoom',
                val: 'zoom'
            },
            active: 0
        });

        listeners.get('plotly_selected')?.({
            lassoPoints: { x: [1, 2], y: [3, 4] },
            points: [{ x: 1, y: 2, curveNumber: 0, pointNumber: 0, data: { name: 'Series 1' } }]
        });

        expect(onViewChange).toHaveBeenCalledWith(expect.objectContaining({
            view: {
                changes: {
                    'xaxis.range[0]': 10,
                    'xaxis.range[1]': 20
                }
            }
        }));

        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
            action: {
                name: 'zoom2d',
                category: 'zoom',
                value: 'zoom',
                activeIndex: 0
            }
        }));

        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
            points: [expect.objectContaining({
                x: 1,
                y: 2,
                seriesIndex: 0,
                pointIndex: 0,
                seriesName: 'Series 1'
            })],
            selection: {
                mode: SelectMode.Lasso
            }
        }));
    });

    it('should clear selection state when deselect is called', () => {
        adapter.render(container as unknown as HTMLElement, {
            data: [],
            shapes: [],
            axes: [],
            layout: { width: 400, height: 300 }
        });

        adapter.deselect();

        expect((Plotly as any).restyle).toHaveBeenCalledWith(container, { selectedpoints: null });
        expect((Plotly as any).relayout).toHaveBeenCalledWith(container, { selections: [] });
    });

    it('should no-op deselect when chart is not rendered', () => {
        adapter.deselect();

        expect((Plotly as any).restyle).not.toHaveBeenCalled();
        expect((Plotly as any).relayout).not.toHaveBeenCalled();
    });

    it('should include transformed annotations in layout when provided', () => {
        adapter.render(container as unknown as HTMLElement, {
            data: [],
            axes: [{ id: 'x-main', position: 'bottom' }, { id: 'y-main', position: 'left' }],
            annotations: [
                {
                    text: 'A',
                    x: 1,
                    y: 2,
                    xAxisId: 'x-main',
                    yAxisId: 'y-main',
                    showArrow: true
                }
            ],
            layout: { width: 400, height: 300 }
        });

        expect((Plotly as any).newPlot).toHaveBeenCalledWith(
            container,
            expect.any(Array),
            expect.objectContaining({
                annotations: [expect.objectContaining({ text: 'A', xref: 'x', yref: 'y', showarrow: true })]
            }),
            expect.any(Object)
        );
    });

    it('should pass scatter line shape to Plotly traces when provided', () => {
        adapter.render(container as unknown as HTMLElement, {
            data: [{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 4, 9],
                style: {
                    line: {
                        shape: 'spline'
                    }
                }
            }],
            axes: [],
            layout: { width: 400, height: 300 }
        });

        expect((Plotly as any).newPlot).toHaveBeenCalledWith(
            container,
            [expect.objectContaining({
                type: 'scatter',
                line: expect.objectContaining({ shape: 'spline' })
            })],
            expect.any(Object),
            expect.any(Object)
        );
    });

    it('should place multiple same-side y-axes at distinct positions', () => {
        adapter.render(container as unknown as HTMLElement, {
            data: [],
            axes: [
                { id: 'y-left-1', position: 'left' },
                { id: 'y-left-2', position: 'left' },
                { id: 'y-left-3', position: 'left' },
                { id: 'y-right-1', position: 'right' },
                { id: 'y-right-2', position: 'right' },
                { id: 'y-right-3', position: 'right' }
            ],
            layout: { width: 900, height: 400 }
        });

        const newPlotCall = (Plotly as any).newPlot.mock.calls[0];
        const layout = newPlotCall[2];

        // First axis on each side uses natural margin placement.
        expect(layout.yaxis.position).toBeUndefined();
        expect(layout.yaxis4.position).toBeUndefined();

        const domainRight = layout.xaxis?.domain?.[1] ?? 1;
        const domainLeft = layout.xaxis?.domain?.[0] ?? 0;

        // Extra left axes should be progressively farther left and anchored free.
        expect(layout.yaxis2.anchor).toBe('free');
        expect(layout.yaxis3.anchor).toBe('free');
        expect(layout.yaxis2.position).toBeLessThan(domainLeft);
        expect(layout.yaxis3.position).toBeLessThan(layout.yaxis2.position);

        // Extra right axes should be progressively farther right and anchored free.
        expect(layout.yaxis5.anchor).toBe('free');
        expect(layout.yaxis6.anchor).toBe('free');
        expect(layout.yaxis5.position).toBeGreaterThan(domainRight);
        expect(layout.yaxis6.position).toBeGreaterThan(layout.yaxis5.position);
    });

    it('should keep mixed left/right y-axes mapped and positioned correctly', () => {
        adapter.render(container as unknown as HTMLElement, {
            axes: [
                { id: 'x', title: 'Month', position: 'bottom' },
                { id: 'y1', title: 'Revenue (k$)', position: 'left' },
                { id: 'y2', title: 'Orders', position: 'left' },
                { id: 'y3', title: 'Conversion (%)', position: 'right' },
                { id: 'y4', title: 'NPS', position: 'right' }
            ],
            data: [
                {
                    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    y: [180, 210, 230, 250, 240, 270],
                    type: 'bar',
                    name: 'Revenue',
                    axis: { x: 'x', y: 'y1' }
                },
                {
                    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    y: [920, 980, 1100, 1230, 1180, 1310],
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Orders',
                    axis: { x: 'x', y: 'y2' }
                },
                {
                    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    y: [2.6, 2.9, 3.4, 3.1, 3.6, 3.8],
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Conversion',
                    axis: { x: 'x', y: 'y3' }
                },
                {
                    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    y: [41, 44, 47, 46, 49, 52],
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'NPS',
                    axis: { x: 'x', y: 'y4' }
                }
            ],
            layout: { width: 900, height: 400 }
        });

        const newPlotCall = (Plotly as any).newPlot.mock.calls[0];
        const plotData = newPlotCall[1];
        const layout = newPlotCall[2];

        const traceByName = (name: string) => plotData.find((t: any) => t.name === name);
        expect(traceByName('Revenue')?.yaxis).toBe('y');
        expect(traceByName('Orders')?.yaxis).toBe('y2');
        expect(traceByName('Conversion')?.yaxis).toBe('y3');
        expect(traceByName('NPS')?.yaxis).toBe('y4');

        expect(layout.yaxis.side).toBe('left');
        expect(layout.yaxis2.side).toBe('left');
        expect(layout.yaxis3.side).toBe('right');
        expect(layout.yaxis4.side).toBe('right');

        expect(layout.yaxis2.overlaying).toBe('y');
        expect(layout.yaxis3.overlaying).toBe('y');
        expect(layout.yaxis4.overlaying).toBe('y');

        const domainRight = layout.xaxis?.domain?.[1] ?? 1;
        expect(layout.yaxis3.position).toBeUndefined();
        expect(layout.yaxis4.anchor).toBe('free');
        expect(layout.yaxis4.position).toBeGreaterThan(domainRight);
    });

    it('should position four y-axes per side without overlap', () => {
        adapter.render(container as unknown as HTMLElement, {
            data: [],
            axes: [
                { id: 'yl1', position: 'left' },
                { id: 'yl2', position: 'left' },
                { id: 'yl3', position: 'left' },
                { id: 'yl4', position: 'left' },
                { id: 'yr1', position: 'right' },
                { id: 'yr2', position: 'right' },
                { id: 'yr3', position: 'right' },
                { id: 'yr4', position: 'right' }
            ],
            layout: { width: 1000, height: 500 }
        });

        const newPlotCall = (Plotly as any).newPlot.mock.calls[0];
        const layout = newPlotCall[2];
        const domainLeft = layout.xaxis?.domain?.[0] ?? 0;
        const domainRight = layout.xaxis?.domain?.[1] ?? 1;

        // First axis on each side stays at natural placement.
        expect(layout.yaxis.position).toBeUndefined();
        expect(layout.yaxis5.position).toBeUndefined();

        // Left extras (y2, y3, y4) move progressively left.
        expect(layout.yaxis2.anchor).toBe('free');
        expect(layout.yaxis3.anchor).toBe('free');
        expect(layout.yaxis4.anchor).toBe('free');
        expect(layout.yaxis2.position).toBeLessThan(domainLeft);
        expect(layout.yaxis3.position).toBeLessThan(layout.yaxis2.position);
        expect(layout.yaxis4.position).toBeLessThan(layout.yaxis3.position);

        // Right extras (y6, y7, y8) move progressively right.
        expect(layout.yaxis6.anchor).toBe('free');
        expect(layout.yaxis7.anchor).toBe('free');
        expect(layout.yaxis8.anchor).toBe('free');
        expect(layout.yaxis6.position).toBeGreaterThan(domainRight);
        expect(layout.yaxis7.position).toBeGreaterThan(layout.yaxis6.position);
        expect(layout.yaxis8.position).toBeGreaterThan(layout.yaxis7.position);
    });
});
