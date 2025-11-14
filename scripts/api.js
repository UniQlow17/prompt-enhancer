// API модуль для работы с Gemini
class GeminiAPI {
    constructor() {
        this.apiKey = null;
    }

    /**
     * Инициализация API с ключом
     */
    async initialize() {
        this.apiKey = await this.getStoredApiKey();
        return this.apiKey !== null;
    }

    /**
     * Получение API ключа из хранилища
     */
    async getStoredApiKey() {
        return new Promise((resolve) => {
            chrome.storage.local.get([CONFIG.STORAGE_KEYS.API_KEY], (result) => {
                resolve(result[CONFIG.STORAGE_KEYS.API_KEY] || null);
            });
        });
    }

    /**
     * Сохранение API ключа
     */
    async saveApiKey(apiKey) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.API_KEY]: apiKey }, () => {
                this.apiKey = apiKey;
                resolve(true);
            });
        });
    }

    /**
     * Валидация API ключа
     */
    async validateApiKey(apiKey) {
        if (!apiKey || apiKey.length < 20) {
            throw new Error('Некорректный формат API ключа');
        }

        try {
            const response = await this.makeRequest(apiKey, 'test', 'basic');
            return response !== null;
        } catch (error) {
            throw new Error('API ключ недействителен');
        }
    }

    /**
     * Улучшение промпта
     */
    async enhancePrompt(prompt, mode = 'basic') {
        if (!this.apiKey) {
            throw new Error('API ключ не установлен');
        }

        if (!prompt || prompt.trim().length < CONFIG.LIMITS.MIN_INPUT_LENGTH) {
            throw new Error(`Минимальная длина промпта: ${CONFIG.LIMITS.MIN_INPUT_LENGTH} символов`);
        }

        try {
            const result = await this.makeRequest(this.apiKey, prompt, mode);
            return this.cleanResponse(result);
        } catch (error) {
            console.error('Ошибка улучшения промпта:', error);
            throw error;
        }
    }

    /**
     * Выполнение запроса к API
     */
    async makeRequest(apiKey, prompt, mode) {
        const modeConfig = CONFIG.MODES[mode.toUpperCase()];
        const modeInstruction = mode === 'detail'
            ? "ПРИМЕНИ DETAIL-РЕЖИМ: глубокий анализ, расширенный контекст, продвинутые техники оптимизации."
            : "ПРИМЕНИ BASIC-РЕЖИМ: быстрая оптимизация, базовые улучшения, краткий формат.";

        const url = `${CONFIG.API.BASE_URL}/${CONFIG.API.MODEL}:generateContent?key=${apiKey}`;

        const requestBody = {
            system_instruction: {
                parts: [{
                    text: `${CONFIG.SYSTEM_PROMPT}\n\n${modeInstruction}\n\nЗАПОМНИ: ОТВЕТ - ТОЛЬКО УЛУЧШЕННЫЙ ПРОМПТ, БОЛЬШЕ НИЧЕГО.`
                }]
            },
            contents: [{
                parts: [{
                    text: prompt === 'test' ? 'Test message' : `Исходный промпт для оптимизации: ${prompt}`
                }]
            }],
            generationConfig: {
                temperature: modeConfig.temperature,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: modeConfig.maxTokens
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Некорректный ответ от API');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Превышено время ожидания запроса');
            }
            throw error;
        }
    }

    /**
     * Очистка ответа от мета-информации
     */
    cleanResponse(text) {
        let cleaned = text.trim();

        // Удаление префиксов
        cleaned = cleaned.replace(/^(Улучшенный промпт:|Improved prompt:|Оптимизированный промпт:|✨|🚀|📝|【.*?】|※.*?※|\*.*?\*)/gi, '');

        // Удаление пост-комментариев
        cleaned = cleaned.replace(/(Что изменилось:|Ключевые улучшения:|Использованные техники:).*$/gis, '');

        // Удаление строк с мета-информацией
        cleaned = cleaned.split('\n')
            .filter(line => !line.match(/^(###|===|---|Что изменилось|Ключевые улучшения|Использованные техники)/))
            .join('\n')
            .trim();

        return cleaned || 'Не удалось обработать ответ. Попробуйте изменить промпт.';
    }
}

// Создание единственного экземпляра API
const geminiAPI = new GeminiAPI();