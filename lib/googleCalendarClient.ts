export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
  }>;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole?: string;
  primary?: boolean;
}

export class GoogleCalendarClientService {
  private apiUrl = '/api/google-calendar';

  // 認証URL生成
  async getAuthUrl(): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getAuthUrl' }),
    });

    const data = await response.json();
    return data.authUrl;
  }

  // アクセストークン取得
  async getTokensFromCode(code: string) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getTokensFromCode', code }),
    });

    const data = await response.json();
    return data.tokens;
  }

  // カレンダーリスト取得
  async getCalendarList(accessToken: string): Promise<GoogleCalendar[]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getCalendarList', accessToken }),
    });

    const data = await response.json();
    return data.calendars;
  }

  // イベント取得
  async getEvents(
    calendarId: string,
    timeMin: string,
    timeMax: string,
    accessToken: string
  ): Promise<GoogleCalendarEvent[]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'getEvents', 
        calendarId, 
        timeMin, 
        timeMax, 
        accessToken 
      }),
    });

    const data = await response.json();
    return data.events;
  }

  // 複数カレンダーのイベント取得
  async getMultipleCalendarEvents(
    calendarIds: string[],
    timeMin: string,
    timeMax: string,
    accessToken: string
  ): Promise<{ calendarId: string; events: GoogleCalendarEvent[] }[]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'getMultipleCalendarEvents', 
        calendarIds, 
        timeMin, 
        timeMax, 
        accessToken 
      }),
    });

    const data = await response.json();
    return data.eventsData;
  }
}

// シングルトンインスタンス
export const googleCalendarClientService = new GoogleCalendarClientService();
