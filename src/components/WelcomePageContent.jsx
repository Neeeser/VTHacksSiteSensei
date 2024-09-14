'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';

const WelcomePageContent = () => {
  const { user, isLoading } = useUser();

  return (
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
              src="/logo.png"
              alt="Site Sensei Logo"
              width={128}
              height={128}
              className="w-full h-full object-contain"
            />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4 text-text-light-primary dark:text-text-dark-primary text-shadow">Site Sensei</h1>
          <p className="text-xl mb-8 text-text-light-secondary dark:text-text-dark-secondary font-light">Generate interactive code for your website quickly</p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md text-text-light-primary dark:text-text-dark-primary max-w-md mx-auto border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-serif mb-4">Begin Your Journey</h2>
          <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">Transform your Web App Idea&apos;s into Reality</p>
                    {!isLoading && (
            <Link href={user ? "/create" : "/api/auth/login"} passHref legacyBehavior>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary inline-block"
              >
                {user ? "Create" : "Login/Signup"}
              </motion.a>
            </Link>
          )}
        </motion.div>
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 text-sm text-text-light-secondary dark:text-text-dark-secondary"
        >
          © 2024 Site Sensei
        </motion.footer>
      </motion.div>
    </div>
  );
};

export default WelcomePageContent;