import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const toggleAllFiltered = () => {
    const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedValues.includes(opt));
    if (allFilteredSelected) {
      onChange(selectedValues.filter(v => !filteredOptions.includes(v)));
    } else {
      const newSelected = new Set([...selectedValues, ...filteredOptions]);
      onChange(Array.from(newSelected));
    }
  };

  const validSelected = selectedValues.filter(v => options.includes(v));
  const isAllFilteredSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedValues.includes(opt));

  let displayText = placeholder;
  if (validSelected.length > 0) {
    if (validSelected.length === options.length) {
      displayText = "All Selected";
    } else {
      displayText = `${validSelected.length} selected`;
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[180px]"
      >
        <span className="truncate text-slate-700">
          {displayText}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="p-2 overflow-y-auto flex-1">
            <label className="flex items-center px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${isAllFilteredSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 group-hover:border-blue-400'}`}>
                {isAllFilteredSelected && <Check size={12} className="text-white" />}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={isAllFilteredSelected}
                onChange={toggleAllFiltered}
              />
              <span className="text-sm font-medium text-slate-700">Select All</span>
            </label>
            
            <div className="h-px bg-slate-100 my-1"></div>

            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-sm text-slate-500 text-center">No options found</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option);
                return (
                  <label key={option} className="flex items-center px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 group-hover:border-blue-400'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => toggleOption(option)}
                    />
                    <span className="text-sm text-slate-600 truncate">{option}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
