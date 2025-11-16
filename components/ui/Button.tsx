
import React, { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform rounded-md focus:outline-none focus:ring focus:ring-opacity-80';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-300',
    secondary: 'bg-gray-600 hover:bg-gray-500 focus:ring-gray-300',
    danger: 'bg-red-600 hover:bg-red-500 focus:ring-red-300',
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
