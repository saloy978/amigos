import { useEffect, useCallback } from 'react';

export interface TheoryTrackingOptions {
  activeSection: string;
  theorySection: string;
  onTheoryViewed: () => void;
  delay?: number;
}

export const useTheoryTracking = ({
  activeSection,
  theorySection,
  onTheoryViewed,
  delay = 3000
}: TheoryTrackingOptions) => {
  
  const startTheoryTimer = useCallback(() => {
    console.log('⏰ Starting theory timer...');
    
    const timer = setTimeout(() => {
      console.log('✅ Theory viewed!');
      onTheoryViewed();
    }, delay);
    
    return () => clearTimeout(timer);
  }, [onTheoryViewed, delay]);

  useEffect(() => {
    if (activeSection === theorySection) {
      return startTheoryTimer();
    }
  }, [activeSection, theorySection, startTheoryTimer]);
};


















