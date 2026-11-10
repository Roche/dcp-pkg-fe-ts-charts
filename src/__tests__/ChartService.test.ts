import { ChartService } from '../ChartService';
import { ChartAdapter } from '../types/config';

describe('ChartService', () => {
    it('should delegate deselect to the adapter', () => {
        const adapter: ChartAdapter = {
            render: jest.fn(),
            destroy: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            setInteractionMode: jest.fn(),
            setSelectMode: jest.fn(),
            deselect: jest.fn()
        };

        const service = new ChartService('chart-1', adapter);

        service.deselect();

        expect(adapter.deselect).toHaveBeenCalledTimes(1);
    });
});
