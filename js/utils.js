/**
 * IA Questions Test - Utilidades Compartidas
 * @fileoverview Funciones de utilidad compartidas entre quiz.js, scrapper.js y check.js
 * @author IA Questions Test Contributors
 * @version 1.0.0
 */

/**
 * Decodifica secuencias Unicode en una cadena de texto
 * @param {string} str - Cadena con secuencias Unicode codificadas (\uXXXX)
 * @returns {string} Cadena con caracteres Unicode decodificados
 * @example
 * decodeUnicode("Espa\\u00f1a") // returns "España"
 */
function decodeUnicode(str) {
    return str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) =>
        String.fromCharCode(parseInt(grp, 16))
    );
}

/**
 * Muestra una alerta Bootstrap con mensaje personalizado
 * @param {string} message - Mensaje a mostrar en la alerta
 * @param {string} type - Tipo de alerta Bootstrap (danger, warning, info, success)
 * @param {HTMLElement} container - Elemento contenedor donde insertar la alerta
 * @param {number} duration - Duración en ms antes de auto-cerrar (default: 5000)
 * @returns {HTMLElement} El elemento de alerta creado
 * @example
 * showAlert("Error al cargar", "danger", document.body, 3000)
 */
function showAlert(message, type = 'danger', container = null, duration = 5000) {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';

    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Determinar contenedor de inserción
    if (!container) {
        // Buscar el contenedor apropiado según la página
        container = document.getElementById('quiz-selection') ||
                   document.querySelector('.card-body') ||
                   document.body;
    }

    // Insertar alerta
    if (container.firstChild) {
        container.insertBefore(alertDiv, container.firstChild);
    } else {
        container.appendChild(alertDiv);
    }

    // Auto-eliminar después de la duración especificada
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, duration);

    return alertDiv;
}

/**
 * Baraja un array usando el algoritmo Fisher-Yates
 * @param {Array} array - Array a barajar
 * @returns {Array} Nuevo array con elementos barajados (no modifica el original)
 * @example
 * shuffleArray([1, 2, 3, 4, 5]) // returns [3, 1, 5, 2, 4] (orden aleatorio)
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Helper para crear elementos DOM con atributos y contenido
 * @param {string} tag - Nombre del tag HTML (div, span, button, etc.)
 * @param {Object} attributes - Objeto con atributos del elemento {className: 'foo', id: 'bar'}
 * @param {string|HTMLElement|HTMLElement[]} children - Contenido hijo (texto, elemento o array de elementos)
 * @returns {HTMLElement} Elemento DOM creado
 * @example
 * createElement('div', {className: 'card', id: 'main'}, [
 *   createElement('h1', {}, 'Título'),
 *   createElement('p', {}, 'Contenido')
 * ])
 */
function createElement(tag, attributes = {}, children = null) {
    const element = document.createElement(tag);

    // Aplicar atributos
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            // Event listeners
            const eventName = key.substring(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else {
            element.setAttribute(key, value);
        }
    });

    // Agregar contenido hijo
    if (children !== null) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            element.textContent = children;
        } else if (children instanceof HTMLElement) {
            element.appendChild(children);
        }
    }

    return element;
}

/**
 * Implementa debouncing para limitar la frecuencia de ejecución de una función
 * @param {Function} func - Función a ejecutar con debounce
 * @param {number} wait - Tiempo de espera en milisegundos
 * @returns {Function} Función con debounce aplicado
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Carga un archivo JSON desde una URL con caché opcional
 * @param {string} url - URL del archivo JSON
 * @param {boolean} useCache - Si usar caché del navegador (default: true)
 * @returns {Promise<Object>} Promesa que resuelve con los datos JSON
 * @throws {Error} Si hay error en la carga o parsing del JSON
 * @example
 * loadJSON('schema.json').then(data => console.log(data))
 */
async function loadJSON(url, useCache = true) {
    try {
        const cacheKey = `json_cache_${url}`;

        // Intentar obtener del localStorage si se permite caché
        if (useCache && localStorage) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    // Si falla el parse, continuar con fetch
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        // Fetch del servidor
        const response = await fetch(url, {
            cache: useCache ? 'default' : 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Guardar en caché si es permitido
        if (useCache && localStorage) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (e) {
                // Si falla (cuota excedida), continuar sin caché
                console.warn('No se pudo guardar en localStorage:', e);
            }
        }

        return data;
    } catch (error) {
        console.error('Error cargando JSON:', error);
        throw error;
    }
}

/**
 * Limpia la caché de JSON del localStorage
 * @param {string} url - URL específica a limpiar, o null para limpiar todo
 * @example
 * clearJSONCache('schema.json') // Limpia solo schema.json
 * clearJSONCache() // Limpia toda la caché JSON
 */
function clearJSONCache(url = null) {
    if (!localStorage) return;

    if (url) {
        const cacheKey = `json_cache_${url}`;
        localStorage.removeItem(cacheKey);
    } else {
        // Limpiar todas las entradas de caché JSON
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('json_cache_')) {
                localStorage.removeItem(key);
            }
        });
    }
}

/**
 * Calcula estadísticas de un array de preguntas
 * @param {Array} questions - Array de objetos de preguntas
 * @returns {Object} Objeto con estadísticas {total, byType, hasCorrect, hasIncorrect}
 * @example
 * getQuestionsStats([{type: 'choice'}, {type: 'text'}])
 * // returns {total: 2, byType: {choice: 1, text: 1}, ...}
 */
function getQuestionsStats(questions) {
    const stats = {
        total: questions.length,
        byType: {},
        hasCorrect: 0,
        hasIncorrect: 0
    };

    questions.forEach(q => {
        // Contar por tipo
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;

        // Verificar si tiene respuestas correctas marcadas
        if (q.type !== 'text' && q.answers) {
            const hasCorrectAnswer = q.answers.some(a => a.correct === true);
            if (hasCorrectAnswer) {
                stats.hasCorrect++;
            } else {
                stats.hasIncorrect++;
            }
        }
    });

    return stats;
}

/**
 * Formatea un número como porcentaje
 * @param {number} value - Valor decimal (0-1) o porcentaje (0-100)
 * @param {number} decimals - Número de decimales (default: 1)
 * @param {boolean} isDecimal - Si el valor está en formato decimal (default: true)
 * @returns {string} String formateado como porcentaje
 * @example
 * formatPercentage(0.856, 1) // returns "85.6%"
 * formatPercentage(85.6, 1, false) // returns "85.6%"
 */
function formatPercentage(value, decimals = 1, isDecimal = true) {
    const percentage = isDecimal ? value * 100 : value;
    return percentage.toFixed(decimals) + '%';
}

// Exportar funciones para uso en módulos (compatible con navegadores modernos)
if (typeof module !== 'undefined' && module.exports) {
    // Node.js / CommonJS
    module.exports = {
        decodeUnicode,
        showAlert,
        shuffleArray,
        createElement,
        debounce,
        loadJSON,
        clearJSONCache,
        getQuestionsStats,
        formatPercentage
    };
}
