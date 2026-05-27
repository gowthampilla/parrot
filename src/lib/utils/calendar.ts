export interface CalendarEventData {
    title: string;
    description: string;
    location: string;
    startTime: string; // ISO String or Date
    endTime?: string;   // ISO String or Date
  }
  
  // Formats dates to YYYYMMDDTHHMMSSZ required by calendar providers
  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  }
  
  export function generateGoogleCalendarUrl(event: CalendarEventData): string {
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    
    // Set default duration to 2 hours if end time isn't explicitly provided
    const start = formatDateTime(event.startTime);
    const end = event.endTime 
      ? formatDateTime(event.endTime) 
      : formatDateTime(new Date(new Date(event.startTime).getTime() + 2 * 60 * 60 * 1000).toISOString());
  
    const params = new URLSearchParams({
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description,
      location: event.location,
      sf: "true",
      output: "xml"
    });
  
    return `${base}&${params.toString()}`;
  }
  
  export function generateIcsBlobUrl(event: CalendarEventData): string {
    const start = formatDateTime(event.startTime);
    const end = event.endTime 
      ? formatDateTime(event.endTime) 
      : formatDateTime(new Date(new Date(event.startTime).getTime() + 2 * 60 * 60 * 1000).toISOString());
  
    // Strict ICS file standard layout
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Quad//Network Event//EN",
      "BEGIN:VEVENT",
      `URL:${typeof window !== "undefined" ? window.location.href : ""}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
      `LOCATION:${event.location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    return URL.createObjectURL(blob);
  }