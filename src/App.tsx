import React, { useState } from 'react';
import { ProfileProvider } from './context/ProfileContext';
import { AssistantProvider } from './context/AssistantContext';
import { Layout } from './components/Layout';
import { NavTab } from './components/Sidebar';

import { Home } from './pages/Home';
import { FullAssistant } from './pages/FullAssistant';
import { VoiceAssistant } from './pages/VoiceAssistant';
import { VisionAssistant } from './pages/VisionAssistant';
import { SpeechAssistant } from './pages/SpeechAssistant';
import { GestureAssistant } from './pages/GestureAssistant';
import { LiveCaptioning } from './pages/LiveCaptioning';
import { SmartOCR } from './pages/SmartOCR';
import { Benchmark } from './pages/Benchmark';
import { DashboardView } from './pages/DashboardView';
import { ProfileView } from './pages/ProfileView';

import { VoiceInteractionProvider } from './context/VoiceInteractionContext';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={setActiveTab} />;
      case 'assistant':
        return <FullAssistant />;
      case 'voice':
        return <VoiceAssistant />;
      case 'vision':
        return <VisionAssistant />;
      case 'speech':
        return <SpeechAssistant />;
      case 'gesture':
        return <GestureAssistant />;
      case 'captions':
        return <LiveCaptioning />;
      case 'ocr':
        return <SmartOCR />;
      case 'benchmark':
        return <Benchmark />;
      case 'dashboard':
        return <DashboardView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <Home onNavigate={setActiveTab} />;
    }
  };

  return (
    <ProfileProvider>
      <AssistantProvider>
        <VoiceInteractionProvider>
          <Layout activeTab={activeTab} onTabChange={setActiveTab}>
            {renderContent()}
          </Layout>
        </VoiceInteractionProvider>
      </AssistantProvider>
    </ProfileProvider>
  );
}

export default App;
