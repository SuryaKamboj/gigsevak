import React, { useState } from 'react';
import { Header } from '../../components/dashboard/Header';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { BottomNav } from '../../components/dashboard/BottomNav';
import { HomePage } from '../dashboard/HomePage';
import { OrdersPage } from '../dashboard/OrdersPage';
import { VoicePage } from '../dashboard/VoicePage';
import { AccountPage } from '../dashboard/AccountPage';
import type { JobItem, NavTab } from '../../types/dashboard';
import { MOCK_JOBS } from '../../data/mockJobs';

export const WorkerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [jobsList, setJobsList] = useState<JobItem[]>(MOCK_JOBS);

  const handleUpdateJob = (updatedJob: JobItem) => {
    setJobsList((prev) =>
      prev.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            jobsList={jobsList}
            onUpdateJob={handleUpdateJob}
          />
        );
      case 'orders':
        return <OrdersPage jobsList={jobsList} onUpdateJob={handleUpdateJob} />;
      case 'voice':
        return <VoicePage />;
      case 'account':
        return <AccountPage />;
      default:
        return (
          <HomePage
            jobsList={jobsList}
            onUpdateJob={handleUpdateJob}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-primary">
      {/* Top Header */}
      <Header
        isAvailable={isAvailable}
        onToggleAvailability={() => setIsAvailable((prev) => !prev)}
        onLogoClick={() => setActiveTab('home')}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Left Icon-Only Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 min-w-0 md:pl-20 pb-24 md:pb-12 pt-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full transition-all">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
};

export default WorkerDashboard;
