export const calendarDom = {
    calendar: () => document.querySelector('#calendar'),
    form: () => document.querySelector('#calendar-form'),
    titleInput: () => document.querySelector('#event-title'),
    dateInput: () => document.querySelector('#event-date'),
    colorInput: () => document.querySelector('#event-color'),
    submitButton: () => document.querySelector('#event-submit-button'),
    cancelButton: () => document.querySelector('#event-cancel-button'),
    selectedDateTitle: () => document.querySelector('#selected-date-title'),
    eventCount: () => document.querySelector('#selected-event-count'),
    eventList: () => document.querySelector('#selected-event-list'),
};
