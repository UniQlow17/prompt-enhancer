// Settings Page Controller
class SettingsController {
    constructor() {
        this.elements = {
            apiKeyInput: document.getElementById('apiKeyInput'),
            saveButton: document.getElementById('saveButton'),
            toggleVisibility: document.getElementById('toggleVisibility'),
            status: document.getElementById('status')
        };

        this.isVisible = false;
        this.init();
    }

    init() {
        this.loadExistingKey();
        this.attachEventListeners();
    }

    /**
     * Загрузка существующего ключа
     */
    async loadExistingKey() {
        const apiKey = await geminiAPI.getStoredApiKey();

        if (apiKey) {
            this.elements.apiKeyInput.value = '•'.repeat(40);
            this.showStatus('🔑 API ключ уже сохранен. Введите новый для замены.', 'info');
        }
    }

    /**
     * Установка обработчиков событий
     */
    attachEventListeners() {
        this.elements.saveButton.addEventListener('click', () => this.handleSave());
        this.elements.toggleVisibility.addEventListener('click', () => this.togglePasswordVisibility());

        this.elements.apiKeyInput.addEventListener('input', () => {
            this.hideStatus();
        });

        this.elements.apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSave();
            }
        });
    }

    /**
     * Переключение видимости пароля
     */
    togglePasswordVisibility() {
        this.isVisible = !this.isVisible;
        const input = this.elements.apiKeyInput;

        input.type = this.isVisible ? 'text' : 'password';

        const eyeIcon = this.elements.toggleVisibility.querySelector('.eye-icon');
        if (this.isVisible) {
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            `;
        } else {
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    }

    /**
     * Сохранение API ключа
     */
    async handleSave() {
        const apiKey = this.elements.apiKeyInput.value.trim();

        // Проверка на пустое значение
        if (!apiKey) {
            this.showStatus('❌ Пожалуйста, введите API ключ', 'error');
            this.elements.apiKeyInput.focus();
            return;
        }

        // Проверка на заглушку
        if (apiKey.startsWith('•')) {
            this.showStatus('ℹ️ API ключ уже сохранен. Введите новый для замены.', 'info');
            return;
        }

        // Базовая валидация
        if (apiKey.length < 20) {
            this.showStatus('❌ API ключ слишком короткий', 'error');
            return;
        }

        // UI обновление
        this.elements.saveButton.disabled = true;
        this.elements.saveButton.innerHTML = `
            <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
            </svg>
            <span>Проверка ключа...</span>
        `;
        this.showStatus('🔄 Проверка API ключа...', 'loading');

        try {
            // Валидация через API
            await geminiAPI.validateApiKey(apiKey);

            // Сохранение
            await geminiAPI.saveApiKey(apiKey);

            this.showStatus('✅ API ключ успешно сохранен!', 'success');

            // Перенаправление
            setTimeout(() => {
                if (chrome.runtime.getURL('').includes('chrome-extension://')) {
                    // В расширении закрываем вкладку
                    window.close();
                } else {
                    // В обычном браузере редирект
                    window.location.href = 'popup.html';
                }
            }, 1500);
        } catch (error) {
            console.error('API Key validation error:', error);
            this.showStatus(`❌ ${error.message}`, 'error');
            this.resetButton();
        }
    }

    /**
     * Сброс кнопки в исходное состояние
     */
    resetButton() {
        this.elements.saveButton.disabled = false;
        this.elements.saveButton.innerHTML = `
            <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Сохранить и продолжить</span>
        `;
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new SettingsController();
});