// UI Controller
class PopupController {
    constructor() {
        this.elements = {
            promptInput: document.getElementById('promptInput'),
            enhanceButton: document.getElementById('enhanceButton'),
            copyButton: document.getElementById('copyButton'),
            clearButton: document.getElementById('clearButton'),
            settingsButton: document.getElementById('settingsButton'),
            resultContainer: document.getElementById('resultContainer'),
            status: document.getElementById('status'),
            charCount: document.querySelector('.char-count'),
            modeButtons: document.querySelectorAll('.mode-button')
        };

        this.currentMode = 'basic';
        this.isProcessing = false;

        this.init();
    }

    async init() {
        await this.loadSavedMode();
        await this.checkApiKey();
        this.attachEventListeners();
        this.elements.promptInput.focus();
    }

    /**
     * Загрузка сохраненного режима
     */
    async loadSavedMode() {
        return new Promise((resolve) => {
            chrome.storage.local.get([CONFIG.STORAGE_KEYS.LAST_MODE], (result) => {
                const savedMode = result[CONFIG.STORAGE_KEYS.LAST_MODE] || 'basic';
                this.setMode(savedMode);
                resolve();
            });
        });
    }

    /**
     * Проверка наличия API ключа
     */
    async checkApiKey() {
        const hasKey = await geminiAPI.initialize();

        if (!hasKey) {
            this.showStatus('⚙️ Необходимо настроить API ключ', 'info');
            this.elements.enhanceButton.disabled = true;
        } else {
            this.showStatus('✅ Готов к работе', 'success');
            setTimeout(() => this.hideStatus(), CONFIG.UI.STATUS_TIMEOUT);
        }
    }

    /**
     * Установка событий
     */
    attachEventListeners() {
        // Кнопки режимов
        this.elements.modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                this.setMode(mode);
                this.saveMode(mode);
            });
        });

        // Основные действия
        this.elements.enhanceButton.addEventListener('click', () => this.handleEnhance());
        this.elements.copyButton.addEventListener('click', () => this.handleCopy());
        this.elements.clearButton.addEventListener('click', () => this.handleClear());
        this.elements.settingsButton.addEventListener('click', () => this.openSettings());

        // Обработка ввода
        this.elements.promptInput.addEventListener('input', () => this.updateCharCount());
        this.elements.promptInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.handleEnhance();
            }
        });
    }

    /**
     * Установка режима
     */
    setMode(mode) {
        this.currentMode = mode;
        this.elements.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    /**
     * Сохранение режима
     */
    saveMode(mode) {
        chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.LAST_MODE]: mode });
    }

    /**
     * Обновление счетчика символов
     */
    updateCharCount() {
        const length = this.elements.promptInput.value.length;
        this.elements.charCount.textContent = `${length} / ${CONFIG.LIMITS.MAX_INPUT_LENGTH}`;

        if (length > CONFIG.LIMITS.MAX_INPUT_LENGTH * 0.9) {
            this.elements.charCount.style.color = 'var(--text-secondary)';
        }
    }

    /**
     * Обработка улучшения промпта
     */
    async handleEnhance() {
        if (this.isProcessing) return;

        const prompt = this.elements.promptInput.value.trim();

        if (!prompt) {
            this.showStatus('❌ Введите промпт для улучшения', 'error');
            this.elements.promptInput.focus();
            return;
        }

        if (prompt.length < CONFIG.LIMITS.MIN_INPUT_LENGTH) {
            this.showStatus(`❌ Минимум ${CONFIG.LIMITS.MIN_INPUT_LENGTH} символов`, 'error');
            return;
        }

        this.isProcessing = true;
        this.setProcessingState(true);
        this.showStatus('🔄 Улучшаем ваш промпт...', 'loading');

        try {
            const enhanced = await geminiAPI.enhancePrompt(prompt, this.currentMode);
            this.displayResult(enhanced);
            this.showStatus('✅ Промпт успешно улучшен!', 'success');

            // Автокопирование
            setTimeout(() => this.handleCopy(true), 500);
        } catch (error) {
            console.error('Enhancement error:', error);
            this.showStatus(`❌ Ошибка: ${error.message}`, 'error');
            this.displayResult('');
        } finally {
            this.isProcessing = false;
            this.setProcessingState(false);
        }
    }

    /**
     * Отображение результата
     */
    displayResult(text) {
        const isEmpty = !text || text.trim() === '';

        if (isEmpty) {
            this.elements.resultContainer.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                    <p>Здесь появится улучшенная версия вашего промпта</p>
                </div>
            `;
            this.elements.copyButton.disabled = true;
            this.elements.clearButton.style.display = 'none';
        } else {
            this.elements.resultContainer.textContent = text;
            this.elements.copyButton.disabled = false;
            this.elements.clearButton.style.display = 'block';
        }
    }

    /**
     * Копирование результата
     */
    async handleCopy(silent = false) {
        const text = this.elements.resultContainer.textContent;

        if (!text || text.includes('Здесь появится')) {
            if (!silent) {
                this.showStatus('❌ Нечего копировать', 'error');
            }
            return;
        }

        try {
            await navigator.clipboard.writeText(text);

            if (!silent) {
                this.showStatus('📋 Скопировано в буфер обмена!', 'success');
                setTimeout(() => this.hideStatus(), CONFIG.UI.COPY_FEEDBACK_TIMEOUT);
            }

            // Визуальная обратная связь
            this.elements.copyButton.innerHTML = `
                <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Скопировано</span>
            `;

            setTimeout(() => {
                this.elements.copyButton.innerHTML = `
                    <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span>Копировать</span>
                `;
            }, 2000);
        } catch (error) {
            console.error('Copy error:', error);
            if (!silent) {
                this.showStatus('❌ Ошибка копирования', 'error');
            }
        }
    }

    /**
     * Очистка результата
     */
    handleClear() {
        this.displayResult('');
        this.showStatus('🗑️ Результат очищен', 'info');
        setTimeout(() => this.hideStatus(), 1500);
    }

    /**
     * Открытие настроек
     */
    openSettings() {
        // Открываем страницу настроек в новой вкладке расширения
        chrome.tabs.create({
            url: chrome.runtime.getURL('api_key.html')
        });
    }

    /**
     * Установка состояния обработки
     */
    setProcessingState(isProcessing) {
        this.elements.enhanceButton.disabled = isProcessing;
        this.elements.copyButton.disabled = true;

        if (isProcessing) {
            this.elements.enhanceButton.innerHTML = `
                <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                </svg>
                <span>Обработка...</span>
            `;
        } else {
            this.elements.enhanceButton.innerHTML = `
                <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
                <span>Улучшить промпт</span>
            `;
        }
    }

    /**
     * Показать статус
     */
    showStatus(message, type) {
        this.elements.status.textContent = message;
        this.elements.status.className = `status ${type}`;
        this.elements.status.style.display = 'block';
    }

    /**
     * Скрыть статус
     */
    hideStatus() {
        this.elements.status.style.display = 'none';
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});