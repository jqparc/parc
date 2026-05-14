import { fetchAPI } from '/js/api.js';

export function fetchCalendarEvents() {
    return fetchAPI('/calendar');
}

export function createCalendarEvent(payload) {
    return fetchAPI('/calendar', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateCalendarEvent(eventId, payload) {
    return fetchAPI(`/calendar/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteCalendarEvent(eventId) {
    return fetchAPI(`/calendar/${eventId}`, { method: 'DELETE' });
}

export function fetchCalendarHolidays(year) {
    return fetchAPI(`/calendar/holiday?year=${year}`);
}
