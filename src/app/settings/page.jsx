'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, isLoading } = useUser();
  const [userData, setUserData] = useState(null);
  const [originalNickname, setOriginalNickname] = useState('');
  const [errors, setErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setUserData(data);
      setOriginalNickname(data.nickname);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const validateField = async (name, value) => {
    switch (name) {
      case 'name':
        return value && value.trim().length < 2 ? 'Name must be at least 2 characters long' : '';
      case 'nickname':
        if (value === originalNickname) {
          return ''; // No need to validate if it's the original nickname
        }
        if (!value || !/^[a-zA-Z0-9_-]{2,20}$/.test(value)) {
          return 'Nickname must be 2-20 characters and can only contain letters, numbers, underscores, and hyphens';
        }
        try {
          const response = await fetch('/api/validate-nickname', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nickname: value }),
          });
          const data = await response.json();
          if (!response.ok) {
            return data.error || 'Error validating nickname';
          }
        } catch (error) {
          console.error('Error validating nickname:', error);
          return 'Error validating nickname';
        }
        return '';
      case 'phone_number':
        return value && !/^\+?[1-9]\d{1,14}$/.test(value) ? 'Please enter a valid phone number' : '';
      case 'birthdate':
        if (value) {
          const date = new Date(value);
          const now = new Date();
          return date > now ? 'Birthdate cannot be in the future' : '';
        }
        return '';
      case 'address':
        return value && value.trim().length < 5 ? 'Please enter a valid address' : '';
      default:
        return '';
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setUserData(prev => prev ? { ...prev, [name]: value } : null);
    const error = await validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userData) return;

    const newErrors = {};
    for (const [key, value] of Object.entries(userData)) {
      if (key !== 'id') {
        const error = await validateField(key, value);
        if (error) newErrors[key] = error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsUpdating(true);
    setMessage('');
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      setMessage('Profile updated successfully!');
      // Update the original nickname if it was changed
      setOriginalNickname(userData.nickname);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 flex items-center justify-center h-screen"
      >
        <div className="loading-spinner"></div>
      </motion.div>
    );
  }

  if (!user || !userData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 flex items-center justify-center h-screen"
      >
        <p className="text-xl">Please log in to access settings.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-2xl font-bold mb-4"
      >
        User Settings
      </motion.h1>
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        onSubmit={handleSubmit}
        className="max-w-md"
      >
        {userData && Object.entries(userData).map(([key, value], index) => {
          if (key === 'id') return null; // Don't render the id field
          return (
            <motion.div
              key={key}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="mb-4"
            >
              <label htmlFor={key} className="block text-sm font-medium mb-1">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <input
                type={key === 'birthdate' ? 'date' : key === 'phone_number' ? 'tel' : 'text'}
                id={key}
                name={key}
                value={value || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors[key] ? 'border-red-500' : ''}`}
              />
              {errors[key] && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {errors[key]}
                </motion.p>
              )}
            </motion.div>
          );
        })}
        <motion.button
          type="submit"
          disabled={isUpdating || Object.keys(errors).some(key => !!errors[key])}
          className="btn btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </motion.button>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 text-sm"
          >
            {message}
          </motion.p>
        )}
      </motion.form>
    </motion.div>
  );
}