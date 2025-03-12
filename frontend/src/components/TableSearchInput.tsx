import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { DatabaseTable } from '../types/dataSource';

interface TableSearchInputProps {
  availableTables: DatabaseTable[];
  tablesLoading: boolean;
  onSelectTable: (table: DatabaseTable) => void;
  onError?: (error: string) => void;
}

const TableSearchInput: React.FC<TableSearchInputProps> = ({
  availableTables,
  tablesLoading,
  onSelectTable
}) => {
  const [tableInput, setTableInput] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get filtered table suggestions (max 2 closest matches)
  const getFilteredSuggestions = () => {
    if (!tableInput.trim()) return [];
    
    const inputLower = tableInput.toLowerCase();
    
    // First, find tables that start with the input text (highest priority)
    const startsWithMatches = availableTables
      .filter(table => table.name.toLowerCase().startsWith(inputLower))
      .slice(0, 2);
    
    // If we already have 2 matches, return them
    if (startsWithMatches.length === 2) return startsWithMatches;
    
    // Otherwise, look for tables that contain the input text
    const containsMatches = availableTables
      .filter(table => 
        table.name.toLowerCase().includes(inputLower) && 
        !table.name.toLowerCase().startsWith(inputLower)
      )
      .slice(0, 2 - startsWithMatches.length);
    
    // Combine both types of matches
    return [...startsWithMatches, ...containsMatches];
  };

  const filteredSuggestions = getFilteredSuggestions();
  
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
      // If an item is selected in the dropdown, use that
      onSelectTable(filteredSuggestions[activeIndex]);
      setTableInput('');
      setIsDropdownOpen(false);
      setError(null); // Clear error on valid selection
      return;
    }
    
    const tableExists = availableTables.some(
      (table: DatabaseTable) => table.name.toLowerCase() === tableInput.toLowerCase()
    );
    
    if (!tableExists) {
      setError(`Table "${tableInput}" does not exist in this data source`);
      // Set a timer to clear the error after 8 seconds
      setTimeout(() => {
        setError(null);
      }, 8000);
      return;
    }
    
    const table = availableTables.find(
      (table: DatabaseTable) => table.name.toLowerCase() === tableInput.toLowerCase()
    );
    
    if (table) {
      onSelectTable(table);
      setTableInput('');
      setIsDropdownOpen(false);
      setError(null); // Clear error on valid selection
    }
  };

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          onSelectTable(filteredSuggestions[activeIndex]);
          setTableInput('');
          setIsDropdownOpen(false);
          setError(null); // Clear error on valid selection
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <form onSubmit={handleTableSubmit} className="w-full mb-4 relative">
      {error && (
        <div className="bg-red-50 text-red-800 p-2 rounded-md mb-2 text-sm">
          {error}
        </div>
      )}
      <div className="w-full">
        <div className="relative w-full">
          {/* Left search icon */}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for a table..."
            value={tableInput}
            onChange={(e) => {
              setTableInput(e.target.value);
              setIsDropdownOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200"
            disabled={tablesLoading}
          />
          
          {/* Embedded search button */}
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-md flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors"
            disabled={tablesLoading}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Custom dropdown for table suggestions */}
        {isDropdownOpen && filteredSuggestions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full left-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            <ul className="py-1">
              {filteredSuggestions.map((table, index) => (
                <li 
                  key={table.name}
                  className={`px-4 py-2 cursor-pointer hover:bg-primary/10 flex items-center gap-2 ${index === activeIndex ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => {
                    onSelectTable(table);
                    setTableInput('');
                    setIsDropdownOpen(false);
                    setError(null); // Clear error on valid selection
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <Search className="h-4 w-4" />
                  <span>{table.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
};

export default TableSearchInput; 