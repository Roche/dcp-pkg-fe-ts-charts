import { AxisService } from '../AxisService';
import { AxisPosition } from '../Constants';
import type { AxisConfig } from '../types/config';

describe('AxisService', () => {
    let axisService: AxisService;

    beforeEach(() => {
        axisService = new AxisService();
    });

    describe('addAxis', () => {
        it('should add a new axis', () => {
            const axisConfig: AxisConfig = {
                id: 'y1',
                title: 'Y Axis',
                position: AxisPosition.Left,
                range: [0, 100]
            };

            axisService.addAxis(axisConfig);

            const axes = axisService.getAxes();
            expect(axes).toHaveLength(1);
            expect(axes[0]).toEqual(axisConfig);
        });

        it('should not add duplicate axes with same id', () => {
            const axisConfig: AxisConfig = {
                id: 'y1',
                title: 'Y Axis',
                position: AxisPosition.Left
            };

            axisService.addAxis(axisConfig);
            axisService.addAxis(axisConfig);

            const axes = axisService.getAxes();
            expect(axes).toHaveLength(1);
        });

        it('should add multiple axes with different ids', () => {
            const axis1: AxisConfig = {
                id: 'y1',
                title: 'Left Axis',
                position: AxisPosition.Left
            };

            const axis2: AxisConfig = {
                id: 'y2',
                title: 'Right Axis',
                position: AxisPosition.Right
            };

            axisService.addAxis(axis1);
            axisService.addAxis(axis2);

            const axes = axisService.getAxes();
            expect(axes).toHaveLength(2);
        });
    });

    describe('removeAxis', () => {
        it('should remove an existing axis', () => {
            const axisConfig: AxisConfig = {
                id: 'y1',
                title: 'Y Axis',
                position: AxisPosition.Left
            };

            axisService.addAxis(axisConfig);
            axisService.removeAxis('y1');

            const axes = axisService.getAxes();
            expect(axes).toHaveLength(0);
        });

        it('should not throw error when removing non-existent axis', () => {
            expect(() => axisService.removeAxis('nonexistent')).not.toThrow();
        });

        it('should only remove the specified axis', () => {
            const axis1: AxisConfig = {
                id: 'y1',
                title: 'Left Axis',
                position: AxisPosition.Left
            };

            const axis2: AxisConfig = {
                id: 'y2',
                title: 'Right Axis',
                position: AxisPosition.Right
            };

            axisService.addAxis(axis1);
            axisService.addAxis(axis2);
            axisService.removeAxis('y1');

            const axes = axisService.getAxes();
            expect(axes).toHaveLength(1);
            expect(axes[0].id).toBe('y2');
        });
    });

    describe('getAxes', () => {
        it('should return empty array initially', () => {
            const axes = axisService.getAxes();
            expect(axes).toEqual([]);
        });

        it('should return all added axes', () => {
            const axis1: AxisConfig = {
                id: 'y1',
                position: AxisPosition.Left
            };

            const axis2: AxisConfig = {
                id: 'y2',
                position: AxisPosition.Right
            };

            axisService.addAxis(axis1);
            axisService.addAxis(axis2);

            const axes = axisService.getAxes();
            expect(axes).toHaveLength(2);
            expect(axes).toContainEqual(axis1);
            expect(axes).toContainEqual(axis2);
        });
    });

    describe('isAxis', () => {
        it('should return true for valid Plotly Axis object', () => {
            const axis = { title: { text: 'Test' } };
            expect(axisService.isAxis(axis)).toBe(true);
        });

        it('should return false for null', () => {
            expect(axisService.isAxis(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(axisService.isAxis(undefined)).toBe(false);
        });

        it('should return false for primitive values', () => {
            expect(axisService.isAxis('string')).toBe(false);
            expect(axisService.isAxis(123)).toBe(false);
        });

        it('should return false for objects without title property', () => {
            expect(axisService.isAxis({ id: 'test' })).toBe(false);
        });
    });

    describe('getUpdatedLayout', () => {
        it('should return base layout with default margins when no axes', () => {
            const baseLayout = { title: { text: 'Test Chart' } };
            const layout = axisService.getUpdatedLayout(baseLayout);

            expect(layout.margin?.l).toBe(40);
            expect(layout.margin?.r).toBe(40);
        });

        it('should increase left margin for left axes', () => {
            axisService.addAxis({ id: 'y1', position: AxisPosition.Left });
            axisService.addAxis({ id: 'y2', position: AxisPosition.Left });

            const layout = axisService.getUpdatedLayout({});

            expect(layout.margin?.l).toBe(40 + 2 * 20); // 40 + 40 = 80
            expect(layout.margin?.r).toBe(40);
        });

        it('should increase right margin for right axes', () => {
            axisService.addAxis({ id: 'y1', position: AxisPosition.Right });

            const layout = axisService.getUpdatedLayout({});

            expect(layout.margin?.l).toBe(40);
            expect(layout.margin?.r).toBe(40 + 1 * 20); // 40 + 20 = 60
        });

        it('should adjust both margins for mixed axis positions', () => {
            axisService.addAxis({ id: 'y1', position: AxisPosition.Left });
            axisService.addAxis({ id: 'y2', position: AxisPosition.Right });
            axisService.addAxis({ id: 'y3', position: AxisPosition.Right });

            const layout = axisService.getUpdatedLayout({});

            expect(layout.margin?.l).toBe(60); // 40 + 20
            expect(layout.margin?.r).toBe(80); // 40 + 40
        });

        it('should preserve other layout properties', () => {
            const baseLayout = {
                title: { text: 'Test' },
                showlegend: true,
                margin: { t: 50, b: 50 }
            };

            const layout = axisService.getUpdatedLayout(baseLayout);

            expect(layout.title).toEqual({ text: 'Test' });
            expect(layout.showlegend).toBe(true);
            expect(layout.margin?.t).toBe(50);
            expect(layout.margin?.b).toBe(50);
        });
    });
});