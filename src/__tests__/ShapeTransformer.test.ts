import { ShapeTransformer } from '../adapters/plotly/ShapeTransformer';
import type { ChartShape } from '../types/shapes';

describe('ShapeTransformer', () => {
    let transformer: ShapeTransformer;

    beforeEach(() => {
        transformer = new ShapeTransformer();
    });

    it('should default horizontal and vertical line refs for full-span rendering', () => {
        const shapes: ChartShape[] = [
            {
                type: 'hline',
                y: 10
            },
            {
                type: 'vline',
                x: 20
            }
        ];

        const result = transformer.transform(shapes, {});

        expect(result[0]).toEqual(expect.objectContaining({ xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: 10, y1: 10 }));
        expect(result[1]).toEqual(expect.objectContaining({ xref: 'x', yref: 'paper', x0: 20, x1: 20, y0: 0, y1: 1 }));
    });

    it('should support explicit paper refs', () => {
        const shapes: ChartShape[] = [
            {
                type: 'vline',
                x: 5,
                xRef: 'x',
                yRef: 'paper'
            }
        ];

        const result = transformer.transform(shapes, {});

        expect(result).toEqual([
            expect.objectContaining({ xref: 'x', yref: 'paper' })
        ]);
    });
});
