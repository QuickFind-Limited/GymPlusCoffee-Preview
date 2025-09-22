
import React from 'react';

interface PageTitleProps {
  title: string;
  isSubPage: boolean;
  onBackClick: () => void;
}

const PageTitle = ({ title, isSubPage }: PageTitleProps) => {
  if (!isSubPage) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-medium text-gray-800">{title}</h2>
    </div>
  );
};

export default PageTitle;
