// src/components/PreviewComponent.js
import React, { useRef, useEffect, useState } from 'react';

const PreviewComponent = ({ html, javascript, width, height, suppressErrors = false, executeJavaScript = true }) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [customAlert, setCustomAlert] = useState(null);

  useEffect(() => {
    const iframeContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
          </style>
          ${suppressErrors ? `
            <script>
              window.onerror = function(message, source, lineno, colno, error) {
                console.log('Suppressed error:', message);
                return true;
              };
              console.error = console.warn = console.log = function() {};
            </script>
          ` : ''}
          <script>
            function handleImageError(img) {
              img.onerror = null;
              img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
            }
          </script>
        </head>
        <body>
          ${html.replace(/<img/g, '<img onerror="handleImageError(this)"')}
          ${executeJavaScript ? `
            <script>
              // Override alert and confirm
              window.alert = function(message) {
                window.parent.postMessage({ type: 'alert', message: message }, '*');
              };
              window.confirm = function(message) {
                window.parent.postMessage({ type: 'confirm', message: message }, '*');
                return false;
              };
              ${javascript}
            </script>
          ` : ''}
        </body>
      </html>
    `;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = iframeContent;
    }

    const handleMessage = (event) => {
      if (event.source === iframeRef.current.contentWindow && event.data && (event.data.type === 'alert' || event.data.type === 'confirm')) {
        setCustomAlert(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [html, javascript, suppressErrors, executeJavaScript]);

  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [width, height]);

  const handleAlertClose = () => {
    setCustomAlert(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${width}px`,
        height: `${height}px`,
      }}>
        <iframe
          ref={iframeRef}
          title="Page Preview"
          className="w-full h-full border-none pointer-events-none"
          sandbox={executeJavaScript ? "allow-scripts" : ""}
        />
        {customAlert && (
          <div className="absolute inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 text-gray-200 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {customAlert.type === 'alert' ? 'Alert' : 'Confirm'}
              </h3>
              <p className="mb-6">{customAlert.message}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleAlertClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  OK
                </button>
                {customAlert.type === 'confirm' && (
                  <button
                    onClick={handleAlertClose}
                    className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewComponent;