import { ChartShape, HorizontalLineShape, VerticalLineShape, LineShape, RectangleShape, CircleShape, PathShape } from '../../types/shapes';
import { ChartShapeType } from '../../Constants';

export class ShapeTransformer {
    transform(shapes: ChartShape[], axisIdToPlotlyKey: Record<string, string>): any[] {
        return shapes.map(shape => this.transformShape(shape, axisIdToPlotlyKey));
    }

    private transformShape(shape: ChartShape, axisIdToPlotlyKey: Record<string, string>): any {
        switch (shape.type) {
            case ChartShapeType.HorizontalLine:
                return this.createHorizontalLine(shape);
            case ChartShapeType.VerticalLine:
                return this.createVerticalLine(shape);
            case ChartShapeType.Line:
                return this.createLine(shape);
            case ChartShapeType.Rectangle:
                return this.createRectangle(shape);
            case ChartShapeType.Circle:
                return this.createCircle(shape);
            case ChartShapeType.Path:
                return this.createPath(shape);
            default:
                throw new Error(`Unsupported shape type: ${(shape as any).type}`);
        }
    }

    private createHorizontalLine(shape: HorizontalLineShape): any {
        return {
            type: 'line',
            xref: this.resolveReference(shape.xRef, 'paper'),
            yref: this.resolveReference(shape.yRef, 'y'),
            x0: 0,
            y0: shape.y,
            x1: 1,
            y1: shape.y,
            line: this.transformLineStyle(shape.line)
        };
    }

    private createVerticalLine(shape: VerticalLineShape): any {
        return {
            type: 'line',
            xref: this.resolveReference(shape.xRef, 'x'),
            yref: this.resolveReference(shape.yRef, 'paper'),
            x0: shape.x,
            y0: 0,
            x1: shape.x,
            y1: 1,
            line: this.transformLineStyle(shape.line)
        };
    }

    private createLine(shape: LineShape): any {
        return {
            type: 'line',
            xref: this.resolveReference(shape.xRef, 'x'),
            yref: this.resolveReference(shape.yRef, 'y'),
            x0: shape.x0,
            y0: shape.y0,
            x1: shape.x1,
            y1: shape.y1,
            line: this.transformLineStyle(shape.line)
        };
    }

    private createRectangle(shape: RectangleShape): any {
        return {
            type: 'rect',
            xref: this.resolveReference(shape.xRef, 'x'),
            yref: this.resolveReference(shape.yRef, 'y'),
            x0: shape.x0,
            y0: shape.y0,
            x1: shape.x1,
            y1: shape.y1,
            line: this.transformLineStyle(shape.line),
            fillcolor: shape.fillColor ?? (shape.line?.color ? `${shape.line.color}20` : 'rgba(128, 128, 128, 0.2)')
        };
    }

    private createCircle(shape: CircleShape): any {
        let x0: number, y0: number, x1: number, y1: number;

        // Check if using center + radius (circle) or x0/y0/x1/y1 (ellipse)
        if (shape.centerX !== undefined && shape.centerY !== undefined && shape.radius !== undefined) {
            // Circle mode: center + radius
            x0 = shape.centerX - shape.radius;
            y0 = shape.centerY - shape.radius;
            x1 = shape.centerX + shape.radius;
            y1 = shape.centerY + shape.radius;
        } else if (shape.x0 !== undefined && shape.y0 !== undefined && shape.x1 !== undefined && shape.y1 !== undefined) {
            // Ellipse mode: direct coordinates
            x0 = Number(shape.x0);
            y0 = Number(shape.y0);
            x1 = Number(shape.x1);
            y1 = Number(shape.y1);
        } else {
            throw new Error('Circle shape requires either (centerX, centerY, radius) or (x0, y0, x1, y1)');
        }

        return {
            type: 'circle',
            xref: this.resolveReference(shape.xRef, 'x'),
            yref: this.resolveReference(shape.yRef, 'y'),
            x0,
            y0,
            x1,
            y1,
            line: this.transformLineStyle(shape.line),
            fillcolor: shape.fillColor ?? (shape.line?.color ? `${shape.line.color}20` : 'rgba(128, 128, 128, 0.2)')
        };
    }

    private createPath(shape: PathShape): any {
        return {
            type: 'path',
            path: shape.path,
            xref: this.resolveReference(shape.xRef, 'x'),
            yref: this.resolveReference(shape.yRef, 'y'),
            line: this.transformLineStyle(shape.line),
            fillcolor: shape.fillColor
        };
    }

    private resolveReference(reference: string | undefined, fallback: 'x' | 'y' | 'paper'): string {
        return reference ?? fallback;
    }

    private transformLineStyle(line?: ChartShape['line']): any {
        if (!line) {
            return {
                color: 'rgba(0, 0, 0, 0.5)',
                width: 2,
                dash: 'solid'
            };
        }

        return {
            color: line.color ?? 'rgba(0, 0, 0, 0.5)',
            width: line.width ?? 2,
            dash: line.dash ?? 'solid'
        };
    }
}