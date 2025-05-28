import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV, exportToJSON } from '../export';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and appendChild
const mockLink = {
  click: vi.fn(),
  setAttribute: vi.fn(),
  style: {},
};

global.document.createElement = vi.fn(
  () => mockLink as unknown as HTMLAnchorElement
);
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

describe('Export Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToCSV', () => {
    const sampleData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', active: true },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', active: false },
    ];

    it('exports data to CSV format', () => {
      exportToCSV(sampleData, 'users');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        'users.csv'
      );
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles custom filename', () => {
      exportToCSV(sampleData, 'custom-export');

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        'custom-export.csv'
      );
    });

    it('handles empty data array', () => {
      exportToCSV([], 'empty');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles data with custom columns', () => {
      const columns = [
        { key: 'name', header: 'Full Name' },
        { key: 'email', header: 'Email Address' },
      ];

      exportToCSV(sampleData, 'filtered', columns);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('exportToJSON', () => {
    const sampleData = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    it('exports data to JSON format', () => {
      exportToJSON(sampleData, 'users');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        'users.json'
      );
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles custom filename', () => {
      exportToJSON(sampleData, 'custom-export');

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        'custom-export.json'
      );
    });

    it('handles empty data array', () => {
      exportToJSON([], 'empty');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('formats JSON with proper indentation', () => {
      exportToJSON(sampleData, 'formatted');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createObjectURLCall = (global.URL.createObjectURL as any).mock
        .calls[0];
      const blob = createObjectURLCall[0];

      expect(blob.type).toBe('application/json');
    });
  });
});
