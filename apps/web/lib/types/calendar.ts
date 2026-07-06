export interface CalendarEvent {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  isAllDay: boolean;
  organizer: string | null;
  attendees: string[];
  status: string;
  travelTime: number;
  requiredDocuments: string[];
  relatedEmails: string[];
  relatedTasks: string[];
  relatedProjects: string[];
  aiRecommendations: string[];
}

export interface CalendarConflict {
  id: string;
  summary: string;
  event1: CalendarEvent;
  event2: CalendarEvent;
  aiRecommendation: string;
}

export interface CalendarTravelEvent {
  id: string;
  summary: string;
  departure: string;
  arrival: string;
  documents: string[];
  relatedEmails: string[];
  relatedTasks: string[];
}

export interface CalendarFreeBlock {
  id: string;
  start: string;
  end: string;
  suggestedActivity: string;
}
