import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// EditChatbox component for editing page content
const EditChatbox = ({
  isVisible,
  onSubmit,
  className = '',
  animationProps = {},
  title = 'Edit Your Page',
  description = 'Want to make changes? Describe how to modify your page.',
  submitButtonText = 'Submit Changes',
  placeholder = 'Describe the changes you want to make...',
  currentHtml,
  currentJavascript,
  selectedModel,
  pageName,
  auth0Id,
  userNickname
}) => {
  // State for edit message, loading status, and error
  const [editMessage, setEditMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      // First, edit the content
      const editResponse = await fetch('/api/edit-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editPrompt: editMessage,
          currentHtml,
          currentJavascript,
          model: selectedModel
        }),
      });
      const editData = await editResponse.json();
     
      if (!editResponse.ok) {
        throw new Error(editData.error || 'Failed to edit content');
      }

      // Then, update the content in the database
      const updateResponse = await fetch('/api/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageName,
          html: editData.html,
          javascript: editData.javascript,
          auth0Id: auth0Id,
          model: selectedModel,
          originalPrompt: editMessage,
          enhancedPrompt: null,
          createdAt: new Date().toISOString()
        }),
      });
      const updateData = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Failed to update content in database');
      }

      // Call the onSubmit callback with updated content
      onSubmit(editData.html, editData.javascript);
      setEditMessage('');
    } catch (error) {
      console.error('Error editing and updating content:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the component
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, ...animationProps.initial }}
          animate={{ opacity: 1, y: 0, ...animationProps.animate }}
          exit={{ opacity: 0, y: 20, ...animationProps.exit }}
          transition={{ duration: 0.5, ...animationProps.transition }}
          className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 ${className}`}
        >
          {/* Title */}
          <h3 className="text-lg font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">
            {title}
          </h3>
          {/* Description */}
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
            {description}
          </p>
          {/* Textarea for edit message */}
          <textarea
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary mb-4"
            rows={4}
          />
          {/* Error message display */}
          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}
          {/* Submit button with animation */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn btn-primary w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Editing...' : submitButtonText}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditChatbox;