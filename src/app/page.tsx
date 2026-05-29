'use client';

import { useState, useEffect } from 'react';
import { Provider, useSetAtom } from 'jotai';
import { vehiclesAtom } from '@/store/vehicleAtoms';
import { loadVehicles } from '@/lib/storage';
import VehicleInquiry from '@/components/VehicleInquiry';
import VehicleManagement from '@/components/VehicleManagement';

type Tab = 'inquiry' | 'management';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('inquiry');
  const setVehicles = useSetAtom(vehiclesAtom);

  useEffect(() => {
    setVehicles(loadVehicles());
  }, [setVehicles]);

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">차량 조회 시스템</h1>
      </header>

      <div className="bg-white border-b border-zinc-200 px-6">
        <nav className="flex gap-0">
          {[
            { id: 'inquiry' as Tab, label: '차량 조회' },
            { id: 'management' as Tab, label: '차량 관리' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto px-6 py-6">
        {activeTab === 'inquiry' ? <VehicleInquiry /> : <VehicleManagement />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Provider>
      <AppContent />
    </Provider>
  );
}
