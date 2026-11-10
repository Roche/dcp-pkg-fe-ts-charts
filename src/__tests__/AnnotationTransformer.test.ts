import { AnnotationTransformer } from '../adapters/plotly/AnnotationTransformer';
import type { ChartAnnotation } from '../types/annotations';

describe('AnnotationTransformer', () => {
    let transformer: AnnotationTransformer;

    beforeEach(() => {
        transformer = new AnnotationTransformer();
    });

    it('should transform annotations with default axis references', () => {
        const annotations: ChartAnnotation[] = [
            {
                text: 'Peak',
                x: 10,
                y: 20
            }
        ];

        const result = transformer.transform(annotations, {});

        expect(result).toEqual([
            expect.objectContaining({
                text: 'Peak',
                x: 10,
                y: 20,
                xref: 'x',
                yref: 'y',
                showarrow: false
            })
        ]);
    });

    it('should resolve configured axis ids and map simplified style fields', () => {
        const annotations: ChartAnnotation[] = [
            {
                text: 'Threshold',
                x: 5,
                y: 80,
                xAxisId: 'x-secondary',
                yAxisId: 'y-right',
                showArrow: true,
                style: {
                    color: '#111',
                    fontSize: 12,
                    backgroundColor: '#fff'
                }
            }
        ];

        const axisMap = {
            'x-secondary': 'x2',
            'y-right': 'y2'
        };

        const result = transformer.transform(annotations, axisMap);

        expect(result).toEqual([
            expect.objectContaining({
                xref: 'x2',
                yref: 'y2',
                showarrow: true,
                bgcolor: '#fff',
                font: {
                    color: '#111',
                    size: 12
                }
            })
        ]);
    });

    it('should fallback to default axes when configured ids are unknown', () => {
        const annotations: ChartAnnotation[] = [
            {
                text: 'Corner Label',
                x: 0,
                y: 1,
                xAxisId: 'x-missing',
                yAxisId: 'y-missing'
            }
        ];

        const result = transformer.transform(annotations, {
            someAxis: 'x3'
        });

        expect(result).toEqual([
            expect.objectContaining({
                xref: 'x',
                yref: 'y'
            })
        ]);
    });

    it('should prefer explicit refs over axis id mapping', () => {
        const annotations: ChartAnnotation[] = [
            {
                text: 'Pinned',
                x: 5,
                y: 0.8,
                xRef: 'x',
                yRef: 'paper',
                xAxisId: 'x-secondary',
                yAxisId: 'y-right'
            }
        ];

        const result = transformer.transform(annotations, {
            'x-secondary': 'x2',
            'y-right': 'y2'
        });

        expect(result).toEqual([
            expect.objectContaining({
                xref: 'x',
                yref: 'paper'
            })
        ]);
    });
});
