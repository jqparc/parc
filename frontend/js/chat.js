import { fetchAPI } from '/js/api.js';

const messages = [
    {
        role: 'assistant',
        content: '안녕하세요. Gemini 기반 경제 뉴스 AI 비서입니다. 궁금한 뉴스나 시장 이슈를 보내주시면 핵심 요인과 리스크를 정리해드릴게요.',
    },
];

const DOM = {
    form: () => document.querySelector('#gpt-form'),
    input: () => document.querySelector('#gpt-input'),
    messages: () => document.querySelector('#gpt-messages'),
    button: () => document.querySelector('#gpt-send-button'),
};

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function renderMessageText(content) {
    return escapeHTML(content).replace(/\n/g, '<br>');
}

function scrollToBottom() {
    const container = DOM.messages();
    if (container) container.scrollTop = container.scrollHeight;
}

function renderMessages({ loading = false } = {}) {
    const container = DOM.messages();
    if (!container) return;

    container.innerHTML = messages.map(message => `
        <article class="gpt-message ${message.role}">
            <div class="gpt-bubble">${renderMessageText(message.content)}</div>
        </article>
    `).join('');

    if (loading) {
        container.insertAdjacentHTML('beforeend', `
            <article class="gpt-message assistant">
                <div class="gpt-bubble gpt-loading" aria-label="응답 생성 중">
                    <span></span><span></span><span></span>
                </div>
            </article>
        `);
    }

    scrollToBottom();
}

function setLoading(isLoading) {
    if (DOM.button()) DOM.button().disabled = isLoading;
    if (DOM.input()) DOM.input().disabled = isLoading;
    renderMessages({ loading: isLoading });
}

function resizeInput() {
    const input = DOM.input();
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

async function sendMessage(content) {
    messages.push({ role: 'user', content });
    setLoading(true);

    try {
        const response = await fetchAPI('/gemini/chat', {
            method: 'POST',
            body: JSON.stringify({ messages }),
        });
        messages.push({ role: 'assistant', content: response.reply });
    } catch (error) {
        messages.push({
            role: 'assistant',
            content: error.message || '응답을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        });
    } finally {
        setLoading(false);
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const input = DOM.input();
    const content = input?.value.trim();
    if (!content) return;

    input.value = '';
    resizeInput();
    await sendMessage(content);
}

function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        DOM.form()?.requestSubmit();
    }
}

export function init() {
    renderMessages();
    DOM.form()?.addEventListener('submit', handleSubmit);
    DOM.input()?.addEventListener('keydown', handleKeydown);
    DOM.input()?.addEventListener('input', resizeInput);
}

export function cleanup() {
    DOM.form()?.removeEventListener('submit', handleSubmit);
    DOM.input()?.removeEventListener('keydown', handleKeydown);
    DOM.input()?.removeEventListener('input', resizeInput);
}
