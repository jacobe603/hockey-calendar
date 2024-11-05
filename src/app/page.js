'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Loader2, MapPin, Users, ChevronDown, ChevronUp, Clock } from 'lucide-react';

const TEAM_CONFIG = [
  { sex: 'Boys', age: 'Bantam', team: 'AA', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551014', rosterUrl: 'https://www.fargohockey.org/roster/show/8551014' },
  { sex: 'Boys', age: 'Bantam', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551013', rosterUrl: 'https://www.fargohockey.org/roster/show/8551013' },
  { sex: 'Boys', age: 'Bantam', team: 'B1 Gray', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551019', rosterUrl: 'https://www.fargohockey.org/roster/show/8551019' },
  { sex: 'Boys', age: 'Bantam', team: 'B1 Navy', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551020', rosterUrl: 'https://www.fargohockey.org/roster/show/8551020' },
  { sex: 'Boys', age: 'Peewee', team: 'AA', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551060', rosterUrl: 'https://www.fargohockey.org/roster/show/8551060' },
  { sex: 'Boys', age: 'Peewee', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551058', rosterUrl: 'https://www.fargohockey.org/roster/show/8551058' },
  { sex: 'Boys', age: 'Peewee', team: 'B1 Gray', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551066', rosterUrl: 'https://www.fargohockey.org/roster/show/8551066' },
  { sex: 'Boys', age: 'Peewee', team: 'B1 Navy', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551067', rosterUrl: 'https://www.fargohockey.org/roster/show/8551067' }
];

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optimized Select Component
const FilterSelect = React.memo(({ label, value, options, onChange }) => {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <Select 
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {options.map(option => (
            <SelectItem 
              key={option}
              value={option}
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

FilterSelect.displayName = 'FilterSelect';

const EventRow = ({ event, rosterUrl }) => {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-200 last:border-0 hover:bg-gray-50/50 transition-colors">
        <td className="py-4 px-6">
          {rosterUrl ? (
            <a 
              href={rosterUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700"
            >
              {event.team}
              <Users className="h-4 w-4 opacity-75" />
            </a>
          ) : (
            <span className="font-medium">{event.team}</span>
          )}
        </td>
        <td className="py-4 px-6 font-medium">{event.opponent || event.summary}</td>
        <td className="py-4 px-6 text-gray-600">{event.time}</td>
        <td className="py-4 px-6 text-gray-600">
          <div className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{event.location}</span>
          </div>
        </td>
        <td className="py-4 px-6 text-right">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            {showDebug ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </td>
      </tr>
      {showDebug && (
        <tr className="border-b border-gray-200">
          <td colSpan={5} className="py-3 px-6 bg-gray-50">
            <div className="text-xs font-mono text-gray-600 space-y-1">
              <div>Original ISO: {event.debug.originalISOString}</div>
              <div>Original Timezone: {event.debug.originalTimezone}</div>
              <div>Parsed Central: {event.debug.parsedCentralTime}</div>
              <div>Computed Date: {event.debug.computedDate}</div>
              <div>Computed Time: {event.debug.computedTime}</div>
              <div>Display Date: {event.date}</div>
              <div>Display Time: {event.time}</div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

async function fetchEvents() {
  try {
    const response = await fetch('https://hockey-calendar.onrender.com/api/events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

function formatEventDate(dateString) {
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [filters, setFilters] = useState({
    sex: 'All',
    age: 'All',
    team: 'All',
    location: 'All'
  });

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filterOptions = useMemo(() => {
    const locations = new Set(events.filter(e => e.location).map(e => e.location));
    return {
      sex: ['All', ...new Set(TEAM_CONFIG.map(team => team.sex))],
      age: ['All', ...new Set(TEAM_CONFIG.map(team => team.age))],
      team: ['All', ...new Set(TEAM_CONFIG.map(team => team.team))],
      location: ['All', ...Array.from(locations).sort()]
    };
  }, [events]);

  const debouncedFilterChange = useCallback(
    debounce((filterType, value) => {
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }, 150),
    []
  );

  const filterControls = useMemo(() => [
    {
      label: 'Gender',
      type: 'sex',
      options: filterOptions.sex
    },
    {
      label: 'Age Group',
      type: 'age',
      options: filterOptions.age
    },
    {
      label: 'Team Level',
      type: 'team',
      options: filterOptions.team
    },
    {
      label: 'Location',
      type: 'location',
      options: filterOptions.location
    }
  ], [filterOptions]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filter past events
      if (!showPastEvents) {
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) return false;
      }

      // Apply other filters
      const matchSex = filters.sex === 'All' || event.sex === filters.sex;
      const matchAge = filters.age === 'All' || event.age === filters.age;
      const matchTeam = filters.team === 'All' || event.team.includes(filters.team);
      const matchLocation = filters.location === 'All' || event.location === filters.location;
      
      return matchSex && matchAge && matchTeam && matchLocation;
    });
  }, [events, filters, showPastEvents]);

  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const date = event.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  const getRosterUrl = (teamName) => {
    const teamConfig = TEAM_CONFIG.find(config => 
      `${config.age} ${config.team}` === teamName
    );
    return teamConfig?.rosterUrl;
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pt-[180px]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-semibold tracking-tight">Fargo Freeze Hockey Schedule</h1>
            </div>
            <button
              onClick={() => setShowPastEvents(!showPastEvents)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showPastEvents 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              <Clock className="h-4 w-4" />
              {showPastEvents ? 'Showing Past Events' : 'Hide Past Events'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {filterControls.map(control => (
              <FilterSelect
                key={control.type}
                label={control.label}
                value={filters[control.type]}
                options={control.options}
                onChange={(value) => debouncedFilterChange(control.type, value)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {formatEventDate(date)}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Team</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Event</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Time</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Location</th>
                        <th className="py-3 px-6 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayEvents.map(event => (
                        <EventRow 
                          key={`${event.id}_${event.date}_${event.time}`}
                          event={event} 
                          rosterUrl={getRosterUrl(event.team)} 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {Object.keys(groupedEvents).length === 0 && (
              <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200/50">
                <p className="text-gray-500 text-lg">No events found matching your filters</p>
                <p className="text-gray-400 mt-2">Try adjusting your filter criteria or toggle past events to see more results</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}