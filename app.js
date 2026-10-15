// ============ КОНФИГУРАЦИЯ ============
const CONFIG_URL = 'configs.json';
let ALL_SERVERS = [];
let CURRENT_SORT = 'ping';
let CURRENT_SEARCH = '';

// ============ ЭМОДЗИ ФЛАГОВ ПО КОДУ СТРАНЫ ============
function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// ============ ОПРЕДЕЛЕНИЕ ЦВЕТА ПИНГА ============
function getPingClass(ping) {
    if (ping < 150) return 'ping-good';
    if (ping < 350) return 'ping-mid';
    return 'ping-slow';
}

// ============ ЭКРАНИРОВАНИЕ HTML ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ ЗАГРУЗКА ДАННЫХ ============
async function loadConfigs() {
    try {
        const response = await fetch(CONFIG_URL);
        if (!response.ok) throw new Error('Не удалось загрузить файл');
        const data = await response.json();

        ALL_SERVERS = data.servers || [];

        // Обновляем статистику
        const countries = new Set(ALL_SERVERS.map(s => s.country).filter(Boolean));
        document.getElementById('total-servers').textContent = ALL_SERVERS.length;
        document.getElementById('total-countries').textContent = countries.size;

        if (ALL_SERVERS.length > 0) {
            const avg = Math.round(
                ALL_SERVERS.reduce((sum, s) => sum + (s.ping_ms || 0), 0) / ALL_SERVERS.length
            );
            document.getElementById('avg-ping').textContent = avg + ' мс';
        } else {
            document.getElementById('avg-ping').textContent = '—';
        }

        renderServers();
    } catch (err) {
        console.error(err);
        document.getElementById('configs-list').innerHTML = `
            <div class="empty-state">
                <h3>Не удалось загрузить серверы</h3>
                <p>Попробуйте обновить страницу позже.</p>
            </div>
        `;
    }
}

// ============ ОТРИСОВКА КАРТОЧЕК ============
function renderServers() {
    const container = document.getElementById('configs-list');

    // Фильтрация по поиску
    let filtered = ALL_SERVERS;
    if (CURRENT_SEARCH) {
        const q = CURRENT_SEARCH.toLowerCase();
        filtered = filtered.filter(s =>
            (s.country || '').toLowerCase().includes(q) ||
            (s.protocol || '').toLowerCase().includes(q) ||
            (s.city || '').toLowerCase().includes(q)
        );
    }

    // Сортировка
    if (CURRENT_SORT === 'ping') {
        filtered = [...filtered].sort((a, b) => (a.ping_ms || 9999) - (b.ping_ms || 9999));
    } else if (CURRENT_SORT === 'country') {
        filtered = [...filtered].sort((a, b) =>
            (a.country || '').localeCompare(b.country || '', 'ru')
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры поиска.</p>
            </div>
        `;
        return;
    }

    // Ограничиваем вывод 100 карточками для производительности
    const toRender = filtered.slice(0, 100);

    container.innerHTML = toRender.map((s, i) => {
        const flag = getFlagEmoji(s.country_code);
        const pingClass = getPingClass(s.ping_ms || 9999);
        const country = escapeHtml(s.country || 'Неизвестно');
        const city = escapeHtml(s.city || '');
        const protocol = escapeHtml((s.protocol || 'unknown').toUpperCase());
        const uri = escapeHtml(s.uri || '');
        const id = `uri-${i}`;

        return `
            <div class="config-card" style="animation-delay: ${i * 0.02}s">
                <div class="card-header">
                    <div class="country-block">
                        <span class="flag">${flag}</span>
                        <div class="country-info">
                            <span class="country-name">${country}</span>
                            ${city ? `<span class="city-name">${city}</span>` : ''}
                        </div>
                    </div>
                    <span class="ping-badge ${pingClass}">
                        <span class="ping-dot"></span>
                        ${s.ping_ms || '?'} мс
                    </span>
                </div>
                <span class="protocol-tag">${protocol}</span>
                <div class="uri-box">
                    <span class="uri-text" id="${id}" title="${uri}">${uri}</span>
                </div>
                <button class="copy-btn" data-copy="${id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Скопировать
                </button>
            </div>
        `;
    }).join('');

    // Навешиваем обработчики на кнопки
    container.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.copy;
            const text = document.getElementById(id).textContent;
            copyToClipboard(text, btn);
        });
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
        alert('Не удалось скопировать. Выделите текст вручную.');
    }
}

// ============ ПОИСК ============
document.getElementById('search').addEventListener('input', (e) => {
    CURRENT_SEARCH = e.target.value.trim();
    renderServers();
});

// ============ СОРТИРОВКА ============
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        CURRENT_SORT = btn.dataset.sort;
        renderServers();
    });
});

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