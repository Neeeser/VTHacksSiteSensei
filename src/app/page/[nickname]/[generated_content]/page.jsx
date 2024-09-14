'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicContent from '@/components/DynamicContent';
import Sidebar from '@/components/Sidebar';
import EditChatbox from '@/components/EditChatbox';
import { Menu, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Tooltip from '@/components/Tooltip';

export default function DynamicPage({ params }) {
  const { nickname, generated_content } = params;
  const [content, setContent] = useState({ 
    html: '', 
    javascript: '', 
    original_prompt: '', 
    enhanced_prompt: '' 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revisionError, setRevisionError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('FREE_MODEL');
  const [userRole, setUserRole] = useState('free');
  const [revisions, setRevisions] = useState([]);
  const [currentRevisionIndex, setCurrentRevisionIndex] = useState(0);
  const [showEditHint, setShowEditHint] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    async function fetchContentAndCheckUser() {
      try {
        setIsLoading(true);
        setError(null);
        setRevisionError(null);

        if (!nickname || !generated_content) {
          throw new Error('Missing nickname or page name');
        }

        const contentResponse = await fetch(`/api/content?nickname=${nickname}&pageName=${generated_content}`);
        if (!contentResponse.ok) {
          throw new Error(`HTTP error! status: ${contentResponse.status}`);
        }
        const contentData = await contentResponse.json();

        setContent({
          html: contentData.html,
          javascript: contentData.javascript,
          original_prompt: contentData.original_prompt,
          enhanced_prompt: contentData.enhanced_prompt
        });
        setSelectedModel(contentData.model_used || 'FREE_MODEL');

        // Fetch revisions
        try {
          const revisionsResponse = await fetch(`/api/get-page-revisions?nickname=${nickname}&pageName=${generated_content}`);
          if (revisionsResponse.ok) {
            const revisionsData = await revisionsResponse.json();
            setRevisions([contentData, ...revisionsData]);
          } else {
            const errorData = await revisionsResponse.json();
            setRevisionError(errorData.error || 'Failed to fetch revisions');
          }
        } catch (revisionError) {
          console.error('Error fetching revisions:', revisionError);
          setRevisionError('Failed to fetch revisions');
        }

        // Check if the current user is the creator
        if (user) {
          setIsCreator(user.nickname === nickname);
          
          // Fetch user role
          try {
            const roleResponse = await fetch('/api/getUserRole');
            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              setUserRole(roleData.role);
            } else {
              console.error('Failed to fetch user role');
            }
          } catch (roleError) {
            console.error('Error fetching user role:', roleError);
          }
        }
      } catch (error) {
        console.error('Error fetching content or user data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContentAndCheckUser();
  }, [nickname, generated_content, user]);

  const tooltipContent = (
    <div>
      <p><strong>Original Prompt:</strong> {content.original_prompt}</p>
      {content.enhanced_prompt !== "Enhanced prompt not available" && (
        <p><strong>Enhanced Prompt:</strong> {content.enhanced_prompt}</p>
      )}
    </div>
  );

  const handleEditSubmit = async (newHtml, newJavascript) => {
    setContent({ html: newHtml, javascript: newJavascript });

    
    // Refresh revisions
    const revisionsResponse = await fetch(`/api/get-page-revisions?nickname=${nickname}&pageName=${generated_content}`);
    if (revisionsResponse.ok) {
      const revisionsData = await revisionsResponse.json();
      setRevisions([{ html: newHtml, javascript: newJavascript }, ...revisionsData]);
      setCurrentRevisionIndex(0);
    }
  };


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const canUseModel = (model) => {
    if (model === 'FREE_MODEL') return true;
    return userRole === 'admin' || userRole === 'paid';
  };

  const navigateRevision = (direction) => {
    const newIndex = currentRevisionIndex + direction;
    if (newIndex >= 0 && newIndex < revisions.length) {
      setCurrentRevisionIndex(newIndex);
      setContent(revisions[newIndex]);
    }
  };

  const handleDownload = () => {
    const baseUrl = '/api/download'; // Adjust if your endpoint base URL differs
    // Determine if a specific revision is being viewed
    const revisionId = currentRevisionIndex > 0 ? revisions[currentRevisionIndex].id : null;
    const queryParams = `?nickname=${encodeURIComponent(nickname)}&pageName=${encodeURIComponent(generated_content)}${revisionId ? `&revisionId=${revisionId}` : ''}`;
    const downloadUrl = `${baseUrl}${queryParams}`;
  
    // Create a temporary anchor tag to initiate download
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.setAttribute('download', ''); // You can specify a filename here if needed
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  useEffect(() => {
    if (isCreator && !isLoading) {
      setShowEditHint(true);
      const timer = setTimeout(() => {
        setShowEditHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCreator, isLoading]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--navbar-height))] bg-background-light dark:bg-background-dark">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500 mb-2">{error}</p>
          <p>The requested page could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-[calc(100vh-var(--navbar-height))] bg-background-light dark:bg-background-dark">
      <div className="w-[97.5%] h-[90%] mt-[1.5%] mb-[1%] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative">
        <div className="w-full h-full overflow-auto">
          <DynamicContent
            html={content.html}
            javascript={content.javascript}
          />
        </div>
        <div className="absolute bottom-4 right-4 z-40">
          <Tooltip content={tooltipContent}>
            <div className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200 cursor-help">
              <Info size={24} />
            </div>
          </Tooltip>
        </div>
        {isCreator && (
          <div className="absolute top-4 right-4 flex items-center">
            <AnimatePresence>
              {showEditHint && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="mr-2 bg-white dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary px-2 py-1 rounded shadow-md"
                >
                  Click to edit
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={toggleSidebar}
              className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              <Menu size={24} />
            </button>
          </div>
        )}
      </div>
      {revisionError && (
        <div className="mt-2 text-center text-red-500">
          Error loading revisions: {revisionError}
        </div>
      )}
      {!revisionError && revisions.length > 1 && (
        <div className="mt-2 flex items-center justify-center space-x-4">
          <button
            onClick={() => navigateRevision(1)}
            disabled={currentRevisionIndex === revisions.length - 1}
            className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-text-light-secondary dark:text-text-dark-secondary">
            Revision {currentRevisionIndex + 1} of {revisions.length}
          </span>
          <button
            onClick={() => navigateRevision(-1)}
            disabled={currentRevisionIndex === 0}
            className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
      {isCreator && (
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-text-light-primary dark:text-text-dark-primary">Select Model</h3>
          <div className="flex flex-col gap-2">
            {['FREE_MODEL', 'PRO_MODEL', 'ADVANCED_MODEL'].map((model) => (
              <label key={model} className={`flex items-center ${!canUseModel(model) ? 'opacity-50' : ''}`}>
                <input
                  type="radio"
                  name="model"
                  value={model}
                  checked={selectedModel === model}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!canUseModel(model)}
                  className="mr-2"
                />
                <span className="text-text-light-secondary dark:text-text-dark-secondary">
                  {model.split('_')[0].toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>
        <EditChatbox
          isVisible={true}
          onSubmit={handleEditSubmit}
          currentHtml={content.html}
          currentJavascript={content.javascript}
          selectedModel={selectedModel}
          pageName={generated_content}
          auth0Id={user ? user.sub : null}
          userNickname={nickname}
        />
        {isCreator && (
          <motion.button
            onClick={handleDownload}
            className="mt-4 btn btn-primary w-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Download
          </motion.button>
        )}
      </Sidebar>
    )}
  </div>
);
}