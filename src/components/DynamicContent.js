'use client';
import React, { useEffect, useRef, useState } from 'react';

const DynamicContent = ({ html, javascript, onInteraction }) => {
  const containerRef = useRef(null);
  const [jsError, setJsError] = useState(null);
  const [customAlert, setCustomAlert] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);
     
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <base target="_parent">
            <style>
              html, body {
                height: auto;
                min-height: 100%;
                margin: 0;
                padding: 0;
                overflow: visible;
              }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `);
      iframeDoc.close();

      iframe.onload = () => {
        // Add event listeners for interactions
        iframeDoc.body.addEventListener('click', (e) => {
          if (e.target.tagName === 'A' || e.target.closest('a')) {
            e.preventDefault();
            onInteraction && onInteraction(e);
          }
        }, true);
        iframeDoc.body.addEventListener('submit', (e) => {
          e.preventDefault();
          onInteraction && onInteraction(e);
        }, true);

        // Override window.alert and window.confirm
        iframe.contentWindow.alert = (message) => {
          setCustomAlert({ type: 'alert', message });
        };
        iframe.contentWindow.confirm = (message) => {
          setCustomAlert({ type: 'confirm', message });
          return false; // Default to canceling the action
        };

        // Execute JavaScript in a try-catch block
        if (javascript) {
          const script = iframeDoc.createElement('script');
          script.text = `
            try {
              (function() {
                ${javascript}
              })();
            } catch (error) {
              window.parent.postMessage({ type: 'jsError', message: error.message }, '*');
            }
          `;
          iframeDoc.body.appendChild(script);
        }
      };

      // Listen for error messages from the iframe
      const handleMessage = (event) => {
        if (event.data && event.data.type === 'jsError') {
          console.error('JavaScript Error:', event.data.message);
          setJsError(event.data.message);
        }
      };
      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [html, javascript, onInteraction]);

  const handleAlertClose = () => {
    setCustomAlert(null);
  };

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {jsError && (
        <div className="absolute bottom-2 right-2 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm">
          JavaScript Error: {jsError}
        </div>
      )}
      {customAlert && (
        <div className="absolute inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {customAlert.type === 'alert' ? 'Alert' : 'Confirm'}
            </h3>
            <p className="mb-6">{customAlert.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleAlertClose}
                className="btn btn-primary"
              >
                OK
              </button>
              {customAlert.type === 'confirm' && (
                <button
                  onClick={handleAlertClose}
                  className="btn bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicContent;