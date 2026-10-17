// ============ КОНФИГУРАЦИЯ ============
const CONFIG_URL = 'configs.json';
let ALL_DATA = null;

// ============ ЭКРАНИРОВАНИЕ HTML ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

// ============ АБСОЛЮТНЫЙ URL ============
function absUrl(path) {
    return new URL(path, window.location.href).href;
}

// ============ ЗАГРУЗКА ============
async function loadConfigs() {
    try {
        const res = await fetch(CONFIG_URL);
        if (!res.ok) throw new Error('Не удалось загрузить configs.json');
        ALL_DATA = await res.json();

        // Статистика сверху
        document.getElementById('total-servers').textContent = ALL_DATA.total || 0;
        document.getElementById('total-countries').textContent = ALL_DATA.countries_total || 0;
        document.getElementById('total-lists').textContent = (ALL_DATA.lists || []).length;

        renderLists();
    } catch (err) {
        console.error(err);
        document.getElementById('configs-list').innerHTML = `
            <div class="empty-state">
                <h3>Не удалось загрузить данные</h3>
                <p>Попробуйте обновить страницу позже.</p>
            </div>
        `;
    }
}

// ============ ОТРИСОВКА СПИСКОВ ============
function renderLists() {
    const container = document.getElementById('configs-list');
    if (!ALL_DATA) return;

    const cards = [];

    // 1) Общая карточка «Все серверы»
    if (ALL_DATA.all) {
        const all = ALL_DATA.all;
        const allUrl = absUrl(all.sub_url);
        cards.push(`
            <div class="list-card featured" style="animation-delay: 0s">
                <div class="list-info">
                    <div class="list-header">
                        <span class="list-icon">🌍</span>
                        <span class="list-title">Все серверы</span>
                    </div>
                    <div class="list-stats">
                        <span>📡 <strong>${all.count}</strong> серверов</span>
                        <span>🌐 <strong>${all.countries_count}</strong> стран</span>
                        <span>⚡ средняя <strong>${all.avg_ping}</strong></span>
                    </div>
                    <div class="list-top">Одна ссылка — все серверы сразу</div>
                </div>
                <button class="copy-btn copy-sub" data-url="${escapeHtml(allUrl)}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Скопировать ссылку
                </button>
            </div>
        `);
    }

    // 2) Карточки списков по 60 серверов
    (ALL_DATA.lists || []).forEach((lst, i) => {
        const url = absUrl(lst.sub_url);
        const top = (lst.top_countries || []).join(' · ');

        cards.push(`
            <div class="list-card" style="animation-delay: ${(i + 1) * 0.05}s">
                <div class="list-info">
                    <div class="list-header">
                        <span class="list-icon">📦</span>
                        <span class="list-title">${escapeHtml(lst.title)}</span>
                    </div>
                    <div class="list-stats">
                        <span>📡 <strong>${lst.count}</strong> серверов</span>
                        <span>🌐 <strong>${lst.countries_count}</strong> стран</span>
                        <span>⚡ <strong>${lst.min_ping}–${lst.max_ping}</strong></span>
                    </div>
                    <div class="list-top"><strong>Топ:</strong> ${escapeHtml(top)}</div>
                </div>
                <button class="copy-btn copy-sub" data-url="${escapeHtml(url)}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Скопировать ссылку
                </button>
            </div>
        `);
    });

    if (cards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Пока нет списков</h3>
                <p>Данные появятся после следующего обновления.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cards.join('');

    // Обработчики кнопок
    container.querySelectorAll('.copy-sub').forEach(btn => {
        btn.addEventListener('click', () => copyToClipboard(btn.dataset.url, btn));
    });
}

// ============ КОПИРОВАНИЕ ============
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        const original = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Скопировано
        `;
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = original;
        }, 1800);
    } catch (err) {
        alert('Не удалось скопировать. Скопируйте вручную:\n\n' + text);
    }
}

// ============ ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ ============
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
});

// ============ СТАРТ ============
loadConfigs();
