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
    const htmlInput = document.getElementById('htmlInput');
    htmlInput.parentNode.parentNode.insertBefore(alertDiv, htmlInput.parentNode);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
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

// Guardar en el schema
document.getElementById('saveBtn').addEventListener('click', () => {
    const selectedSubject = document.getElementById('subjectSelect').value;
    const selectedTopic = document.getElementById('topicSelect').value;
    
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