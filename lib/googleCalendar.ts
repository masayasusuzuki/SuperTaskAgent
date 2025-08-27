import { google } from 'googleapis';
import { getGoogleCalendarConfig } from './config';

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

export class GoogleCalendarService {
  private oauth2Client: any;

  constructor() {
    const config = getGoogleCalendarConfig();
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  // 認証URL生成 - スコープを拡張
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/calendar.calendars.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // アクセストークン取得
  async getTokensFromCode(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  // カレンダーリスト取得 - 詳細情報を含める
  async getCalendarList(accessToken: string): Promise<GoogleCalendar[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.calendarList.list({
        minAccessRole: 'reader' // 読み取り権限があるカレンダーのみ
      });
      
      console.log('Calendar list response:', response.data);
      
      return (response.data.items || []).map(cal => ({
        id: cal.id!,
        summary: cal.summary!,
        description: cal.description || undefined,
        backgroundColor: cal.backgroundColor || undefined,
        foregroundColor: cal.foregroundColor || undefined,
        selected: true, // すべてのカレンダーをデフォルトで選択
        accessRole: cal.accessRole || undefined,
        primary: cal.primary || undefined
      }));
    } catch (error) {
      console.error('Error getting calendar list:', error);
      throw error;
    }
  }

  // イベント取得 - 招待されたイベントも含める
  async getEvents(
    calendarId: string, 
    timeMin: string, 
    timeMax: string, 
    accessToken: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false,
        maxResults: 2500, // より多くのイベントを取得
        fields: 'items(id,summary,description,start,end,colorId,organizer,attendees)' // 必要なフィールドのみ
      });
      
      console.log(`Events for calendar ${calendarId}:`, response.data.items?.length || 0);
      
      return (response.data.items || []).map(event => ({
        id: event.id!,
        summary: event.summary || 'タイトルなし',
        description: event.description,
        start: event.start!,
        end: event.end!,
        colorId: event.colorId,
        organizer: event.organizer,
        attendees: event.attendees
      }));
    } catch (error) {
      console.error(`Error getting events for calendar ${calendarId}:`, error);
      
      // 権限エラーの詳細表示
      if (error.code === 403) {
        console.error('Permission denied for calendar:', calendarId);
        console.error('Error details:', error.message);
      }
      
      throw error;
    }
  }

  // 複数カレンダーのイベント取得 - エラーハンドリング強化
  async getMultipleCalendarEvents(
    calendarIds: string[],
    timeMin: string,
    timeMax: string,
    accessToken: string
  ): Promise<{ calendarId: string; events: GoogleCalendarEvent[] }[]> {
    console.log('Fetching events for calendars:', calendarIds);
    console.log('Time range:', timeMin, 'to', timeMax);
    
    const promises = calendarIds.map(async (calendarId) => {
      try {
        const events = await this.getEvents(calendarId, timeMin, timeMax, accessToken);
        console.log(`Successfully fetched ${events.length} events from ${calendarId}`);
        return { calendarId, events };
      } catch (error) {
        console.error(`Error getting events for calendar ${calendarId}:`, error);
        // エラーが発生しても他のカレンダーは継続
        return { calendarId, events: [] };
      }
    });

    const results = await Promise.all(promises);
    const totalEvents = results.reduce((sum, result) => sum + result.events.length, 0);
    console.log(`Total events fetched: ${totalEvents}`);
    
    return results;
  }
}

// シングルトンインスタンス
export const googleCalendarService = new GoogleCalendarService();
