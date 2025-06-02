let currentSchema = null;
let scrapedQuestions = [];

// Función para decodificar secuencias Unicode en una cadena
function decodeUnicode(str) {
    return str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) =>
        String.fromCharCode(parseInt(grp, 16))
    );
}

// Función para mostrar alertas
function showAlert(message, type = 'danger') {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show my-3`;
    alertDiv.role = 'alert';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar alerta antes del área de procesamiento
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.parentNode.parentNode.insertBefore(alertDiv, saveBtn.parentNode);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 20000);
}

// Función para controlar el estado de procesamiento en la UI
function toggleProcessingState(isProcessing) {
    const statusIndicator = document.getElementById('statusIndicator');
    const processBtn = document.getElementById('processBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    if (isProcessing) {
        statusIndicator.classList.remove('d-none');
        processBtn.disabled = true;
        processBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';
    } else {
        statusIndicator.classList.add('d-none');
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-cogs me-2"></i>Procesar HTML';
        
        // Habilitar botón de guardar si hay preguntas
        if (scrapedQuestions.length > 0) {
            saveBtn.disabled = false;
        }
    }
}

// Cargar schema automáticamente
window.addEventListener('load', async () => {
    try {
        const response = await fetch('./schema.json');
        if (!response.ok) throw new Error('No se encontró el schema.json');
        currentSchema = await response.json();
        populateSubjectSelect();
    } catch (error) {
        console.error(error);
        showAlert('Error cargando schema: ' + error.message, 'danger');
    }
});

// Llenar selectores
function populateSubjectSelect() {
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.innerHTML = '<option value="">Selecciona Asignatura</option>';
    
    Object.keys(currentSchema).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = decodeUnicode(subject);
        subjectSelect.appendChild(option);
    });
}

document.getElementById('subjectSelect').addEventListener('change', function() {
    const topicSelect = document.getElementById('topicSelect');
    const selectedSubject = this.value;
    
    topicSelect.innerHTML = '<option value="">Selecciona Tema</option>';
    
    if (selectedSubject && currentSchema[selectedSubject]) {
        Object.keys(currentSchema[selectedSubject]).forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = decodeUnicode(topic);
            topicSelect.appendChild(option);
        });
    }
});

// Función para extraer preguntas del HTML
function extractQuestionsFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const questions = [];
    
    // Seleccionar todos los contenedores de preguntas
    const questionNodes = doc.querySelectorAll('.que');
    
    questionNodes.forEach((questionNode, index) => {
        const questionTextElement = questionNode.querySelector('.qtext');
        
        // Verificar si encontramos el elemento con el texto de la pregunta
        if (!questionTextElement) return;
        
        // Obtener texto de la pregunta
        const questionText = questionTextElement.textContent.trim();
        let questionType = 'choice'; // Valor por defecto
        
        // Determinar el tipo de pregunta basándose en las clases y el contenido
        if (questionNode.classList.contains('multichoice')) {
            // Comprobar si realmente es multichoice o choice
            const hasCheckboxes = questionNode.querySelectorAll('input[type="checkbox"]').length > 0;
            const hasRadioButtons = questionNode.querySelectorAll('input[type="radio"]').length > 0;
            
            if (hasCheckboxes) {
                questionType = 'multichoice';
            } else if (hasRadioButtons) {
                questionType = 'choice';
            }
        } else if (questionNode.classList.contains('shortanswer') || questionNode.classList.contains('essay')) {
            questionType = 'text';
        } else if (questionNode.classList.contains('truefalse')) {
            questionType = 'choice';
        }
        
        // Crear objeto base de pregunta
        const questionObj = {
            name: questionText,
            type: questionType,
            answers: []
        };
        
        // Procesar respuestas según el tipo de pregunta
        if (questionType === 'text') {
            // Para preguntas de texto, buscar la respuesta correcta si está disponible
            const correctTextElement = questionNode.querySelector('.answer .correct');
            if (correctTextElement) {
                const correctTextInput = correctTextElement.querySelector('input[type="text"]');
                if (correctTextInput) {
                    questionObj.correctText = correctTextInput.value.trim();
                }
            } else {
                // Si no se encuentra, usar un valor por defecto
                const answerInput = questionNode.querySelector('.answer input[type="text"]');
                questionObj.correctText = answerInput ? answerInput.value.trim() : "Editar para agregar respuesta correcta";
            }
        } else {
            // Para preguntas de opción múltiple o única
            const answerNodes = questionNode.querySelectorAll('.answer .r0, .answer .r1');
            
            // Variable para controlar si la pregunta actual tiene alguna respuesta marcada como incorrecta
            let hasIncorrectMarked = false;
            
            answerNodes.forEach((answerNode) => {
                // Buscar el texto de la respuesta
                const flexFillElement = answerNode.querySelector('.flex-fill.ml-1');
                let answerText = flexFillElement ? flexFillElement.textContent.trim() : '';
                
                // Si no encontramos el texto con flex-fill, intentamos con el label
                if (!answerText) {
                    const labelElement = answerNode.querySelector('label');
                    if (labelElement) {
                        answerText = labelElement.textContent.trim();
                    }
                }
                
                // Limpiamos el texto (quitamos el prefijo a., b., etc.)
                answerText = answerText.replace(/^\s*[a-e]\.\s*/i, '').trim();
                
                // Verificar si la respuesta está marcada como incorrecta
                const isIncorrect = answerNode.classList.contains('incorrect') || 
                                   answerNode.querySelector('.fa-remove') !== null;
                
                if (isIncorrect) {
                    hasIncorrectMarked = true;
                }
                
                // Verificar si la respuesta está marcada como correcta
                const isCorrect = answerNode.classList.contains('correct') || 
                                 answerNode.querySelector('.fa-check') !== null;
                
                // Verificar si está seleccionada/checked
                const inputElement = answerNode.querySelector('input');
                const isChecked = inputElement && inputElement.hasAttribute('checked');
                
                // Determinar si debemos marcar esta respuesta como correcta
                let shouldMarkAsCorrect = false;
                
                // Si está marcada explícitamente como correcta, o está checked y no hay ninguna marcada como incorrecta
                if (isCorrect || (isChecked && !isIncorrect)) {
                    shouldMarkAsCorrect = true;
                }
                
                if (answerText && answerText.length > 0) {
                    questionObj.answers.push({ 
                        name: answerText, 
                        correct: shouldMarkAsCorrect
                    });
                }
            });
            
            // Si alguna respuesta está marcada como incorrecta, desmarcamos todas para que el usuario elija manualmente
            if (hasIncorrectMarked) {
                questionObj.answers.forEach(answer => {
                    answer.correct = false;
                });
            }
            
            // Si es una pregunta tipo 'text', asegurarse de que no haya respuestas en el array
            if (questionType === 'text') {
                questionObj.answers = [];
            }
        }
        
        questions.push(questionObj);
    });
    
    return questions;
}

// Función para mostrar resultados
function displayResults(questions) {
    const resultsContainer = document.getElementById('results');
    
    // Limpiar contenedor
    resultsContainer.innerHTML = '';
    
    // Si no hay preguntas, mostrar mensaje y retornar
    if (questions.length === 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>No se encontraron preguntas para procesar.
            </div>
        `;
        return;
    }
    
    // Añadir título y contador
    resultsContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0"><i class="fas fa-list-check me-2"></i>Preguntas extraídas</h5>
            <span class="badge bg-primary rounded-pill">${questions.length}</span>
        </div>
    `;
    
    // Crear contenedor para las preguntas
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container';
    resultsContainer.appendChild(questionsContainer);
    
    // Procesar cada pregunta
    questions.forEach((question, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        
        // Cabecera de la pregunta con número y texto
        const questionHeader = document.createElement('div');
        questionHeader.className = 'd-flex align-items-start';
        
        const questionNumberBadge = document.createElement('span');
        questionNumberBadge.className = 'badge bg-primary rounded-pill me-2 mt-1';
        questionNumberBadge.textContent = qIndex + 1;
        
        const questionTextDiv = document.createElement('div');
        questionTextDiv.className = 'question-text';
        questionTextDiv.textContent = question.name;
        
        questionHeader.appendChild(questionNumberBadge);
        questionHeader.appendChild(questionTextDiv);
        questionDiv.appendChild(questionHeader);
        
        // Selector de tipo de pregunta
        const questionTypeDiv = document.createElement('div');
        questionTypeDiv.className = 'question-type';
        questionTypeDiv.innerHTML = `
            <label class="form-label"><i class="fas fa-tag me-2"></i>Tipo:</label>
            <select class="form-select type-select" data-qindex="${qIndex}">
                <option value="choice" ${question.type === 'choice' ? 'selected' : ''}>Elección única</option>
                <option value="multichoice" ${question.type === 'multichoice' ? 'selected' : ''}>Elección múltiple</option>
                <option value="text" ${question.type === 'text' ? 'selected' : ''}>Texto libre</option>
            </select>
        `;
        questionDiv.appendChild(questionTypeDiv);
        
        // Contenedor para las respuestas
        const answersContainer = document.createElement('div');
        answersContainer.className = 'answers-container';
        questionDiv.appendChild(answersContainer);
        
        // Renderizar respuestas según el tipo
        updateAnswersDisplay(question, qIndex, answersContainer);
        
        questionsContainer.appendChild(questionDiv);
    });

    // Añadir listeners para actualizar tipos
    document.querySelectorAll('.type-select').forEach(select => {
        select.addEventListener('change', function() {
            const qIndex = parseInt(this.dataset.qindex);
            const newType = this.value;
            const question = scrapedQuestions[qIndex];
            
            // Actualizar el tipo
            question.type = newType;
            
            // Inicializar correctText si cambiamos a tipo texto
            if (newType === 'text' && !question.correctText) {
                question.correctText = '';
            }
            
            // Inicializar answers si cambiamos desde texto
            if (newType !== 'text' && (!question.answers || question.answers.length === 0)) {
                question.answers = [
                    { name: 'Opción 1', correct: false },
                    { name: 'Opción 2', correct: false }
                ];
            }
            
            // Actualizar visualización
            const answersContainer = this.closest('.question').querySelector('.answers-container');
            updateAnswersDisplay(question, qIndex, answersContainer);
        });
    });
    
    // Habilitar botón de guardar
    document.getElementById('saveBtn').disabled = false;
}

// Función para actualizar la visualización de respuestas
function updateAnswersDisplay(question, qIndex, container) {
    container.innerHTML = '';
    
    if (question.type === 'text') {
        // Para preguntas de tipo texto
        const textFieldContainer = document.createElement('div');
        textFieldContainer.className = 'text-field-container';
        
        const label = document.createElement('label');
        label.innerHTML = '<i class="fas fa-pen me-2"></i>Respuesta correcta:';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control correct-text-input mt-2';
        input.dataset.qindex = qIndex;
        input.value = question.correctText || '';
        input.placeholder = 'Introduce la respuesta correcta';
        
        textFieldContainer.appendChild(label);
        textFieldContainer.appendChild(input);
        
        // Listener para actualizar la respuesta correcta
        input.addEventListener('input', function() {
            const qIndex = parseInt(this.dataset.qindex);
            scrapedQuestions[qIndex].correctText = this.value;
        });
        
        container.appendChild(textFieldContainer);
    } else {
        // Para preguntas de opción única o múltiple
        const answerListContainer = document.createElement('div');
        answerListContainer.className = 'mt-3';
        
        const answerListHeader = document.createElement('div');
        answerListHeader.className = 'd-flex justify-content-between align-items-center mb-2';
        
        const answerListTitle = document.createElement('h6');
        answerListTitle.className = 'mb-0';
        answerListTitle.innerHTML = '<i class="fas fa-list-ul me-2"></i>Respuestas:';
        
        const addAnswerBtn = document.createElement('button');
        addAnswerBtn.className = 'btn btn-sm btn-outline-primary';
        addAnswerBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addAnswerBtn.title = 'Añadir opción';
        
        // Listener para añadir nueva respuesta
        addAnswerBtn.addEventListener('click', function() {
            const newAnswer = { name: 'Nueva opción', correct: false };
            question.answers.push(newAnswer);
            updateAnswersDisplay(question, qIndex, container);
        });
        
        answerListHeader.appendChild(answerListTitle);
        answerListHeader.appendChild(addAnswerBtn);
        answerListContainer.appendChild(answerListHeader);
        
        const answerList = document.createElement('ul');
        answerList.className = 'list-group';
        
        question.answers.forEach((answer, aIndex) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex align-items-center';
            
            // Contenedor para checkbox/radio y etiqueta
            const inputContainer = document.createElement('div');
            inputContainer.className = 'form-check me-2';
            
            const input = document.createElement('input');
            input.className = 'form-check-input';
            input.type = question.type === 'multichoice' ? 'checkbox' : 'radio';
            input.name = `question-${qIndex}`;
            input.dataset.qindex = qIndex;
            input.dataset.aindex = aIndex;
            input.checked = answer.correct;
            input.id = `q${qIndex}-a${aIndex}`;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `q${qIndex}-a${aIndex}`;
            label.textContent = 'Correcta';
            
            inputContainer.appendChild(input);
            inputContainer.appendChild(label);
            
            // Input para editar texto de respuesta
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'form-control form-control-sm ms-2 me-2';
            textInput.value = answer.name;
            textInput.style.flex = '1';
            
            // Botón para eliminar respuesta
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'Eliminar opción';
            
            // Listener para actualizar estado de corrección
            input.addEventListener('change', function() {
                const qIndex = parseInt(this.dataset.qindex);
                const aIndex = parseInt(this.dataset.aindex);
                
                if (question.type === 'choice') {
                    // Para selección única, desmarcar todas las demás
                    question.answers.forEach((a, idx) => {
                        a.correct = (idx === aIndex);
                    });
                    
                    // Actualizar UI para reflejar cambios
                    document.querySelectorAll(`input[name="question-${qIndex}"]`).forEach((inp, idx) => {
                        inp.checked = (idx === aIndex);
                    });
                } else {
                    // Para selección múltiple, actualizar solo la actual
                    question.answers[aIndex].correct = this.checked;
                }
            });
            
            // Listener para actualizar texto de respuesta
            textInput.addEventListener('input', function() {
                question.answers[aIndex].name = this.value;
            });
            
            // Listener para eliminar respuesta
            deleteBtn.addEventListener('click', function() {
                // No permitir eliminar si solo hay una respuesta
                if (question.answers.length <= 1) {
                    showAlert('Debe existir al menos una opción de respuesta.', 'warning');
                    return;
                }
                
                question.answers.splice(aIndex, 1);
                updateAnswersDisplay(question, qIndex, container);
            });
            
            listItem.appendChild(inputContainer);
            listItem.appendChild(textInput);
            listItem.appendChild(deleteBtn);
            answerList.appendChild(listItem);
        });
        
        answerListContainer.appendChild(answerList);
        container.appendChild(answerListContainer);
    }
}

// Evento de clic para procesar HTML
document.getElementById('processBtn').addEventListener('click', () => {
    const html = document.getElementById('htmlInput').value.trim();
    
    if (!html) {
        showAlert('Por favor, inserta el código HTML para procesar.', 'warning');
        return;
    }
    
    toggleProcessingState(true);
    
    // Simular procesamiento asíncrono (permite que la UI se actualice)
    setTimeout(() => {
        try {
            // Extraer preguntas del HTML
            const newQuestions = extractQuestionsFromHTML(html);
            
            // Si no hay preguntas nuevas, mostrar mensaje
            if (newQuestions.length === 0) {
                showAlert('No se encontraron preguntas en el HTML proporcionado.', 'warning');
                toggleProcessingState(false);
                return;
            }
            
            // Filtrar para evitar duplicados
            const uniqueNewQuestions = newQuestions.filter(newQuestion => {
                return !scrapedQuestions.some(existingQuestion => {
                    const normalizedNew = decodeUnicode(newQuestion.name.trim().toLowerCase());
                    const normalizedExisting = decodeUnicode(existingQuestion.name.trim().toLowerCase());
                    return normalizedNew === normalizedExisting;
                });
            });
            
            // Informar si se filtraron duplicados
            if (uniqueNewQuestions.length < newQuestions.length) {
                const duplicates = newQuestions.length - uniqueNewQuestions.length;
                showAlert(`Se encontraron ${duplicates} preguntas duplicadas que no se añadirán.`, 'info');
            }
            
            // Si no hay preguntas nuevas únicas, terminar
            if (uniqueNewQuestions.length === 0) {
                showAlert('Todas las preguntas ya existen en la lista actual.', 'info');
                toggleProcessingState(false);
                document.getElementById('htmlInput').value = '';
                return;
            }
            
            // Añadir solo las preguntas únicas
            scrapedQuestions = scrapedQuestions.concat(uniqueNewQuestions);
            
            // Mostrar mensaje de éxito
            showAlert(`Se han extraído ${uniqueNewQuestions.length} preguntas exitosamente.`, 'success');
            
            // Mostrar todas las preguntas acumuladas
            displayResults(scrapedQuestions);
            
            // Limpiar el textarea para la próxima entrada
            document.getElementById('htmlInput').value = '';
        } catch (error) {
            console.error('Error procesando HTML:', error);
            showAlert('Ocurrió un error al procesar el HTML.', 'danger');
        } finally {
            toggleProcessingState(false);
        }
    }, 300);
});

// Funcionalidad para unificar schemas
let mergeModal = null;

// Inicializar funcionalidad de unificación cuando el DOM esté listo
window.addEventListener('load', function() {
    // Inicializar modal
    mergeModal = new bootstrap.Modal(document.getElementById('mergeModal'));
    
    // Event listener para el botón de unificar
    document.getElementById('mergeBtn').addEventListener('click', function() {
        mergeModal.show();
        // Resetear el formulario
        document.getElementById('schemaFiles').value = '';
        document.getElementById('processMergeBtn').disabled = true;
        document.getElementById('mergeStatus').classList.add('d-none');
        document.getElementById('mergeResults').classList.add('d-none');
    });
    
    // Event listener para cuando se seleccionan archivos
    document.getElementById('schemaFiles').addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            document.getElementById('processMergeBtn').disabled = false;
            updateMergeStatus(`${files.length} archivo(s) seleccionado(s)`, 'info');
        } else {
            document.getElementById('processMergeBtn').disabled = true;
        }
    });
    
    // Event listener para procesar y unificar
    document.getElementById('processMergeBtn').addEventListener('click', processAndMergeSchemas);
});

// Función para actualizar el estado del merge
function updateMergeStatus(message, type = 'info') {
    const statusDiv = document.getElementById('mergeStatus');
    const statusText = document.getElementById('mergeStatusText');
    
    statusDiv.className = `alert alert-${type}`;
    statusText.textContent = message;
    statusDiv.classList.remove('d-none');
}

// Función para validar el formato del schema
function validateSchemaFormat(schema) {
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
        return { valid: false, error: 'El schema debe ser un objeto' };
    }
    
    for (const subject in schema) {
        if (typeof schema[subject] !== 'object' || schema[subject] === null || Array.isArray(schema[subject])) {
            return { valid: false, error: `La asignatura "${subject}" debe contener un objeto de temas` };
        }
        
        for (const theme in schema[subject]) {
            if (!Array.isArray(schema[subject][theme])) {
                return { valid: false, error: `El tema "${theme}" debe ser un array de preguntas` };
            }
            
            for (const question of schema[subject][theme]) {
                if (typeof question !== 'object' || question === null) {
                    return { valid: false, error: 'Cada pregunta debe ser un objeto' };
                }
                
                if (!question.hasOwnProperty('name') || typeof question.name !== 'string') {
                    return { valid: false, error: 'Cada pregunta debe tener una propiedad "name" de tipo string' };
                }
                
                if (!question.hasOwnProperty('type') || typeof question.type !== 'string') {
                    return { valid: false, error: 'Cada pregunta debe tener una propiedad "type" de tipo string' };
                }
                
                // Validar según el tipo
                if (question.type === 'choice' || question.type === 'multichoice') {
                    if (!Array.isArray(question.answers)) {
                        return { valid: false, error: `Pregunta "${question.name}" debe tener un array "answers"` };
                    }
                } else if (question.type === 'text') {
                    if (!question.hasOwnProperty('correctText') || typeof question.correctText !== 'string') {
                        return { valid: false, error: `Pregunta "${question.name}" de tipo text debe tener "correctText"` };
                    }
                }
            }
        }
    }
    
    return { valid: true };
}

// Función para comparar si dos preguntas son iguales
function areQuestionsEqual(q1, q2) {
    // Comparar por el texto de la pregunta normalizado
    const normalizedQ1 = decodeUnicode(q1.name.trim().toLowerCase());
    const normalizedQ2 = decodeUnicode(q2.name.trim().toLowerCase());
    return normalizedQ1 === normalizedQ2;
}

// Función principal para procesar y unificar schemas
async function processAndMergeSchemas() {
    const fileInput = document.getElementById('schemaFiles');
    const files = fileInput.files;
    
    if (files.length === 0) {
        updateMergeStatus('No se han seleccionado archivos', 'warning');
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    document.getElementById('processMergeBtn').disabled = true;
    document.getElementById('processMergeBtn').innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';
    
    try {
        const schemas = [];
        const errors = [];
        
        // Leer todos los archivos
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const text = await file.text();
                const schema = JSON.parse(text);
                
                // Validar formato
                const validation = validateSchemaFormat(schema);
                if (!validation.valid) {
                    errors.push(`${file.name}: ${validation.error}`);
                    continue;
                }
                
                schemas.push({ filename: file.name, data: schema });
            } catch (error) {
                errors.push(`${file.name}: Error al parsear JSON - ${error.message}`);
            }
        }
        
        // Si hay errores, mostrarlos
        if (errors.length > 0) {
            updateMergeStatus('Errores encontrados:\n' + errors.join('\n'), 'danger');
            return;
        }
        
        // Si no hay schemas válidos
        if (schemas.length === 0) {
            updateMergeStatus('No se encontraron schemas válidos para unificar', 'warning');
            return;
        }
        
        // Unificar los schemas
        const mergedSchema = {};
        let totalQuestions = 0;
        let duplicatesFound = 0;
        const stats = {
            byFile: {},
            bySubject: {}
        };
        
        // Inicializar estadísticas por archivo
        schemas.forEach(s => {
            stats.byFile[s.filename] = { added: 0, duplicates: 0 };
        });
        
        // Procesar cada schema
        schemas.forEach(({ filename, data }) => {
            for (const subject in data) {
                if (!mergedSchema[subject]) {
                    mergedSchema[subject] = {};
                }
                
                if (!stats.bySubject[subject]) {
                    stats.bySubject[subject] = { added: 0, duplicates: 0 };
                }
                
                for (const theme in data[subject]) {
                    if (!mergedSchema[subject][theme]) {
                        mergedSchema[subject][theme] = [];
                    }
                    
                    // Procesar cada pregunta
                    data[subject][theme].forEach(question => {
                        // Verificar si la pregunta ya existe
                        const isDuplicate = mergedSchema[subject][theme].some(existingQ => 
                            areQuestionsEqual(existingQ, question)
                        );
                        
                        if (!isDuplicate) {
                            mergedSchema[subject][theme].push(question);
                            totalQuestions++;
                            stats.byFile[filename].added++;
                            stats.bySubject[subject].added++;
                        } else {
                            duplicatesFound++;
                            stats.byFile[filename].duplicates++;
                            stats.bySubject[subject].duplicates++;
                        }
                    });
                }
            }
        });
        
        // Mostrar resumen
        let summaryHTML = `
            <div class="alert alert-success">
                <h6 class="alert-heading">Unificación completada</h6>
                <p class="mb-0">Total de preguntas: <strong>${totalQuestions}</strong></p>
                <p class="mb-0">Duplicados encontrados: <strong>${duplicatesFound}</strong></p>
            </div>
            
            <h6 class="mt-3">Resumen por archivo:</h6>
            <ul class="list-group mb-3">
        `;
        
        for (const filename in stats.byFile) {
            const { added, duplicates } = stats.byFile[filename];
            summaryHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${filename}
                    <span>
                        <span class="badge bg-success rounded-pill">${added} añadidas</span>
                        ${duplicates > 0 ? `<span class="badge bg-warning rounded-pill">${duplicates} duplicadas</span>` : ''}
                    </span>
                </li>
            `;
        }
        
        summaryHTML += `
            </ul>
            <h6 class="mt-3">Resumen por asignatura:</h6>
            <ul class="list-group">
        `;
        
        for (const subject in stats.bySubject) {
            const { added, duplicates } = stats.bySubject[subject];
            summaryHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${decodeUnicode(subject)}
                    <span>
                        <span class="badge bg-primary rounded-pill">${added} preguntas</span>
                        ${duplicates > 0 ? `<span class="badge bg-secondary rounded-pill">${duplicates} duplicadas</span>` : ''}
                    </span>
                </li>
            `;
        }
        
        summaryHTML += '</ul>';
        
        document.getElementById('mergeSummary').innerHTML = summaryHTML;
        document.getElementById('mergeResults').classList.remove('d-none');
        
        // Generar y descargar el archivo unificado
        const dataStr = JSON.stringify(mergedSchema, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'schema_unificado.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateMergeStatus('Archivo unificado descargado exitosamente como "schema_unificado.json"', 'success');
        
    } catch (error) {
        console.error('Error unificando schemas:', error);
        updateMergeStatus(`Error al unificar: ${error.message}`, 'danger');
    } finally {
        // Restaurar botón
        document.getElementById('processMergeBtn').disabled = false;
        document.getElementById('processMergeBtn').innerHTML = '<i class="fas fa-cogs me-2"></i>Procesar y Unificar';
    }
}

// Guardar en el schema
document.getElementById('saveBtn').addEventListener('click', async () => {
    console.log('Botón de guardar presionado'); // Debug
    
    const selectedSubject = document.getElementById('subjectSelect').value;
    const selectedTopic = document.getElementById('topicSelect').value;
    
    console.log('Asignatura seleccionada:', selectedSubject); // Debug
    console.log('Tema seleccionado:', selectedTopic); // Debug
    console.log('Preguntas extraídas:', scrapedQuestions.length); // Debug
    
    if (!selectedSubject) {
        showAlert('Por favor, selecciona una asignatura.', 'warning');
        return;
    }
    
    if (!selectedTopic) {
        showAlert('Por favor, selecciona un tema.', 'warning');
        return;
    }
    
    if (scrapedQuestions.length === 0) {
        showAlert('No hay preguntas para guardar.', 'warning');
        return;
    }
    
    toggleProcessingState(true);
    
    setTimeout(() => {
        try {
            // Procesar cada pregunta según su tipo
            scrapedQuestions.forEach((question, qIndex) => {
                if (question.type === 'choice' || question.type === 'multichoice') {
                    // Para preguntas de opción única o múltiple, verificar respuestas correctas
                    const hasCorrectAnswer = question.answers.some(answer => answer.correct);
                    
                    // Si no hay respuestas correctas marcadas, mostrar advertencia
                    if (!hasCorrectAnswer && question.answers.length > 0) {
                        // En choice, marcar la primera como correcta por defecto
                        if (question.type === 'choice') {
                            question.answers[0].correct = true;
                        }
                    }
                } else if (question.type === 'text') {
                    // Para preguntas de texto, asegurar que hay una respuesta correcta
                    if (!question.correctText || question.correctText.trim() === '') {
                        question.correctText = 'Respuesta no especificada';
                    }
                    
                    // Asegurarse de que no tenga respuestas (por consistencia)
                    question.answers = [];
                }
            });

            // Obtener preguntas existentes en el tema seleccionado
            const existingQuestions = currentSchema[selectedSubject][selectedTopic] || [];
            
            // Filtrar preguntas nuevas que no existan
            const newQuestions = scrapedQuestions.filter(scrapedQuestion => {
                return !existingQuestions.some(existingQuestion => {
                    // Comparación por texto de pregunta
                    return decodeUnicode(existingQuestion.name.trim()) === decodeUnicode(scrapedQuestion.name.trim());
                });
            });

            if (newQuestions.length === 0) {
                showAlert('Todas las preguntas ya existen en el tema seleccionado.', 'warning');
                toggleProcessingState(false);
                return;
            }

            // Añadir solo preguntas nuevas
            currentSchema[selectedSubject][selectedTopic] = [
                ...existingQuestions,
                ...newQuestions
            ];

            // Crear y descargar nuevo schema
            const dataStr = JSON.stringify(currentSchema, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'schema.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert(`Se añadieron ${newQuestions.length} nuevas preguntas al tema ${decodeUnicode(selectedTopic)}.`, 'success');
            
            // Limpiar las preguntas extraídas
            scrapedQuestions = [];
            displayResults(scrapedQuestions);
            
            // Deshabilitar botón de guardar
            document.getElementById('saveBtn').disabled = true;
        } catch (error) {
            console.error('Error guardando preguntas:', error);
            showAlert('Ocurrió un error al guardar las preguntas.', 'danger');
        } finally {
            toggleProcessingState(false);
        }
    }, 300);
});