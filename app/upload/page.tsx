'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('../../components/PDFViewer'), { ssr: false });

function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State declarations
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState('');
  const [documentType, setDocumentType] = useState('PDF');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [manualPageRanges, setManualPageRanges] = useState('');
  const [parsedPages, setParsedPages] = useState<Set<number>>(new Set());

  // Callbacks
  const parsePageRanges = useCallback((rangeString: string): Set<number> => {
    const pages = new Set<number>();
    const ranges = rangeString.split(',').map(range => range.trim());
    
    ranges.forEach(range => {
      if (range.includes('-')) {
        const [startStr, endStr] = range.split('-');
        const start = parseInt(startStr ?? '', 10);
        const end = parseInt(endStr ?? '', 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            pages.add(i);
          }
        }
      } else {
        const page = parseInt(range, 10);
        if (!isNaN(page)) {
          pages.add(page);
        }
      }
    });

    return pages;
  }, []);

  const updateSelectedPages = useCallback((newPages: Set<number>) => {
    setSelectedPages(newPages);
    // Update manualPageRanges based on the new selection
    const rangeString = Array.from(newPages)
      .sort((a, b) => a - b)
      .reduce((acc, page, index, array) => {
        if (index === 0) return `${page}`;
        const prevPage = array[index - 1];
        if (prevPage !== undefined && page === prevPage + 1) {
          if (!acc.endsWith('-')) acc += '-';
        } else {
          if (acc.endsWith('-')) acc += `${prevPage},${page}`;
          else acc += `,${page}`;
        }
        return acc;
      }, '');
    setManualPageRanges(rangeString);
  }, []);

  // Effects
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const parsedPages = parsePageRanges(manualPageRanges);
    setParsedPages(parsedPages);
    setSelectedPages(prevSelected => {
      const newSelected = new Set([...Array.from(parsedPages), ...Array.from(prevSelected)]);
      return newSelected;
    });
  }, [manualPageRanges, parsePageRanges]);

  // Event handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handlePageClick = (e: React.MouseEvent, pageNumber: number) => {
    e.preventDefault(); // Prevent default button behavior
    setSelectedPages((prevSelectedPages) => {
      const newSelectedPages = new Set(prevSelectedPages);
      if (newSelectedPages.has(pageNumber)) {
        newSelectedPages.delete(pageNumber);
      } else {
        newSelectedPages.add(pageNumber);
      }
      return newSelectedPages;
    });
  };

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('tags', tags);
    
    // Combine manual page ranges and selected pages
    const selectedPagesString = Array.from(selectedPages).join(',');
    const combinedPageRanges = manualPageRanges
      ? `${manualPageRanges},${selectedPagesString}`
      : selectedPagesString;
    
    formData.append('pageRanges', combinedPageRanges || 'all');
    formData.append('documentType', documentType);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log(result);
  };

  const handlePageChange = (e: { currentPage: number }) => {
    setCurrentPage(e.currentPage);
  };

  const handlePageSelect = (pageNumber: number) => {
    setSelectedPages((prevPages: Set<number>) => {
      const newPages = new Set(prevPages);
      if (newPages.has(pageNumber)) {
        newPages.delete(pageNumber);
      } else {
        newPages.add(pageNumber);
      }
      return newPages;
    });
  };

  const handleManualPageRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualPageRanges(e.target.value);
  };

  // Render logic
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-900 p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Upload Documents</h1>
        <form className="space-y-4 md:space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Files:</label>
            <input 
              type="file" 
              accept="application/pdf" 
              multiple 
              onChange={handleFileChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tags (comma-separated):</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Document Type:</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Page Ranges (e.g., 1-10, 12-16):
            </label>
            <input
              type="text"
              value={manualPageRanges}
              onChange={handleManualPageRangeChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Enter page ranges or use the PDF viewer to select pages"
            />
          </div>
        </form>
      </header>
      
      <main className="flex flex-1 overflow-hidden">
        <div className="w-4/5 h-full">
          {files.length > 0 && files[0] ? (
            <PDFViewer 
              file={files[0]} 
              onPageChange={handlePageChange}
              selectedPages={selectedPages}
              onPageSelect={handlePageSelect}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No file selected. Please upload a PDF file.</p>
            </div>
          )}
        </div>
        <div className="w-1/5 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
          <h2 className="font-bold mb-2 text-gray-900 dark:text-white">Selected Pages</h2>
          <ul className="text-gray-700 dark:text-gray-300">
            {Array.from(selectedPages).map((pageNum) => (
              <li key={pageNum}>Page {pageNum}</li>
            ))}
          </ul>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-900 p-4">
        <button 
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleUpload}
        >
          Upload
        </button>
      </footer>
    </div>
  );
}

export default UploadPage;
