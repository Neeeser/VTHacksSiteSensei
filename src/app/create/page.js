'use client';
import React, { useState, useEffect, useRef } from 'react';
import PreviewComponent from '../../components/PreviewComponent';
import { useUser } from '@auth0/nextjs-auth0/client';
import { motion, AnimatePresence } from 'framer-motion';
import EditChatbox from '../../components/EditChatbox';

export default function CreatePage() {
  const { user, isLoading: userLoading } = useUser();
  const [pageName, setPageName] = useState('');
  const [htmlContent, setHtmlContent] = useState("");
  const [jsContent, setJsContent] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('FREE_MODEL');
  const [userRole, setUserRole] = useState('free');
  const [userNickname, setUserNickname] = useState(null);
  const [isPageGenerated, setIsPageGenerated] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 500, height: 500 });
  const previewContainerRef = useRef(null);
  const [placeholderText, setPlaceholderText] = useState('Describe the content you want to generate...');
  const [initialLoad, setInitialLoad] = useState(true);
  const [initialDelayPassed, setInitialDelayPassed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [enhancedPromptContent, setEnhancedPromptContent] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEditChat, setShowEditChat] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  
  const placeholderExamples = [
    'Generate a compound interest calculator',
    'Create a resume website',
    'Design a shopping page for dog food',
    'Build a weather dashboard',
    'Develop a recipe finder app',
    'Create an interactive quiz game',
    'Design a fitness tracking app',
    'Build a personal budget planner',
    'Generate a portfolio showcase',
    'Create a virtual plant care assistant'
  ];

  const getRandomTypingSpeed = () => {
    return Math.floor(Math.random() * (180 - 80 + 1) + 80); // Random speed between 80ms and 180ms
  };


  useEffect(() => {
    let timer;

  
    if (initialLoad) {
      timer = setTimeout(() => {
        setInitialLoad(false);
        setInitialDelayPassed(true);
        setIsTyping(false); // Start by deleting the initial placeholder

      }, 5000);
    } else if (initialDelayPassed) {
      const currentExample = placeholderExamples[currentExampleIndex];
  
      if (isTyping) {
        if (placeholderText !== currentExample) {
          timer = setTimeout(() => {
            setPlaceholderText(currentExample.slice(0, placeholderText.length + 1));
          }, getRandomTypingSpeed());
        } else {
          timer = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      } else {
        if (placeholderText.length > 0) {
          timer = setTimeout(() => {
            setPlaceholderText(placeholderText.slice(0, -1));
          }, 50);
        } else {

          setCurrentExampleIndex((prevIndex) => (prevIndex + 1) % placeholderExamples.length);
          setIsTyping(true);
        }
      }
    }
  
    return () => clearTimeout(timer);
  }, [placeholderText, currentExampleIndex, isTyping, initialLoad, initialDelayPassed]);

  useEffect(() => {
    const updatePreviewSize = () => {
      if (previewContainerRef.current) {
        const { width, height } = previewContainerRef.current.getBoundingClientRect();
        setPreviewSize({ width, height });
      }
    };

    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
    return () => window.removeEventListener('resize', updatePreviewSize);
  }, []);


  // New state to track form validity
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const response = await fetch('/api/getUserRole');
          const data = await response.json();
          setUserRole(data.role);
          setUserNickname(data.nickname);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);


  const handleEditSubmit = (editedHtml, editedJavascript) => {
    setHtmlContent(editedHtml);
    setJsContent(editedJavascript);
    setMessage('Content updated successfully');
  };


  useEffect(() => {
    // Check if both pageName and promptContent are filled
    setIsFormValid(pageName.trim() !== '' && promptContent.trim() !== '');
  }, [pageName, promptContent]);

  const handleResize = () => {
    setIsSmallScreen(window.innerWidth < 800);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePageNameChange = (e) => {
    const value = e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    setPageName(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    setMessage('');
    setIsPageGenerated(false);

    try {
      let finalPrompt = promptContent;
      let enhancedPrompt = null;
      
      if (enhancePrompt) {
        setIsEnhancing(true);
        const enhanceResponse = await fetch('/api/enhancePrompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptContent }),
        });
        const enhanceData = await enhanceResponse.json();
        if (enhanceData.enhancedPrompt) {
          finalPrompt = enhanceData.enhancedPrompt;
          enhancedPrompt = enhanceData.enhancedPrompt;
          setEnhancedPromptContent(finalPrompt);
        }
        setIsEnhancing(false);
      }
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, model: selectedModel }),
      });
      const data = await response.json();
      
      if (data.html && data.javascript) {
        setHtmlContent(data.html);
        setJsContent(data.javascript);
        setMessage('Content generated successfully');
        
        const storeResponse = await fetch('/api/update-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: pageName,
            html: data.html,
            javascript: data.javascript,
            auth0Id: user ? user.sub : null,
            model: selectedModel,
            originalPrompt: promptContent,
            enhancedPrompt: enhancedPrompt,
            createdAt: new Date().toISOString()
          }),
        });
        const storeData = await storeResponse.json();
        if (storeData.message) {
          setMessage(prevMessage => `${prevMessage}. ${storeData.message}`);
        }
        setIsPageGenerated(true);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(error.message || 'Error generating content');
      setIsEnhancing(false);
    } finally {
      setIsLoading(false);
    }
  };
  const canUseModel = (model) => {
    if (model === 'FREE_MODEL') return true;
    return userRole === 'admin' || userRole === 'paid';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className={`max-w-6xl mx-auto ${isSmallScreen ? 'flex flex-col' : 'flex flex-row'} gap-8`}>
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex-1"
        >
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary"
          >
            Dynamic Content Generator
          </motion.h1>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8"
          >
            <h2 className="text-2xl font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">Generate a Webpage with AI</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pageName" className="block text-text-light-primary dark:text-text-dark-primary mb-2">Page Name:</label>
                <input
                  id="pageName"
                  type="text"
                  value={pageName}
                  onChange={handlePageNameChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary"
                  placeholder="Enter URL-compliant page name (a-z, 0-9, -)"
                  pattern="^[a-z0-9-]+$"
                  title="Only lowercase letters, numbers, and hyphens are allowed"
                />
              </div>
              <div>
                <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">Select Model:</label>
                <div className="flex gap-4">
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
                      <span className="text-text-light-secondary dark:text-text-dark-secondary">{model.split('_')[0].toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="promptContent" className="block text-text-light-primary dark:text-text-dark-primary mb-2">Prompt:</label>
                <textarea
                  id="promptContent"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  rows={5}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary"
                  placeholder={initialLoad || !initialDelayPassed ? "Describe the content you want to generate..." : placeholderText}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enhancePrompt"
                  checked={enhancePrompt}
                  onChange={(e) => setEnhancePrompt(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enhancePrompt" className="text-text-light-secondary dark:text-text-dark-secondary">Enhance prompt before generation</label>
              </div>
              <AnimatePresence>
                {enhancePrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="enhancedPrompt" className="block text-text-light-primary dark:text-text-dark-primary mb-2">Enhanced Prompt:</label>
                    <motion.div
                      animate={isEnhancing ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                      transition={isEnhancing ? { duration: 1, repeat: Infinity } : {}}
                    >
                      <textarea
                        id="enhancedPrompt"
                        value={enhancedPromptContent}
                        readOnly
                        rows={5}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary"
                        placeholder={isEnhancing ? "Enhancing prompt..." : "Enhanced prompt will appear here"}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button 
                type="submit" 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn btn-primary w-full ${(!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Content'}
              </motion.button>
            </form>
            {message && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mt-4 text-green-600 dark:text-green-400"
              >
                {message}
              </motion.p>
            )}
          </motion.div>
          {isPageGenerated && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-2 text-text-light-primary dark:text-text-dark-primary">View Created Page</h2>
              <p className="text-text-light-primary dark:text-text-dark-primary">
                Your page is now available at:{' '}
                <motion.a 
                  href={`page/${userNickname || 'anon'}/${pageName}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  page/{userNickname || 'anon'}/{pageName}
                </motion.a>
              </p>
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="w-full lg:w-1/2"
        >
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6" style={{ height: '600px' }}>
            <h2 className="text-xl font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">Preview</h2>
            <div ref={previewContainerRef} style={{ height: 'calc(100% - 2rem)' }}>
              <PreviewComponent 
                html={htmlContent}
                javascript={jsContent}
                width={previewSize.width}
                height={previewSize.height}
              />
            </div>
          </div>
          

         {/* New Edit Chatbox Component */}
         {user && isPageGenerated && (
            <EditChatbox
              isVisible={true}
              onSubmit={handleEditSubmit}
              className="mt-6"
              currentHtml={htmlContent}
              currentJavascript={jsContent}
              selectedModel={selectedModel}
              pageName={pageName}
              auth0Id={user.sub}
              userNickname={userNickname}
            />
         )}
        </motion.div>
      </div>
    </motion.div>
  );
}