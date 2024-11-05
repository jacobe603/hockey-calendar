import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ical from 'node-ical';



const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://hockey-calendar.vercel.app'  // We'll update this after Vercel deployment
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Team configuration
const TEAM_CONFIG = [
  { sex: 'Boys', age: 'Bantam', team: 'AA', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551014' },
  { sex: 'Boys', age: 'Bantam', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551013' },
  { sex: 'Boys', age: 'Bantam', team: 'B1 Gray', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551019' },
  { sex: 'Boys', age: 'Bantam', team: 'B1 Navy', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551020' },
  { sex: 'Boys', age: 'Peewee', team: 'AA', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551060' },
  { sex: 'Boys', age: 'Peewee', team: 'A', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551058' },
  { sex: 'Boys', age: 'Peewee', team: 'B1 Gray', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551066' },
  { sex: 'Boys', age: 'Peewee', team: 'B1 Navy', icalUrl: 'webcal://www.fargohockey.org/ical_feed?tags=8551067' }
];

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
      
      // Create a unique ID by combining multiple fields
      const uniqueId = `${uid}_${dateStr}_${timeStr}_${teamInfo.team}`.replace(/\s+/g, '_');
      
      processedEvents.push({
        id: uniqueId,  // Use the new unique ID
        team: `${teamInfo.age} ${teamInfo.team}`,
        age: teamInfo.age,
        sex: teamInfo.sex,
        date: dateStr,
        time: timeStr,
        summary: event.summary,
        location: event.location || 'TBD',
        description: event.description || '',
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

async function fetchCalendarData(icalUrl) {
  try {
    // Convert webcal:// to https://
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

app.get('/api/events', async (req, res) => {
  try {
    // Fetch all calendars
    const allEvents = [];
    for (const team of TEAM_CONFIG) {
      const icalEvents = await fetchCalendarData(team.icalUrl);
      if (icalEvents) {
        const processedEvents = processICalEvents(icalEvents, team);
        allEvents.push(...processedEvents);
      }
    }

    // Sort events by date and time
    allEvents.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});