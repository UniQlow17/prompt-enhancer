/**
 * Theme Switcher
 * Управление светлой и темной темой
 */

class ThemeSwitcher {
    constructor() {
        this.THEME_KEY = 'prompt-enhancer-theme';
        this.currentTheme = this.getSavedTheme() || this.getSystemTheme();
        this.init();
    }

    /**
     * Инициализация переключателя темы
     */
    init() {
        // Применяем сохраненную тему при загрузке
        this.applyTheme(this.currentTheme);

        // Находим кнопку переключения темы
        const themeButton = document.getElementById('themeToggle');
        if (themeButton) {
            themeButton.addEventListener('click', () => this.toggle());
        }

        // Слушаем изменения системной темы
        this.watchSystemTheme();
    }

    /**
     * Получить сохраненную тему из localStorage
     */
    getSavedTheme() {
        try {
            return localStorage.getItem(this.THEME_KEY);
        } catch (error) {
            console.warn('LocalStorage недоступен:', error);
            return null;
        }
    }

    /**
     * Получить системную тему
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Применить тему
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);
    }

    /**
     * Сохранить тему в localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.THEME_KEY, theme);
        } catch (error) {
            console.warn('Не удалось сохранить тему:', error);
        }
    }

    /**
     * Переключить тему
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);

        // Анимация кнопки
        this.animateToggleButton();
    }

    /**
     * Анимация кнопки переключения
     */
    animateToggleButton() {
        const button = document.getElementById('themeToggle');
        if (!button) return;

        button.style.transform = 'rotate(360deg) scale(0.9)';
        setTimeout(() => {
            button.style.transform = '';
        }, 300);
    }

    /**
     * Отслеживание изменений системной темы
     */
    watchSystemTheme() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Современный способ
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', (e) => {
                // Применяем системную тему только если пользователь не выбрал вручную
                const savedTheme = this.getSavedTheme();
                if (!savedTheme) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
        // Устаревший способ для старых браузеров
        else if (mediaQuery.addListener) {
            mediaQuery.addListener((e) => {
                const savedTheme = this.getSavedTheme();
                if (!savedTheme) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /**
     * Получить текущую тему
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Установить конкретную тему
     */
    setTheme(theme) {
        if (theme === 'dark' || theme === 'light') {
            this.applyTheme(theme);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
}