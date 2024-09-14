'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@auth0/nextjs-auth0/client';
import InfiniteScroll from 'react-infinite-scroll-component';
import PagePreviewCard from './PagePreviewCard';
import Image from 'next/image';

const ProfilePage = ({ nickname }) => {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageSize = 12;

  const fetchProfileData = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/${nickname}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setProfileData(null);
        } else {
          throw new Error(data.error || 'Failed to fetch profile data');
        }
      } else {
        setProfileData(data);
        setPages(data.pages.slice(0, pageSize));
        setHasMore(data.pages.length > pageSize);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [nickname]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const fetchMorePages = useCallback(() => {
    if (profileData && profileData.pages) {
      const nextPages = profileData.pages.slice(pages.length, pages.length + pageSize);
      setPages(prevPages => [...prevPages, ...nextPages]);
      setHasMore(pages.length + nextPages.length < profileData.pages.length);
    }
  }, [profileData, pages]);

  if (isLoading || isUserLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-4 text-danger">Error</h1>
          <p className="text-xl">{error}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-full bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-serif mb-4 text-text-light-primary dark:text-text-dark-primary text-shadow">User Not Found</h1>
          <p className="text-xl text-text-light-secondary dark:text-text-dark-secondary">The user @{nickname} doesn&apos;t exist.</p>
        </motion.div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.nickname === nickname;

  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-7xl mx-auto"
      >
        <div className="h-full flex items-center justify-center p-4 bg-background-light dark:bg-background-dark">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-16 h-16 mx-auto mb-6"
              >
                <Image
                  src={profileData.picture}
                  alt="Profile Picture"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain rounded-full"
                />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-serif mb-4 text-text-light-primary dark:text-text-dark-primary text-shadow">{profileData.name}</h1>
              <p className="text-xl mb-8 text-text-light-secondary dark:text-text-dark-secondary font-light">@{profileData.nickname}</p>
            </motion.div>
          </motion.div>
        </div>
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl md:text-5xl font-serif mb-8 text-text-light-primary dark:text-text-dark-primary text-shadow"
        >
          {isOwnProfile ? 'My Pages' : `${profileData.name}'s Pages`}
        </motion.h1>
        <InfiniteScroll
          dataLength={pages.length}
          next={fetchMorePages}
          hasMore={hasMore}
          loader={
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          }
          endMessage={<p className="text-center mt-4 text-text-light-secondary dark:text-text-dark-secondary">No more pages to load.</p>}
          className="w-full"
          style={{ overflow: 'visible' }}
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {pages.map((page, index) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .2 * (index % 12), duration: 0.5 }}
              >
                <PagePreviewCard
                  page={page}
                />
              </motion.div>
            ))}
          </motion.div>
        </InfiniteScroll>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
