import React from 'react';
import clsx from 'clsx';

type BrandMarkProps = {
  className?: string;
  iconClassName?: string;
};

const BrandMark: React.FC<BrandMarkProps> = ({ className, iconClassName }) => {
  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20',
        className
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={clsx('h-7 w-7', iconClassName)}
        aria-hidden="true"
      >
        <path
          d="M14 31.5L21.5 24L27 27.5L34.5 18.5"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13.5" cy="32" r="3.5" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="2" />
        <circle cx="21.5" cy="24" r="2.8" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="2" />
        <circle cx="27" cy="27.5" r="2.8" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="2" />
        <circle cx="35" cy="18" r="3.5" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="2" />
        <path
          d="M18.5 13.5C21.5 10.5 26.5 10.5 29.5 13.5C26.5 16.5 21.5 16.5 18.5 13.5Z"
          fill="white"
          fillOpacity="0.9"
        />
        <path
          d="M24 12.5V18"
          stroke="#0F172A"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    </div>
  );
};

export default BrandMark;
