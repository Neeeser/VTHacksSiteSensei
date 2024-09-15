import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import PreviewComponent from './PreviewComponent';
import { Star, Trash2 } from 'lucide-react';

// Component for displaying a preview card of a page
const PagePreviewCard = ({ page, previewWidth = 1024, previewHeight = 576, userRole, onDelete, onFavorite }) => {
  // Function to get the image source for the user avatar
  const getImageSrc = (user) => {
    if (!user || !user.picture) return '/default_icon.png';
   
    const allowedDomains = [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      's.gravatar.com',
      'auth0.com'
    ];
   
    // Check if the user's picture URL is from an allowed domain
    if (allowedDomains.some(domain => user.picture.includes(domain))) {
      return user.picture;
    }
   
    return '/default_icon.png';
  };

  // Handler for delete button click
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(page.id, page.users ? page.users.nickname : 'anonymous');
  };
  
  // Handler for favorite button click
  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite(page.id, page.users ? page.users.nickname : 'anonymous', !page.is_favorited);
  };
  
  // Function to get model information based on the model type
  const getModelInfo = (model) => {
    switch (model) {
      case 'FREE_MODEL':
        return { name: 'Free Model', className: 'text-gray-500' };
      case 'PRO_MODEL':
        return { name: 'Pro Model', className: 'text-blue-500 glistening-pro' };
      case 'ADVANCED_MODEL':
        return { name: 'Advanced Model', className: 'text-purple-500 glistening-advanced' };
      default:
        return { name: 'Free Model', className: 'text-gray-500' };
    }
  };

  // Get model information for the current page
  const modelInfo = getModelInfo(page.model_used);

  // Determine the link href based on whether the page has a user or is anonymous
  const linkHref = page.users ? `/page/${page.users.nickname}/${page.name}` : `/page/anon/${page.name}`;

  return (
    <Link href={linkHref} className="no-underline text-inherit">
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 relative"
      >
        {/* Admin controls for delete and favorite */}
        {userRole === 'admin' && (
          <>
            <motion.div
              className="absolute top-2 left-2 z-20 cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
            >
              <Trash2 className="text-red-500 hover:text-red-600" size={24} />
            </motion.div>
            <motion.div
              className="absolute top-2 right-2 z-20 cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
            >
              <Star
                className={`${
                  page.is_favorited ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                } hover:text-yellow-500`}
                size={24}
              />
            </motion.div>
          </>
        )}
        {/* Preview component container */}
        <div className="relative w-full" style={{ paddingBottom: `${(previewHeight / previewWidth) * 100}%` }}>
          <div className="absolute inset-0">
          <PreviewComponent
              html={page.html}
              javascript={page.javascript}
              width={previewWidth}
              height={previewHeight}
              suppressErrors={true}
              executeJavaScript={false}
            />
          </div>
        </div>
        {/* Page information */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {new Date(page.created_at).toLocaleDateString()}
            </p>
            <p className={`text-sm font-medium ${modelInfo.className}`}>
              {modelInfo.name}
            </p>
          </div>
          <h3 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {page.name || 'Untitled Page'}
          </h3>
        </div>
        {/* User avatar and nickname (if not anonymous) */}
        {!page.is_anonymous && page.users && (
          <div className="absolute bottom-2 right-2 group z-10">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
              <Image
                src={getImageSrc(page.users)}
                alt={page.users.nickname || 'User'}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap">
                {page.users.nickname || 'Anonymous User'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
};

export default PagePreviewCard;