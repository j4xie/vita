/* Web端特定版本 - 与App端隔离 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <FilterContext.Provider value={{ isFilterOpen, setIsFilterOpen }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};