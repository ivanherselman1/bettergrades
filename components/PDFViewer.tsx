import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File;
  onPageChange: (e: { currentPage: number }) => void;
  selectedPages: Set<number>;
  onPageSelect: (pageNumber: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onPageChange, selectedPages, onPageSelect }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  const containerRef = React.useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const changePage = useCallback((offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      onPageChange({ currentPage: newPageNumber });
      return newPageNumber;
    });
  }, [onPageChange]);

  useEffect(() => {
    const updateContainerDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateContainerDimensions();
    window.addEventListener('resize', updateContainerDimensions);

    return () => window.removeEventListener('resize', updateContainerDimensions);
  }, []);

  const adjustScale = (width: number, height: number) => {
    const containerAspectRatio = containerDimensions.width / containerDimensions.height;
    const pageAspectRatio = width / height;

    if (pageAspectRatio > containerAspectRatio) {
      // Page is wider than container
      setScale((containerDimensions.width * 0.9) / width);
    } else {
      // Page is taller than container
      setScale((containerDimensions.height * 0.9) / height);
    }
  };

  if (!file) {
    return <div>No file selected</div>;
  }

  // New function to handle page selection
  const handlePageSelect = (pageNum: number) => {
    onPageSelect(pageNum);
  };

  return (
    <div className="flex h-full">
      <div className="w-1/5 h-full overflow-hidden flex flex-col">
        <div className="flex-grow overflow-y-auto border-r border-gray-200 p-2">
          {Array.from(new Array(numPages), (el, index) => (
            <div
              key={`thumb-${index + 1}`}
              className={`thumbnail cursor-pointer mb-2 ${
                pageNumber === index + 1 ? 'ring-2 ring-blue-500' : ''
              } ${
                selectedPages.has(index + 1) ? 'border-2 border-green-500' : 'border border-gray-300'
              }`}
              onClick={() => {
                setPageNumber(index + 1);
                handlePageSelect(index + 1);
              }}
            >
              <Document file={file}>
                <Page pageNumber={index + 1} scale={0.1} />
              </Document>
            </div>
          ))}
        </div>
      </div>
      <div className="w-4/5 h-full overflow-hidden flex flex-col" ref={containerRef}>
        <div className="flex-grow overflow-y-auto p-4 flex items-center justify-center">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              onLoadSuccess={({ width, height }) => adjustScale(width, height)}
            />
          </Document>
        </div>
        <div className="p-4 flex justify-between items-center border-t border-gray-200">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => changePage(-1)}
          >
            Previous
          </button>
          <div>
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>-</button>
            <span className="mx-2">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))}>+</button>
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            type="button"
            disabled={pageNumber >= (numPages || 0)}
            onClick={() => changePage(1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
