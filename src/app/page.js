'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Loader2, MapPin, Users, Disc, Bell } from 'lucide-react';

const TEAM_CONFIG = [
  { sex: 'Boys', age: 'Bantam', team: 'AA', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551014', rosterUrl: 'https://www.fargohockey.org/roster/show/8551014?subseason=926726' },
  { sex: 'Boys', age: 'Bantam', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551013', rosterUrl: 'https://www.fargohockey.org/roster/show/8551013?subseason=926726' },
  { sex: 'Boys', age: 'Bantam', team: 'B1 Gray', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551019', rosterUrl: 'https://www.fargohockey.org/roster/show/8551019?subseason=926726' },
  { sex: 'Boys', age: 'Bantam', team: 'B1 Navy', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551020', rosterUrl: 'https://www.fargohockey.org/roster/show/8551020?subseason=926726' },
  { sex: 'Boys', age: 'Peewee', team: 'AA', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551060', rosterUrl: 'https://www.fargohockey.org/roster/show/8551060?subseason=926726' },
  { sex: 'Boys', age: 'Peewee', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551058', rosterUrl: 'https://www.fargohockey.org/roster/show/8551058?subseason=926726' },
  { sex: 'Boys', age: 'Peewee', team: 'B1 Gray', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551066', rosterUrl: 'https://www.fargohockey.org/roster/show/8551066?subseason=926726' },
  { sex: 'Boys', age: 'Peewee', team: 'B1 Navy', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551067', rosterUrl: 'https://www.fargohockey.org/roster/show/8551067?subseason=926726' },
  { sex: 'Girls', age: '12U', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8550998', rosterUrl: 'https://www.fargohockey.org/roster/show/8550998?subseason=926726' },
  { sex: 'Girls', age: '15U', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551002', rosterUrl: 'https://www.fargohockey.org/roster/show/8551002?subseason=926726' }
];

const EventRow = ({ event, rosterUrl }) => {
  const isGame = event.eventType === 'Game';
  
  return (
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
      <td className="py-4 px-6">
        <div className={`inline-flex items-center gap-2 font-medium ${isGame ? 'text-blue-800' : 'text-blue-400'}`}>
          {isGame ? <Disc className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          <span>{event.summary}</span>
        </div>
      </td>
      <td className="py-4 px-6 text-gray-600">{event.time}</td>
      <td className="py-4 px-6 text-gray-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="break-words">{event.location}</span>
        </div>
      </td>
    </tr>
  );
};

async function fetchEvents() {
  try {
    const response = await fetch('https://hockey-calendar.onrender.com/api/events');
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

const FilterSelect = React.memo(({ label, type, options, value, onChange, placeholder, className = "" }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <Select 
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
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

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [filters, setFilters] = useState({
    eventType: 'All',
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
    // Get unique values while preserving order for key categories
    const eventTypes = ['All', 'Game', 'Practice'];
    const sexOptions = ['All', ...new Set(TEAM_CONFIG.map(team => team.sex))];
    
    // Custom sort function for age groups
    const ageOrder = ['Peewee', '12U', 'Bantam', '15U'];
    const ageOptions = ['All', ...new Set(TEAM_CONFIG.map(team => team.age))]
      .sort((a, b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return ageOrder.indexOf(a) - ageOrder.indexOf(b);
      });

    const teamLevels = ['All', ...new Set(TEAM_CONFIG.map(team => team.team))];
    const locations = new Set(events.filter(e => e.location).map(e => e.location));

    return {
      eventType: eventTypes,
      sex: sexOptions,
      age: ageOptions,
      team: teamLevels,
      location: ['All', ...Array.from(locations).sort()]
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Get the start of yesterday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
  
      // Filter past events, but include yesterday
      if (!showPastEvents && eventDate < yesterday) {
        return false;
      }
  
      // Apply other filters
      const matchEventType = filters.eventType === 'All' || event.eventType === filters.eventType;
      const matchSex = filters.sex === 'All' || event.sex === filters.sex;
      const matchAge = filters.age === 'All' || event.age === filters.age;
      const matchTeam = filters.team === 'All' || event.team.includes(filters.team);
      const matchLocation = filters.location === 'All' || event.location === filters.location;
      
      return matchEventType && matchSex && matchAge && matchTeam && matchLocation;
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

  const filterControls = useMemo(() => [
    {
      label: 'Type',  // Shortened from 'Event Type'
      type: 'eventType',
      options: filterOptions.eventType,
      placeholder: 'Select Type',
      className: 'w-32' // Width for short list (All, Game, Practice)
    },
    {
      label: 'Program',
      type: 'sex',
      options: filterOptions.sex,
      placeholder: 'Select Program',
      className: 'w-36' // Width for Boys/Girls
    },
    {
      label: 'Age',
      type: 'age',
      options: filterOptions.age,
      placeholder: 'Select Age',
      className: 'w-36' // Width for age groups
    },
    {
      label: 'Team',
      type: 'team',
      options: filterOptions.team,
      placeholder: 'Select Team',
      className: 'w-40' // Width for team levels (AA, A, B1 Gray, etc.)
    },
    {
      label: 'Location',
      type: 'location',
      options: filterOptions.location,
      placeholder: 'Select Location',
      className: 'flex-1 min-w-[200px]' // Location gets remaining space
    }
  ], [filterOptions]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
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
              {showPastEvents ? 'Showing Past Events' : 'Hide Past Events'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {filterControls.map(control => (
              <FilterSelect
                key={control.type}
                label={control.label}
                value={filters[control.type]}
                options={control.options}
                onChange={(value) => handleFilterChange(control.type, value)}
                placeholder={control.placeholder}
                className={control.className}
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
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="w-1/4 py-3 px-6 text-left text-sm font-semibold text-gray-600">Team</th>
                        <th className="w-1/4 py-3 px-6 text-left text-sm font-semibold text-gray-600">Event</th>
                        <th className="w-1/4 py-3 px-6 text-left text-sm font-semibold text-gray-600">Time</th>
                        <th className="w-1/4 py-3 px-6 text-left text-sm font-semibold text-gray-600">Location</th>
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
                <p className="text-gray-500 text-lg">No events found matching the selected filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}