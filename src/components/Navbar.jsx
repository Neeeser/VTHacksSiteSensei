'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Menu, X, User, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, error, isLoading } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const response = await fetch('/api/user');
          if (response.ok) {
            const userData = await response.json();
            setDbUser(userData);
          } else {
            console.error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) return null;

  const userNickname = dbUser?.nickname || dbUser?.name?.replace(/\s+/g, '-').toLowerCase();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Site Sensei Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                <Link href="/create" className="text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary px-3 py-2 rounded-md text-sm font-medium">Create</Link>
                <Link href="/explore" className="text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary px-3 py-2 rounded-md text-sm font-medium">Explore</Link>
                <Link href="/pricing" className="text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary px-3 py-2 rounded-md text-sm font-medium">Pricing</Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button
                onClick={toggleDarkMode}
                className="mr-4 p-2 text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>
              {isLoading ? (
                <div>Loading...</div>
              ) : user ? (
                <div className="relative">
                  <motion.button
                    onClick={toggleProfile}
                    className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.picture || "/api/placeholder/32/32"}
                      alt={dbUser?.name || "User profile"}
                    />
                  </motion.button>
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-2 text-sm text-text-light-primary dark:text-text-dark-primary">{dbUser?.name}</div>
                      <Link href={`/profile/${userNickname}`} className="block px-4 py-2 text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-600">Your Profile</Link>
                      <Link href="/settings" className="block px-4 py-2 text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-600">Settings</Link>
                      <Link href="/api/auth/logout" className="block px-4 py-2 text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-600">Logout</Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/api/auth/login" className="text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary px-3 py-2 rounded-md text-sm font-medium">Login</Link>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800">
          <Link href="/" className="text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">Home</Link>
          <Link href="/create" className="text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">Create</Link>
          <Link href="/explore" className="text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">Explore</Link>
          <Link href="/pricing" className="text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">Pricing</Link>
        </div>
        {user ? (
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.picture || "/api/placeholder/40/40"}
                  alt={dbUser?.name || "User profile"}
                />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-text-light-primary dark:text-text-dark-primary">{dbUser?.name}</div>
                <div className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">{user.email}</div>
              </div>
              <button
                onClick={toggleDarkMode}
                className="ml-auto flex-shrink-0 p-1 rounded-full text-text-light-primary dark:text-text-dark-primary hover:text-text-light-secondary dark:hover:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link href={`/profile/${userNickname}`} className="block px-3 py-2 rounded-md text-base font-medium text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700">Your Profile</Link>
              <Link href="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700">Settings</Link>
              <Link href="/api/auth/logout" className="block px-3 py-2 rounded-md text-base font-medium text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700">Logout</Link>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 space-y-1">
              <Link href="/api/auth/login" className="block px-3 py-2 rounded-md text-base font-medium text-text-light-primary dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700">Login</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
