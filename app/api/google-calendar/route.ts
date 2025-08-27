import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/googleCalendar';

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'getAuthUrl':
        const authUrl = googleCalendarService.getAuthUrl();
        return NextResponse.json({ authUrl });

      case 'getTokensFromCode':
        const { code } = data;
        const tokens = await googleCalendarService.getTokensFromCode(code);
        return NextResponse.json({ tokens });

      case 'getCalendarList':
        const { accessToken } = data;
        const calendars = await googleCalendarService.getCalendarList(accessToken);
        return NextResponse.json({ calendars });

      case 'getEvents':
        const { calendarId, timeMin, timeMax, accessToken: token } = data;
        const events = await googleCalendarService.getEvents(calendarId, timeMin, timeMax, token);
        return NextResponse.json({ events });

      case 'getMultipleCalendarEvents':
        const { calendarIds, timeMin: min, timeMax: max, accessToken: token2 } = data;
        const eventsData = await googleCalendarService.getMultipleCalendarEvents(calendarIds, min, max, token2);
        return NextResponse.json({ eventsData });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Google Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
