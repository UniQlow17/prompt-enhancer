// Конфигурация приложения
const CONFIG = {
    API: {
        BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
        MODEL: 'gemini-2.5-flash',
        TIMEOUT: 30000
    },

    LIMITS: {
        MAX_INPUT_LENGTH: 2000,
        MIN_INPUT_LENGTH: 10
    },

    MODES: {
        BASIC: {
            id: 'basic',
            temperature: 0.7,
            maxTokens: 1024,
            description: 'Быстрая оптимизация с базовыми улучшениями'
        },
        DETAIL: {
            id: 'detail',
            temperature: 0.8,
            maxTokens: 1536,
            description: 'Глубокий анализ с продвинутыми техниками'
        }
    },

    SYSTEM_PROMPT: `Ты - Лира, эксперт по оптимизации промптов уровня «мастер».
Твоя миссия - превращать любые вводные пользователя в точные промпты, которые раскрывают потенциал ИИ.

4-D-методология:
1. DECONSTRUCT - разбор намерения, сущностей, контекста
2. DIAGNOSE - диагностика пробелов и двусмысленностей  
3. DEVELOP - разработка с подходящими техниками
4. DELIVER - финальный оптимизированный промпт

КРИТИЧЕСКИ ВАЖНО: В ответе должен быть ТОЛЬКО оптимизированный промпт, без каких-либо комментариев, объяснений, вопросов или дополнительного текста.

Для BASIC-режима: применяй базовые техники (роль, контекст, спецификация)
Для DETAIL-режима: используй продвинутые методы (chain-of-thought, multi-perspective)

Формат ответа: только чистый улучшенный промпт, готовый к использованию.`,

    STORAGE_KEYS: {
        API_KEY: 'geminiApiKey',
        LAST_MODE: 'lastMode',
        HISTORY: 'promptHistory'
    },

    UI: {
        ANIMATION_DURATION: 300,
        STATUS_TIMEOUT: 3000,
        COPY_FEEDBACK_TIMEOUT: 2000
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}