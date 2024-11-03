'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Loader2, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';

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

const EventCard = ({ event, rosterUrl }) => {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="flex flex-col bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-blue-600">
            {rosterUrl ? (
              <a 
                href={rosterUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1 hover:underline"
              >
                {event.team}
                <Users className="h-4 w-4" />
              </a>
            ) : (
              event.team
            )}
          </span>
          <span className="text-gray-600">vs</span>
          <span className="font-medium">{event.opponent || event.summary}</span>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            {showDebug ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-4 text-gray-600 mt-2 md:mt-0">
          <span>{event.time}</span>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </div>
      </div>
      {showDebug && (
        <div className="mt-2 text-xs font-mono bg-white p-2 rounded border border-gray-200">
          <div>Original ISO: {event.debug.originalISOString}</div>
          <div>Original Timezone: {event.debug.originalTimezone}</div>
          <div>Parsed Central: {event.debug.parsedCentralTime}</div>
          <div>Computed Date: {event.debug.computedDate}</div>
          <div>Computed Time: {event.debug.computedTime}</div>
          <div>Display Date: {event.date}</div>
          <div>Display Time: {event.time}</div>
        </div>
      )}
    </div>
  );
};

async function fetchEvents() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`);
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

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchSex = filters.sex === 'All' || event.sex === filters.sex;
      const matchAge = filters.age === 'All' || event.age === filters.age;
      const matchTeam = filters.team === 'All' || event.team.includes(filters.team);
      const matchLocation = filters.location === 'All' || event.location === filters.location;
      
      return matchSex && matchAge && matchTeam && matchLocation;
    });
  }, [events, filters]);

  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const date = event.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getRosterUrl = (teamName) => {
    const teamConfig = TEAM_CONFIG.find(config => 
      `${config.age} ${config.team}` === teamName
    );
    return teamConfig?.rosterUrl;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="h-7 w-7 text-blue-600" />
            Fargo Freeze Hockey Schedule
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(filterOptions).map(([filterType, options]) => (
              <Select 
                key={filterType}
                value={filters[filterType]}
                onValueChange={(value) => handleFilterChange(filterType, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filterType.charAt(0).toUpperCase() + filterType.slice(1)} />
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
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date} className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold mb-4 text-lg text-gray-800">
                    {formatEventDate(date)}
                  </h3>
                  <div className="space-y-3">
                    {dayEvents.map(event => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        rosterUrl={getRosterUrl(event.team)} 
                      />
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedEvents).length === 0 && (
                <div className="text-center p-8 text-gray-500">
                  No events found matching the selected filters
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}