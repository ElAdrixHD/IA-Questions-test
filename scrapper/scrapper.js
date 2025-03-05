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
    
    const questionNodes = doc.querySelectorAll('.que.multichoice');
    
    questionNodes.forEach((questionNode, index) => {
        const questionText = questionNode.querySelector('.qtext').textContent.trim();
        const answers = [];
        const answerNodes = questionNode.querySelectorAll('.answer .r0, .answer .r1');
        
        answerNodes.forEach((answerNode) => {
            const answerText = answerNode.querySelector('.flex-fill.ml-1').textContent.trim();
            answers.push({ 
                name: answerText, 
                correct: false
            });
        });
        
        questions.push({
            name: questionText,
            type: "choice",
            answers: answers
        });
    });
    
    return questions;
}

document.getElementById('processBtn').addEventListener('click', () => {
    const html = document.getElementById('htmlInput').value;
    scrapedQuestions = extractQuestionsFromHTML(html);
    displayResults(scrapedQuestions);
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
                    <option value="text">Texto libre</option>
                </select>
            </div>
            <ul class="answer-list">
                ${question.answers.map((answer, aIndex) => `
                    <li class="answer-item">
                        <label>
                            <input type="${question.type === 'multichoice' ? 'checkbox' : 'radio'}" 
                                   name="question-${qIndex}" 
                                   data-qindex="${qIndex}" 
                                   data-aindex="${aIndex}"
                                   ${answer.correct ? 'checked' : ''}>
                            ${answer.name}
                        </label>
                    </li>
                `).join('')}
            </ul>
        `;
        
        resultsContainer.appendChild(questionDiv);
    });

    // Actualizar tipos dinámicamente
    document.querySelectorAll('.type-select').forEach(select => {
        select.addEventListener('change', function() {
            const qIndex = this.dataset.qindex;
            scrapedQuestions[qIndex].type = this.value;
            displayResults(scrapedQuestions); // Redibujar
        });
    });
}

// Guardar en el schema (actualizado con verificación de duplicados)
document.getElementById('saveBtn').addEventListener('click', () => {
    const selectedSubject = document.getElementById('subjectSelect').value;
    const selectedTopic = document.getElementById('topicSelect').value;
    
    if (!selectedSubject || !selectedTopic) return alert('Selecciona asignatura y tema');
    
    // Marcar respuestas correctas
    scrapedQuestions.forEach((question, qIndex) => {
        const correctAnswers = Array.from(document.querySelectorAll(`input[name="question-${qIndex}"]:checked`));
        
        question.answers.forEach((answer, aIndex) => {
            answer.correct = correctAnswers.some(input => input.dataset.aindex == aIndex);
        });
        
        if (question.type === 'text') {
            question.answers = [];
        }
    });

    // Obtener preguntas existentes en el tema seleccionado
    const existingQuestions = currentSchema[selectedSubject][selectedTopic] || [];
    
    // Filtrar preguntas nuevas que no existan
    const newQuestions = scrapedQuestions.filter(scrapedQuestion => {
        return !existingQuestions.some(existingQuestion => {
            // Comparación por texto de pregunta (podrías añadir más criterios)
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