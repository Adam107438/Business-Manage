import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

// In a real app, this would be more secure
const SUPER_SECRET_PASSWORD = '1234';

interface PasswordProtectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionName?: string;
}

const PasswordProtect: React.FC<PasswordProtectProps> = ({ isOpen, onClose, onSuccess, actionName = 'perform this action' }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SUPER_SECRET_PASSWORD) {
      setError('');
      onSuccess();
      onClose();
      setPassword('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin Access Required">
      <form onSubmit={handleSubmit}>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please enter the admin password to {actionName}. (Default: 1234)
        </p>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Confirm</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordProtect;