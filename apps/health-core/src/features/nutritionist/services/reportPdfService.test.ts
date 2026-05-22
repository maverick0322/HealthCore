import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockHtml2Canvas,
  mockAddImage,
  mockAddPage,
  mockSave,
  mockJsPdf,
} = vi.hoisted(() => {
  const addImage = vi.fn();
  const addPage = vi.fn();
  const save = vi.fn();
  const html2Canvas = vi.fn();
  const jsPdf = vi.fn(function MockJsPdf() {
    return {
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      addImage,
      addPage,
      save,
    };
  });

  return {
    mockHtml2Canvas: html2Canvas,
    mockAddImage: addImage,
    mockAddPage: addPage,
    mockSave: save,
    mockJsPdf: jsPdf,
  };
});

vi.mock('html2canvas', () => ({
  default: mockHtml2Canvas,
}));

vi.mock('jspdf', () => ({
  jsPDF: mockJsPdf,
}));

import { exportNutritionistReportPdf } from './reportPdfService';

describe('reportPdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHtml2Canvas.mockResolvedValue({
      width: 1200,
      height: 1800,
      toDataURL: () => 'data:image/png;base64,abc123',
    });
  });

  it('renders the element and saves a pdf file', async () => {
    const element = document.createElement('div');

    await exportNutritionistReportPdf({
      element,
      fileName: 'report.pdf',
    });

    expect(mockHtml2Canvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ backgroundColor: '#ffffff', scale: 2 })
    );
    expect(mockJsPdf).toHaveBeenCalledTimes(1);
    expect(mockAddImage).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('report.pdf');
  });
});
