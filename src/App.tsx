import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { AlertsPage } from './components/AlertsPage';
import { AlertConfigPage } from './components/AlertConfigPage';
import { Toaster } from './components/ui/sonner';

interface AlertRule {
  id: string;
  name: string;
  mac: string;
  state: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => {
    const saved = localStorage.getItem('alert_rules');
    return saved ? JSON.parse(saved) : [];
  });

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const addAlert = (alert: any) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const handleSaveRules = (rules: AlertRule[]) => {
    setAlertRules(rules);
    localStorage.setItem('alert_rules', JSON.stringify(rules));
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage alerts={alerts} onNavigate={handleNavigation} />;
      case 'alerts':
        return <AlertsPage alerts={alerts} onClearAlerts={() => setAlerts([])} />;
      case 'config':
        return <AlertConfigPage initialRules={alertRules} onSaveRules={handleSaveRules} />;
      default:
        return <HomePage alerts={alerts} onNavigate={handleNavigation} />;
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigation}
        alertCount={alerts.length}
        onAddAlert={addAlert}
        alertRules={alertRules}
      >
        {renderPageContent()}
      </Layout>
      <Toaster />
    </>
  );
}