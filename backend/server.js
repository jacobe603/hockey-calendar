import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ical from 'node-ical';

const app = express();

// CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://hockey-calendar.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Add cache object here
const cache = {
  data: null,
  lastFetched: null,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Team configuration
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

function getEventType(description) {
  if (!description) return 'Unknown';
  if (description.includes('sportsengine%3A%2F%2Fgame')) {
    return 'Game';
  } else if (description.includes('sportsengine%3A%2F%2Fevent')) {
    return 'Practice';
  }
  return 'Other';
}

async function fetchCalendarData(icalUrl) {
  try {
    const httpsUrl = icalUrl.replace('webcal://', 'https://');
    const response = await fetch(httpsUrl);
    const icalData = await response.text();
    
    return await new Promise((resolve, reject) => {
      ical.parseICS(icalData, (error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return null;
  }
}

function processICalEvents(events, teamInfo) {
  const processedEvents = [];
  
  for (const [uid, event] of Object.entries(events)) {
    if (event.type === 'VEVENT') {
      const originalStart = event.start;
      const centralTime = originalStart.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const [month, day, year] = centralTime.split(',')[0].split('/');
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const timeStr = originalStart.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const uniqueId = `${uid}_${dateStr}_${timeStr}_${teamInfo.team}`.replace(/\s+/g, '_');
      
      processedEvents.push({
        id: uniqueId,
        team: `${teamInfo.age} ${teamInfo.team}`,
        age: teamInfo.age,
        sex: teamInfo.sex,
        date: dateStr,
        time: timeStr,
        summary: event.summary,
        location: event.location || 'TBD',
        description: event.description || '',
        eventType: getEventType(event.description),
        debug: {
          originalISOString: originalStart.toISOString(),
          originalTimezone: originalStart.tz || 'UTC',
          parsedCentralTime: centralTime,
          computedDate: dateStr,
          computedTime: timeStr
        }
      });
    }
  }
  
  return processedEvents;
}

// Helper function for time sorting
function timeToMinutes(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Replace your existing endpoint with this cached version
app.get('/api/events', async (req, res) => {
  try {
    // Check if we have valid cached data
    if (cache.data && cache.lastFetched && 
        (Date.now() - cache.lastFetched) < cache.CACHE_DURATION) {
      console.log('Serving cached data');
      return res.json(cache.data);
    }

    console.log('Fetching fresh data');
    // If no cache or expired, fetch fresh data
    const allEvents = [];
    for (const team of TEAM_CONFIG) {
      const icalEvents = await fetchCalendarData(team.icalUrl);
      if (icalEvents) {
        const processedEvents = processICalEvents(icalEvents, team);
        allEvents.push(...processedEvents);
      }
    }

    // Sort events
    allEvents.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return timeToMinutes(a.time) - timeToMinutes(b.time);
      return 0;
    });

    // Update cache
    cache.data = allEvents;
    cache.lastFetched = Date.now();

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    // If error occurs but we have cached data, return it
    if (cache.data) {
      console.log('Error occurred, serving cached data');
      return res.json(cache.data);
    }
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});