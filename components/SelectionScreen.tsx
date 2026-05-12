import React, { useState, useEffect } from 'react';
import { Client, ForecastRecord } from '../types';
import { Filter, ArrowRight } from 'lucide-react';

interface Props {
  data: ForecastRecord[];
  clients: Client[]; // New prop
  userEmail: string;
  userRole: string;
  userSubsidiary?: string;
  currentCycle: string;
  onProceed: (client: string, section: string, subsidiary: string) => void;
}

const SelectionScreen: React.FC<Props> = ({ data, clients, userEmail, userRole, userSubsidiary, currentCycle, onProceed }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState((userRole === 'Sales' || userRole === 'Manager') && userSubsidiary ? userSubsidiary : '');

  useEffect(() => {
    if ((userRole === 'Sales' || userRole === 'Manager') && userSubsidiary) {
      setSelectedSubsidiary(userSubsidiary);
    }
  }, [userRole, userSubsidiary]);

  // Derive available clients and sections from the data and clients array
  const availableSubsidiaries = Array.from(new Set([
    ...data.filter(d => 
      (!selectedClient || d.client === selectedClient) && 
      (!selectedSection || d.section === selectedSection)
    ).map(d => d.subsidiary),
    ...clients.filter(c => 
      (!selectedClient || c.name === selectedClient) && 
      (!selectedSection || !c.section || c.section === selectedSection)
    ).map(c => c.subsidiary)
  ])).filter(Boolean).sort();
  
  const availableClients = Array.from(new Set([
    ...data.filter(d => 
      (!selectedSubsidiary || d.subsidiary === selectedSubsidiary) && 
      (!selectedSection || d.section === selectedSection)
    ).map(d => d.client),
    ...clients.filter(c => 
      (!selectedSubsidiary || !c.subsidiary || c.subsidiary === selectedSubsidiary) && 
      (!selectedSection || !c.section || c.section === selectedSection)
    ).map(c => c.name)
  ])).filter(Boolean).sort();
  
  const availableSections = Array.from(new Set([
    ...data.filter(d => 
      (!selectedSubsidiary || d.subsidiary === selectedSubsidiary) && 
      (!selectedClient || d.client === selectedClient)
    ).map(d => d.section),
    ...clients.filter(c => 
      (!selectedSubsidiary || !c.subsidiary || c.subsidiary === selectedSubsidiary) && 
      (!selectedClient || c.name === selectedClient)
    ).map(c => c.section)
  ])).filter(Boolean).sort();

  useEffect(() => {
    if (selectedSubsidiary && !availableSubsidiaries.includes(selectedSubsidiary)) {
      setSelectedSubsidiary('');
    }
  }, [availableSubsidiaries, selectedSubsidiary]);

  useEffect(() => {
    if (selectedClient && !availableClients.includes(selectedClient)) {
      setSelectedClient('');
    }
  }, [availableClients, selectedClient]);

  useEffect(() => {
    if (selectedSection && !availableSections.includes(selectedSection)) {
      setSelectedSection('');
    }
  }, [availableSections, selectedSection]);

  const canProceed = selectedClient && selectedSection && selectedSubsidiary;

  const handleClientChange = (clientName: string) => {
    setSelectedClient(clientName);
    const clientDef = clients.find(c => c.name === clientName);
    if (clientDef) {
      if (clientDef.subsidiary) setSelectedSubsidiary(clientDef.subsidiary);
      if (clientDef.section) setSelectedSection(clientDef.section);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-2xl overflow-hidden">
        <div className="bg-blue-600 p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter className="h-6 w-6" />
            Forecast Selection
          </h2>
          <p className="text-blue-100 text-sm mt-1">Select the scope for your review session.</p>
        </div>

        <div className="p-8 space-y-6">
          
          <div className={`grid grid-cols-1 ${(userRole !== 'Sales' && userRole !== 'Manager') ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {(userRole !== 'Sales' && userRole !== 'Manager') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Subsidiary
                </label>
                <select
                  value={selectedSubsidiary}
                  onChange={(e) => setSelectedSubsidiary(e.target.value)}
                  className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" className="text-slate-500">-- Choose Subsidiary --</option>
                  {availableSubsidiaries.map(s => (
                    <option key={s} value={s} className="text-slate-900">{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" className="text-slate-500">-- Choose Client --</option>
                {availableClients.map(c => (
                  <option key={c} value={c} className="text-slate-900">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" className="text-slate-500">-- Choose Section --</option>
                {availableSections.map(s => (
                  <option key={s} value={s} className="text-slate-900">{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onProceed(selectedClient, selectedSection, selectedSubsidiary)}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                canProceed
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Proceed to Forecasts
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionScreen;
