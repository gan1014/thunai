import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar, NavTab } from './Sidebar';
import { AccessibilityControls } from './AccessibilityControls';
import { EmergencySOSModal } from './EmergencySOSModal';
import { ShortcutsGuideModal } from './ShortcutsGuideModal';
import { GlobalVoiceWidget } from './GlobalVoiceWidget';
import { useProfile } from '../context/ProfileContext';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibilityShortcuts } from '../hooks/useAccessibilityShortcuts';

interface LayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children }) => {
  const { profile } = useProfile();
  const { isEmergencyOpen, closeEmergency, isShortcutsOpen, closeShortcuts, latestResponse } =
    useAssistant();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Bind global keyboard accessibility shortcuts
  useAccessibilityShortcuts();

  return (
    <div
      id="sahay-x-root-layout"
      className={`min-h-screen text-slate-100 flex flex-col font-sans transition-colors duration-200 ${
        profile.high_contrast ? 'bg-black text-yellow-300 contrast-125' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Navigation */}
      <Navbar
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onTabChange={onTabChange}
        activeTab={activeTab}
      />

      {/* Main Body */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Persistent Global Voice Assistant & Spatial Vision on Every Page */}
      <GlobalVoiceWidget />

      {/* Accessibility floating quick controls */}
      <AccessibilityControls />

      {/* Critical Emergency SOS Beacon Modal */}
      <EmergencySOSModal
        isOpen={isEmergencyOpen}
        onClose={closeEmergency}
        detectedHazard={
          latestResponse?.risk?.risk_factors?.join(', ') ||
          latestResponse?.safety_warnings?.join(', ') ||
          'Immediate physical obstacle / corridor hazard reported'
        }
      />

      {/* Accessibility Keyboard Shortcuts Modal */}
      <ShortcutsGuideModal
        isOpen={isShortcutsOpen}
        onClose={closeShortcuts}
      />
    </div>
  );
};
