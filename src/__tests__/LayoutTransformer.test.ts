import { LayoutTransformer } from '../adapters/plotly/LayoutTransformer';

describe('LayoutTransformer', () => {
    const transformer = new LayoutTransformer();

    it('maps showLegend true to showlegend true', () => {
        const layout = transformer.transform({
            width: 400,
            height: 300,
            style: {
                showLegend: true
            }
        }, [], [], [], [], {});

        expect(layout.showlegend).toBe(true);
    });

    it('maps showLegend false to showlegend false', () => {
        const layout = transformer.transform({
            width: 400,
            height: 300,
            style: {
                showLegend: false
            }
        }, [], [], [], [], {});

        expect(layout.showlegend).toBe(false);
    });

    it('keeps forceLegend forcing the legend visible', () => {
        const layout = transformer.transform({
            width: 400,
            height: 300,
            style: {
                showLegend: false,
                forceLegend: true
            }
        }, [], [], [], [], {});

        expect(layout.showlegend).toBe(true);
    });

    it('preserves legend position mapping', () => {
        const layout = transformer.transform({
            width: 400,
            height: 300,
            style: {
                legendPosition: {
                    x: 0.25,
                    y: 0.75,
                    xAlign: 'right',
                    yAlign: 'top',
                    orientation: 'horizontal'
                }
            }
        }, [], [], [], [], {});

        expect(layout.legend).toEqual({
            x: 0.25,
            y: 0.75,
            xanchor: 'right',
            yanchor: 'top',
            orientation: 'h'
        });
    });
});