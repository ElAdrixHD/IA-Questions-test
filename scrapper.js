let currentSchema = null;
let scrapedQuestions = [];

    // Función para decodificar secuencias Unicode en una cadena
function decodeUnicode(str) {
    return str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) =>
        String.fromCharCode(parseInt(grp, 16))
    );
}

// Cargar schema automáticamente
window.addEventListener('load', async () => {
    try {
        const response = await fetch('./schema.json');
        if (!response.ok) throw new Error('No se encontró el schema.json');
        currentSchema = await response.json();
        populateSubjectSelect();
    } catch (error) {
        alert(`Error cargando schema: ${error.message}`);
        console.error(error);
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


function extractQuestionsFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const questions = [];
    
    // Seleccionar todos los contenedores de preguntas
    const questionNodes = doc.querySelectorAll('.que');
    
    questionNodes.forEach((questionNode, index) => {
        // Obtener texto de la pregunta
        const questionText = questionNode.querySelector('.qtext').textContent.trim();
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

document.getElementById('processBtn').addEventListener('click', () => {
    const html = document.getElementById('htmlInput').value;
    
    // Extraer preguntas del HTML
    const newQuestions = extractQuestionsFromHTML(html);
    
    // Si no hay preguntas nuevas, mostrar un mensaje
    if (newQuestions.length === 0) {
        alert('No se encontraron preguntas en el HTML proporcionado.');
        return;
    }
    
    // Filtrar para evitar duplicados
    const uniqueNewQuestions = newQuestions.filter(newQuestion => {
        // Verificar si la pregunta ya existe en scrapedQuestions
        return !scrapedQuestions.some(existingQuestion => {
            // Comparación por texto de pregunta (normalizado)
            const normalizedNew = decodeUnicode(newQuestion.name.trim().toLowerCase());
            const normalizedExisting = decodeUnicode(existingQuestion.name.trim().toLowerCase());
            return normalizedNew === normalizedExisting;
        });
    });
    
    // Informar si se filtraron duplicados
    if (uniqueNewQuestions.length < newQuestions.length) {
        const duplicates = newQuestions.length - uniqueNewQuestions.length;
        alert(`Se encontraron ${duplicates} preguntas duplicadas que no se añadirán.`);
    }
    
    // Si no hay preguntas nuevas únicas, terminar
    if (uniqueNewQuestions.length === 0) {
        document.getElementById('htmlInput').value = '';
        return;
    }
    
    // Añadir solo las preguntas únicas
    scrapedQuestions = scrapedQuestions.concat(uniqueNewQuestions);
    
    // Mostrar todas las preguntas acumuladas
    displayResults(scrapedQuestions);
    
    // Limpiar el textarea para la próxima entrada
    document.getElementById('htmlInput').value = '';
});

// Mostrar preguntas con selección de correctas
function displayResults(questions) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    
    questions.forEach((question, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        
        questionDiv.innerHTML = `
            <div class="question-text">${qIndex + 1}. ${question.name}</div>
            <div class="question-type">
                Tipo: 
                <select class="type-select" data-qindex="${qIndex}">
                    <option value="choice" ${question.type === 'choice' ? 'selected' : ''}>Elección única</option>
                    <option value="multichoice" ${question.type === 'multichoice' ? 'selected' : ''}>Elección múltiple</option>
                    <option value="text" ${question.type === 'text' ? 'selected' : ''}>Texto libre</option>
                </select>
            </div>
        `;
        
        // Contenedor para las respuestas que se actualizará
        const answersContainer = document.createElement('div');
        answersContainer.className = 'answers-container';
        questionDiv.appendChild(answersContainer);
        
        // Renderizar las respuestas según el tipo
        updateAnswersDisplay(question, qIndex, answersContainer);
        
        resultsContainer.appendChild(questionDiv);
    });

    // Actualizar tipos dinámicamente
    document.querySelectorAll('.type-select').forEach(select => {
        select.addEventListener('change', function() {
            const qIndex = parseInt(this.dataset.qindex);
            const newType = this.value;
            const question = scrapedQuestions[qIndex];
            
            // Actualizar el tipo
            question.type = newType;
            
            // Si cambiamos a tipo texto, necesitamos inicializar correctText si no existe
            if (newType === 'text' && !question.correctText) {
                question.correctText = '';
            }
            
            // Si cambiamos desde texto a otro tipo, necesitamos inicializar answers si está vacío
            if (newType !== 'text' && (!question.answers || question.answers.length === 0)) {
                question.answers = [
                    { name: 'Opción 1', correct: false },
                    { name: 'Opción 2', correct: false }
                ];
            }
            
            // Actualizar la visualización de respuestas para esta pregunta
            const answersContainer = this.parentNode.nextElementSibling;
            updateAnswersDisplay(question, qIndex, answersContainer);
        });
    });
}

// Función auxiliar para actualizar la visualización de respuestas
function updateAnswersDisplay(question, qIndex, container) {
    container.innerHTML = '';
    
    if (question.type === 'text') {
        // Para preguntas de tipo texto
        const textFieldContainer = document.createElement('div');
        textFieldContainer.className = 'text-field-container';
        textFieldContainer.innerHTML = `
            <label>
                Respuesta correcta:
                <input type="text" class="correct-text-input" 
                       data-qindex="${qIndex}" 
                       value="${question.correctText || ''}" 
                       placeholder="Introduce la respuesta correcta">
            </label>
        `;
        
        // Listener para actualizar la respuesta correcta
        const textInput = textFieldContainer.querySelector('.correct-text-input');
        textInput.addEventListener('input', function() {
            const qIndex = parseInt(this.dataset.qindex);
            scrapedQuestions[qIndex].correctText = this.value;
        });
        
        container.appendChild(textFieldContainer);
    } else {
        // Para preguntas de opción única o múltiple
        const answerList = document.createElement('ul');
        answerList.className = 'answer-list';
        
        question.answers.forEach((answer, aIndex) => {
            const listItem = document.createElement('li');
            listItem.className = 'answer-item';
            
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = question.type === 'multichoice' ? 'checkbox' : 'radio';
            input.name = `question-${qIndex}`;
            input.dataset.qindex = qIndex;
            input.dataset.aindex = aIndex;
            input.checked = answer.correct;
            
            // Listener para actualizar el estado de corrección
            input.addEventListener('change', function() {
                const qIndex = parseInt(this.dataset.qindex);
                const aIndex = parseInt(this.dataset.aindex);
                
                if (question.type === 'choice') {
                    // Para selección única, desmarcar todas las demás
                    question.answers.forEach((a, idx) => {
                        a.correct = (idx === aIndex);
                    });
                } else {
                    // Para selección múltiple, actualizar solo la actual
                    question.answers[aIndex].correct = this.checked;
                }
            });
            
            label.appendChild(input);
            label.appendChild(document.createTextNode(` ${answer.name}`));
            listItem.appendChild(label);
            answerList.appendChild(listItem);
        });
        
        container.appendChild(answerList);
    }
}

// Guardar en el schema (actualizado con verificación de duplicados)
// Guardar en el schema (actualizado con verificación de duplicados)
document.getElementById('saveBtn').addEventListener('click', () => {
    const selectedSubject = document.getElementById('subjectSelect').value;
    const selectedTopic = document.getElementById('topicSelect').value;
    
    if (!selectedSubject || !selectedTopic) return alert('Selecciona asignatura y tema');
    
    // Procesar cada pregunta según su tipo
    scrapedQuestions.forEach((question, qIndex) => {
        if (question.type === 'choice' || question.type === 'multichoice') {
            // Para preguntas de opción única o múltiple, marcar respuestas correctas
            const correctAnswers = Array.from(document.querySelectorAll(`input[name="question-${qIndex}"]:checked`));
            
            question.answers.forEach((answer, aIndex) => {
                answer.correct = correctAnswers.some(input => parseInt(input.dataset.aindex) === aIndex);
            });
        } else if (question.type === 'text') {
            // Para preguntas de texto, obtener la respuesta correcta
            const correctTextInput = document.querySelector(`.correct-text-input[data-qindex="${qIndex}"]`);
            if (correctTextInput) {
                question.correctText = correctTextInput.value.trim();
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
        return alert('Todas las preguntas ya existen en el tema seleccionado');
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
    
    alert(`Se añadieron ${newQuestions.length} nuevas preguntas de ${scrapedQuestions.length} procesadas`);
});