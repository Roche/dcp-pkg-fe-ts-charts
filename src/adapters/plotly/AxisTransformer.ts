import { AxisConfig } from "../../types/config";

/**
 * Pixel-based spacing for extra axes (instead of hard-coded normalized fractions).
 * This ensures visually consistent spacing across different chart widths.
 */
const AXIS_WIDTH_NO_TITLE_PX = 40; // Space for tick labels only
const AXIS_WIDTH_WITH_TITLE_PX = 90; // Space for tick labels + title

/**
 * Get pixel-based width for an axis.
 */
function axisWidthPx(axis: AxisConfig): number {
    return axis.title ? AXIS_WIDTH_WITH_TITLE_PX : AXIS_WIDTH_NO_TITLE_PX;
}

/**
 * Convert pixel width to normalized domain fraction.
 * Uses the plot area width (accounting for margins) to calculate fractions.
 * @param pixelWidth - Width in pixels
 * @param chartWidth - Total chart width (from layout.width)
 * @param marginLeft - Left margin in pixels (from layout.margin.l)
 * @param marginRight - Right margin in pixels (from layout.margin.r)
 * @returns Normalized fraction (0 to 1)
 */
function pxToDomainFraction(
    pixelWidth: number,
    chartWidth: number,
    marginLeft: number,
    marginRight: number
): number {
    const plotAreaWidth = chartWidth - marginLeft - marginRight;
    if (plotAreaWidth <= 0) {
        return 0;
    }
    return pixelWidth / plotAreaWidth;
}

export class AxisTransformer {

    transformAxes(axes: AxisConfig[] | undefined, layout: any): Record<string, string> {
        const axisIdToPlotlyKey: Record<string, string> = {};

        if (!axes || axes.length === 0) {
            return axisIdToPlotlyKey;
        }

        // Extract layout dimensions and margins for pixel-to-fraction conversion
        const chartWidth = layout?.width ?? 1000; // Default fallback
        const marginLeft = layout?.margin?.l ?? 40;
        const marginRight = layout?.margin?.r ?? 40;

        // Domain shrinkage: only axes beyond the first on each side require extra space.
        // If there is exactly one axis on the left and one on the right, no shrinkage is needed.
        const leftYAxes = axes.filter(a => a.position === 'left');
        const rightYAxes = axes.filter(a => a.position === 'right');
        const extraLeftAxes = leftYAxes.slice(1);
        const extraRightAxes = rightYAxes.slice(1);

        // Calculate domain shrinkage in pixels, then convert to fractions
        const extraLeftPixels = extraLeftAxes.reduce((sum, a) => sum + axisWidthPx(a), 0);
        const extraRightPixels = extraRightAxes.reduce((sum, a) => sum + axisWidthPx(a), 0);

        const domainLeftFraction = pxToDomainFraction(extraLeftPixels, chartWidth, marginLeft, marginRight);
        const domainRightFraction = pxToDomainFraction(extraRightPixels, chartWidth, marginLeft, marginRight);

        const domainLeft = domainLeftFraction;
        const domainRight = 1 - domainRightFraction;

        let xAxisCount = 0, yAxisCount = 0;
        let topCount = 0, bottomCount = 0;
        let leftCount = 0, rightCount = 0;
        // Running cumulative offsets (in domain fractions) used to place each extra axis
        // just outside the previous one.
        let extraLeftOffsetFraction = 0;
        let extraRightOffsetFraction = 0;
        let primaryYAssigned = false;

        for (const axis of axes) {
            if (axis.position === 'left' || axis.position === 'right') {
                const isPrimaryY = !primaryYAssigned;
                if (isPrimaryY) primaryYAssigned = true;

                const suffix = yAxisCount === 0 ? '' : String(yAxisCount + 1);
                axisIdToPlotlyKey[axis.id] = 'y' + suffix;

                // Only axes beyond the first on their side need an explicit position so they
                // sit outside the domain. The first axis on each side lives in the natural margin.
                let extraPosition: number | undefined;
                if (axis.position === 'left') {
                    if (leftCount > 0) {
                        const axisWidthFraction = pxToDomainFraction(axisWidthPx(axis), chartWidth, marginLeft, marginRight);
                        extraLeftOffsetFraction += axisWidthFraction;
                        // Place extra left axes relative to the current plot-domain left edge.
                        extraPosition = domainLeft - extraLeftOffsetFraction;
                    }
                    leftCount++;
                } else {
                    if (rightCount > 0) {
                        const axisWidthFraction = pxToDomainFraction(axisWidthPx(axis), chartWidth, marginLeft, marginRight);
                        extraRightOffsetFraction += axisWidthFraction;
                        // Place extra right axes relative to the current plot-domain right edge.
                        extraPosition = domainRight + extraRightOffsetFraction;
                    }
                    rightCount++;
                }

                layout[`yaxis${suffix}`] = this.buildAxis(axis, !isPrimaryY, 'y', extraPosition);
                yAxisCount++;

            } else if (axis.position === 'top' || axis.position === 'bottom') {
                const xCount = topCount + bottomCount;
                const suffix = xAxisCount === 0 ? '' : String(xAxisCount + 1);
                axisIdToPlotlyKey[axis.id] = 'x' + suffix;

                const sideIdx = axis.position === 'bottom' ? bottomCount : topCount;
                let extraPosition: number | undefined;
                if (xCount > 0) {
                    // For x-axes, use pixel-based spacing as well
                    const pixelOffset = sideIdx * AXIS_WIDTH_NO_TITLE_PX;
                    const chartHeight = layout?.height ?? 1000;
                    const marginTop = layout?.margin?.t ?? 40;
                    const marginBottom = layout?.margin?.b ?? 40;
                    const plotAreaHeight = chartHeight - marginTop - marginBottom;
                    
                    // For x-axes, calculate offset as fraction of plot area height
                    const fractionOffset = plotAreaHeight > 0 ? pixelOffset / plotAreaHeight : 0;
                    
                    extraPosition = axis.position === 'bottom'
                        ? fractionOffset
                        : 1 - fractionOffset;
                }

                layout[`xaxis${suffix}`] = this.buildAxis(axis, xCount > 0, 'x', extraPosition);

                if (axis.position === 'top') topCount++;
                else bottomCount++;
                xAxisCount++;
            }
        }

        // Apply domain after the loop — doing it before would be overwritten by buildAxis
        if (domainLeft > 0 || domainRight < 1) {
            layout.xaxis = layout.xaxis ?? {};
            layout.xaxis.domain = [domainLeft, domainRight];
        }

        return axisIdToPlotlyKey;
    }

    private buildAxis(axis: AxisConfig, isExtra: boolean, axisType: 'x' | 'y', extraPosition?: number): any {
        const plotlyAxis: any = {};

        if (axis.title) {
            plotlyAxis.title = { text: axis.title };
        }
        const isLogY = axisType === 'y' && axis.type === 'log' && !axis.categoryOrder?.length;
        if (axisType === 'y' && !axis.categoryOrder?.length) {
            plotlyAxis.type = axis.type ?? 'linear';
        }
        this.applyRange(plotlyAxis, axis, isLogY);
        if (axis.color) {
            plotlyAxis.color = axis.color;
        }
        if (axis.position) {
            plotlyAxis.side = axis.position;
            if (axis.position === 'left' || axis.position === 'right') {
                plotlyAxis.automargin = true;
            }
        }

        if (axis.categoryOrder && axis.categoryOrder.length > 0) {
            plotlyAxis.categoryorder = 'array';
            plotlyAxis.categoryarray = axis.categoryOrder;
            plotlyAxis.type = 'category';
        }

        this.applyGridlines(plotlyAxis, axis);

        if (isExtra) {
            plotlyAxis.overlaying = axisType;
            if (extraPosition !== undefined) {
                // Plotly only applies explicit axis positions when anchor is free.
                plotlyAxis.anchor = 'free';
                plotlyAxis.position = extraPosition;
            }
        }

        return plotlyAxis;
    }

    private applyRange(plotlyAxis: any, axis: AxisConfig, isLogY: boolean): void {
        if (isLogY && Array.isArray(axis.range)) {
            const [min, max] = axis.range;
            if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > min) {
                plotlyAxis.range = [Math.log10(min), Math.log10(max)];
            }
        } else if (!isLogY && axis.range) {
            plotlyAxis.range = axis.range;
        }
    }

    private applyGridlines(plotlyAxis: any, axis: AxisConfig): void {
        if (axis.gridlines) {
            if (axis.gridlines.show !== undefined) {
                plotlyAxis.showgrid = axis.gridlines.show;
            }
            if (axis.gridlines.width !== undefined) {
                plotlyAxis.gridwidth = axis.gridlines.width;
            }
            if (axis.gridlines.color !== undefined) {
                plotlyAxis.gridcolor = axis.gridlines.color;
            }
        } else {
            plotlyAxis.showgrid = false;
        }
    }
}