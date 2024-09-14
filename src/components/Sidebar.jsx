import React from 'react';
import { X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, children }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out z-50`}
    >
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">Edit Page</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X size={24} />
        </button>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Sidebar;