// frontend/js/calendar/calendar.js
import { createCalendarEvent, deleteCalendarEvent, fetchCalendarEvents, fetchCalendarHolidays, updateCalendarEvent } from '/js/calendar/api.js';
import { formatKoreanDate, toDateKey } from '/js/calendar/date-util.js';
import { calendarDom as DOM } from '/js/calendar/dom.js';
// 🔥 보완 1: 다른 화면과 동일하게 통합된 authService를 사용합니다.
import { authService } from '/js/auth/authService.js';

let calendar = null;
let selectedDate = toDateKey(new Date());
let events = [];
let currentUser = null; // 유저 정보 담을 변수 유지
let holidaysByDate = new Map();
let loadedHolidayYears = new Set();
let editingEventId = null;

// --- 💡 [DOM 캐싱] 문서 전체 탐색을 최소화하여 성능 향상 ---
// --- 💡 [유틸리티] 보안 및 포맷팅 ---
function escapeHTML(value) {
    if (!value) return '';
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
}

async function loadHolidaysForRange(start, end) {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const yearsToLoad = [];

    // 이미 불러온 연도는 통신하지 않도록 캐싱 활용
    if (!loadedHolidayYears.has(startYear)) yearsToLoad.push(startYear);
    if (startYear !== endYear && !loadedHolidayYears.has(endYear)) yearsToLoad.push(endYear);

    if (yearsToLoad.length === 0) return; // 새로 가져올 데이터가 없으면 즉시 종료

    try {
        // 병렬 통신으로 속도 향상
        await Promise.all(yearsToLoad.map(async (year) => {
            const data = await fetchCalendarHolidays(year);
            data.forEach(holiday => {
                holidaysByDate.set(holiday.date, holiday.localName || holiday.name || '');
            });
            loadedHolidayYears.add(year);
        }));
    } catch (error) {
        console.error('공휴일 데이터를 불러오지 못했습니다.', error);
    }
}

function applyDayColor(dayEl, dateText) {
    dayEl.classList.remove('calendar-public-holiday', 'calendar-saturday', 'calendar-sunday');
    dayEl.removeAttribute('title');
    dayEl.querySelector('.calendar-holiday-label')?.remove();

    const holidayName = holidaysByDate.get(dateText);
    if (holidayName) {
        dayEl.classList.add('calendar-public-holiday');
        dayEl.setAttribute('title', holidayName);
        const dayTop = dayEl.querySelector('.fc-daygrid-day-top');
        if (dayTop) {
            const dayNumber = dayTop.querySelector('.fc-daygrid-day-number');
            const holidayLabel = document.createElement('span');
            holidayLabel.className = 'calendar-holiday-label';
            holidayLabel.textContent = holidayName;
            if (dayNumber) {
                dayNumber.textContent = `${new Date(`${dateText}T00:00:00`).getDate()}일`;
                dayTop.replaceChildren(dayNumber, holidayLabel);
            } else {
                dayTop.prepend(holidayLabel);
            }
        }
        return;
    }

    const day = new Date(`${dateText}T00:00:00`).getDay();
    if (day === 0) {
        dayEl.classList.add('calendar-sunday');
    } else if (day === 6) {
        dayEl.classList.add('calendar-saturday');
    }
}

function paintCalendarDayColors() {
    // 달력 내의 모든 날짜 셀을 찾아서 공휴일 색상을 다시 덮어씌웁니다.
    const dayCells = DOM.calendar().querySelectorAll('.fc-daygrid-day');
    dayCells.forEach(cell => {
        const dateKey = cell.getAttribute('data-date');
        applyDayColor(cell, dateKey);
    });
}

function setEditMode(eventId = null) {
    editingEventId = eventId;

    if (DOM.submitButton()) {
        DOM.submitButton().textContent = editingEventId ? '일정 수정' : '일정 추가';
    }

    if (DOM.cancelButton()) {
        DOM.cancelButton().hidden = !editingEventId;
    }
}

function clearFormTitle() {
    if (DOM.titleInput()) DOM.titleInput().value = '';
}

function startEdit(eventId) {
    if (!currentUser) {
        alert('로그인 후 일정을 수정할 수 있습니다.');
        return;
    }

    const targetEvent = events.find(event => String(event.id) === String(eventId));
    if (!targetEvent) return;

    selectedDate = targetEvent.start;
    if (DOM.titleInput()) DOM.titleInput().value = targetEvent.title;
    if (DOM.dateInput()) DOM.dateInput().value = targetEvent.start;
    if (DOM.colorInput()) DOM.colorInput().value = targetEvent.color || '#ef4444';

    setEditMode(targetEvent.id);
    calendar?.select(new Date(`${selectedDate}T00:00:00`));
    renderDetail();
}
function resetFormState() {
    editingEventId = null;
    if (DOM.titleInput()) DOM.titleInput().value = '';
    // 날짜는 선택된 날짜로 유지
    if (DOM.dateInput()) DOM.dateInput().value = selectedDate; 
    
    // UI 원상복구
    if (DOM.submitButton()) DOM.submitButton().textContent = '등록';
    if (DOM.cancelButton()) DOM.cancelButton().hidden = true;
}
function cancelEdit() {
    setEditMode(null);
    clearFormTitle();
    renderDetail();
}

// --- 💡 [데이터 및 UI 렌더링] ---
function renderDetail() {
    const { dateInput, selectedDateTitle, eventCount, eventList } = DOM;
    const currentEvents = events.filter(event => event.start === selectedDate);

    if (dateInput()) dateInput().value = selectedDate;
    if (selectedDateTitle()) selectedDateTitle().textContent = formatKoreanDate(selectedDate);
    if (eventCount()) eventCount().textContent = currentEvents.length;

    const listEl = eventList();
    if (!listEl) return;

    if (currentEvents.length === 0) {
        listEl.innerHTML = '<li class="empty-msg">등록된 일정이 없습니다.</li>';
        return;
    }

    listEl.innerHTML = currentEvents.map(event => {
        const canManage = Boolean(currentUser);
        const actionsHtml = canManage
            ? `
                <div class="event-actions">
                    <button type="button" class="edit-event-btn" data-event-id="${event.id}" title="수정">수정</button>
                    <button type="button" class="delete-event-btn" data-event-id="${event.id}" title="삭제">&times;</button>
                </div>
            `
            : '';

        return `
            <li class="event-item" style="border-left: 5px solid ${escapeHTML(event.color)}">
                <div class="event-info">
                    <span class="event-title">${escapeHTML(event.title)}</span>
                </div>
                ${actionsHtml}
            </li>
        `;
    }).join('');
}

async function loadEvents() {
    try {
        events = await fetchCalendarEvents();
        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(events);
        }
        renderDetail();
        paintCalendarDayColors();
    } catch (error) {
        console.error('일정을 불러오지 못했습니다:', error);
    }
}

// --- 💡 [이벤트 핸들러] ---
async function handleSubmit(event) {
    event.preventDefault();
    const title = DOM.titleInput()?.value.trim();
    const start = DOM.dateInput()?.value;
    const color = DOM.colorInput()?.value;

    if (!title) return alert('일정 제목을 입력해 주세요.');

    const payload = { title, start, color };
    
    try {
        if (editingEventId) {
            // 🔥 수정 모드일 때
            await updateCalendarEvent(editingEventId, payload);
            alert('일정이 수정되었습니다.');
        } else {
            // 🔥 신규 등록 모드일 때
            await createCalendarEvent(payload);
        }

        selectedDate = start; // 렌더링 기준일을 수정한 날짜로 이동
        resetFormState();     // 폼 완벽 초기화
        await loadEvents();   // 데이터 재조회 및 화면 갱신
    } catch (error) {
        alert(error.message || '일정 저장에 실패했습니다.');
    }
}

async function handleEventListClick(event) {
    const target = event.target;
    
    // 1) 삭제 버튼 클릭 시
    const deleteBtn = target.closest('.delete-event-btn');
    if (deleteBtn) {
        if (!confirm('이 일정을 삭제할까요?')) return;
        try {
            await deleteCalendarEvent(deleteBtn.dataset.eventId);
            // 만약 현재 수정 중인 일정을 삭제했다면 폼도 같이 초기화
            if (editingEventId === deleteBtn.dataset.eventId) resetFormState();
            await loadEvents();
        } catch (error) {
            alert(error.message || '일정 삭제에 실패했습니다.');
        }
        return;
    }

    // 2) 수정 버튼(또는 일정 자체) 클릭 시
    const editBtn = target.closest('.edit-event-btn'); // HTML에 수정 버튼을 추가하셨다고 가정
    if (editBtn) {
        const eventId = Number(editBtn.dataset.eventId);
        const eventData = events.find(e => e.id === eventId);
        if (!eventData) return;

        // 폼에 기존 데이터 채우기
        editingEventId = eventId;
        if (DOM.titleInput()) DOM.titleInput().value = eventData.title;
        if (DOM.dateInput()) DOM.dateInput().value = eventData.start;
        if (DOM.colorInput()) DOM.colorInput().value = eventData.color;
        
        // UI 변경
        if (DOM.submitButton()) DOM.submitButton().textContent = '수정';
        if (DOM.cancelButton()) DOM.cancelButton().hidden = false;
        
        // 작성칸으로 스크롤 부드럽게 이동 (UX 개선)
        DOM.form()?.scrollIntoView({ behavior: 'smooth' });
    }
}

function initCalendar() {
    const calendarEl = DOM.calendar();
    if (!calendarEl || typeof FullCalendar === 'undefined') return;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ko',
        height: 'auto',
        events: events,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        
        // 🔥 1. 하이라이트 기능 활성화
        selectable: true,
        unselectAuto: false, // 달력 밖(하단 폼 등)을 클릭해도 하이라이트가 사라지지 않도록 유지
        
        // 🔥 2. dateClick 대신 select 이벤트를 사용하여 네이티브 하이라이트 적용
        select: (info) => {
            selectedDate = info.startStr.slice(0, 10);
            renderDetail();
        },
        
        // 🔥 3. 이미 등록된 '일정'을 클릭했을 때도 해당 날짜로 하이라이트 이동
        eventClick: (info) => {
            selectedDate = info.event.startStr.slice(0, 10);
            calendar.select(info.event.start); // 달력에 강제로 하이라이트 표시
            renderDetail();
        },
        dayCellDidMount: (info) => {
            applyDayColor(info.el, toDateKey(info.date));
        },
        datesSet: async (info) => {
            await loadHolidaysForRange(info.start, info.end);
            paintCalendarDayColors();
        },
    });

    calendar.render();

    // 🔥 4. 달력이 처음 로딩되었을 때 '오늘 날짜'에 기본적으로 하이라이트 표시
    calendar.select(new Date(selectedDate)); 
}

// --- 💡 [생명주기 관리] ---
export async function init() {
    selectedDate = toDateKey(new Date());
    
    // 🔥 보완 1 적용: authService를 사용하여 안전하고 빠르게 유저 정보 캐싱
    currentUser = await authService.verifySession();
    
    // 1. 달력 초기화 및 데이터 로드
    initCalendar();
    await loadEvents();

    // 2. 이벤트 바인딩 (중복 등록 방지를 위해 onclick/onsubmit 활용)
    const form = DOM.form();
    const eventList = DOM.eventList();
    const cancelButton = DOM.cancelButton();

    if (form) form.onsubmit = handleSubmit;
    if (eventList) eventList.onclick = handleEventListClick;
    if (cancelButton) cancelButton.onclick = cancelEdit;
}

export function cleanup() {
    if (calendar) {
        calendar.destroy();
        calendar = null;
    }
    if (DOM.form()) DOM.form().onsubmit = null;
    if (DOM.eventList()) DOM.eventList().onclick = null;
    if (DOM.cancelButton()) DOM.cancelButton().onclick = null;
    
    events = [];
    currentUser = null;
    
    // 🔥 새로 추가된 상태 변수 초기화
    holidaysByDate.clear();
    loadedHolidayYears.clear();
    resetFormState();
}
