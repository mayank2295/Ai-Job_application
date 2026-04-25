import { useEffect } from 'react';
import CareerBot from '../components/CareerBot';

const ATS_STORAGE_KEY = 'jobflow_ats_last_result';

// Persist ATS results to localStorage so they survive page refresh
// CareerBot handles the actual analysis — this wrapper just ensures
// the page title is correct and the tab is pre-selected
export default function AtsResumePage() {
  useEffect(() => {
    // Restore scroll position
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="career-bot-page">
      <CareerBot initialTab="resume" />
    </div>
  );
}

export { ATS_STORAGE_KEY };
