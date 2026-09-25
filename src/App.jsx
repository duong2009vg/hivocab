// Main React Application Hosting 100% of Original Website Components
import React, { useEffect } from 'react';
import MainSidebar from './components/layout/MainSidebar.jsx';
import MobileProfileDropdown from './components/layout/MobileProfileDropdown.jsx';
import MobileBottomNav from './components/layout/MobileBottomNav.jsx';
import PageDashboard from './components/pages/PageDashboard.jsx';
import PageTopics from './components/pages/PageTopics.jsx';
import PageLibrary from './components/pages/PageLibrary.jsx';
import PageTopicDetail from './components/pages/PageTopicDetail.jsx';
import PageLessonDetail from './components/pages/PageLessonDetail.jsx';
import PageExercises from './components/pages/PageExercises.jsx';
import PageThptRoom from './components/pages/PageThptRoom.jsx';
import PageVocabulary from './components/pages/PageVocabulary.jsx';
import PageDictionary from './components/pages/PageDictionary.jsx';
import PageSettings from './components/pages/PageSettings.jsx';
import PageBilingualReading from './components/pages/PageBilingualReading.jsx';
import PageLearning from './components/pages/PageLearning.jsx';
import GlobalBugReportBtn from './components/common/GlobalBugReportBtn.jsx';
import Modals from './components/common/Modals.jsx';

export function App() {
  useEffect(() => {
    // Notify window that React DOM is ready
    if (window.initApp && typeof window.initApp === 'function') {
      window.initApp();
    }
  }, []);

  return (
    <div id="app-root" className="min-h-screen bg-background text-on-background font-sans antialiased">
      <MainSidebar />
      <MobileProfileDropdown />
      <MobileBottomNav />

      <PageDashboard />
      <PageTopics />
      <PageLibrary />
      <PageTopicDetail />
      <PageLessonDetail />
      <PageExercises />
      <PageThptRoom />
      <PageVocabulary />
      <PageDictionary />
      <PageSettings />
      <PageBilingualReading />
      <PageLearning />

      <GlobalBugReportBtn />
      <Modals />
    </div>
  );
}

export default App;
