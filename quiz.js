document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-quiz');
    const topicSelect = document.getElementById('topic-select');
    const questionCountInput = document.getElementById('question-count');
    const quizQuestionsContainer = document.getElementById('quiz-questions');
    const quizResultsContainer = document.getElementById('quiz-results');
    const themeSelectContainer = document.getElementById('theme-select-container');


    // Define una variable para almacenar los datos globalmente
     let globalData = {};

    // Función para decodificar secuencias Unicode en una cadena
    function decodeUnicode(str) {
        return str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) =>
            String.fromCharCode(parseInt(grp, 16))
        );
    }

    // Cargar los temas del JSON al iniciar
    fetch('schema.json')
        .then(response => response.json())
        .then(data => {
            globalData = data; // Guarda los datos para uso global
            topicSelect.appendChild(new Option("Selecciona una asignatura", "", true, true)); // Opción por defecto no seleccionable
            Object.keys(data).forEach(subject => {
                let totalQuestions = Object.values(data[subject]).reduce((total, current) => total + current.length, 0);
                let option = new Option(`${decodeUnicode(subject)} (${totalQuestions} preguntas)`, subject);
                topicSelect.options[topicSelect.options.length] = option;
            });
    })
    .catch(error => console.error('Error cargando temas:', error));

    topicSelect.addEventListener('change', function() {
        const selectedSubject = topicSelect.value;
        themeSelectContainer.innerHTML = ''; // Limpia contenedor previo

        Object.keys(globalData[selectedSubject]).forEach((theme, index) => {
            let questionCount = globalData[selectedSubject][theme].length;
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `theme-${index}`;
            checkbox.name = 'themes';
            checkbox.value = theme;
        
            let label = document.createElement('label');
            label.htmlFor = `theme-${index}`;
            label.appendChild(checkbox); // Añade el checkbox al label
            
            let textSpan = document.createElement('span'); // Crea un span para el texto
            textSpan.textContent = `${decodeUnicode(theme)} (${questionCount} preguntas)`;
            label.appendChild(textSpan); // Añade el span al label
            
            themeSelectContainer.appendChild(label);
            themeSelectContainer.appendChild(document.createElement('br'));
        });
    });

    // Iniciar el quiz
    startButton.addEventListener('click', function() {
        const selectedSubject = topicSelect.value;
        let selectedThemes = [];
        // Recoge todos los checkboxes marcados
        document.querySelectorAll('#theme-select-container input[type="checkbox"]:checked').forEach((checkbox) => {
            selectedThemes.push(checkbox.value);
        });
    
        if (selectedThemes.length === 0) {
            alert("Por favor, selecciona al menos un tema.");
            return;
        }
    
        const questionCount = parseInt(questionCountInput.value, 10);
        let filteredQuestions = [];
    
        // Filtra las preguntas basadas en los subtemas seleccionados
        selectedThemes.forEach(theme => {
            if(globalData[selectedSubject][theme]) {
                filteredQuestions = shuffleArray(filteredQuestions.concat(globalData[selectedSubject][theme]))
            }
        });
    
        startQuiz(filteredQuestions, questionCount);
    });

    function startQuiz(questionsArray, questionCount) {
        // Ocultar contenedor de selección de quiz
        document.getElementById('quiz-container').style.display = 'none';

        // Mostrar contenedor de preguntas
        quizQuestionsContainer.style.display = 'block';

        // Limpiar contenedor de preguntas anterior
        quizQuestionsContainer.innerHTML = '';
        quizResultsContainer.innerHTML = '';
        quizResultsContainer.style.display = 'none';
    
        // Limitar el número de preguntas a la cantidad seleccionada por el usuario
        const limitedQuestions = questionsArray.slice(0, questionCount)

        // Crear una card para cada pregunta
        limitedQuestions.forEach((question, index) => {
            const card = document.createElement('div');
            card.className = 'card question';
            card.style.marginBottom = '10px'; // Separación entre cards

            const questionText = document.createElement('p');

            questionText.textContent = `${index + 1}. ${decodeUnicode(question.name)} `
            questionText.classList.add('bold');
 
            // Si la pregunta es de tipo 'multichoice', añadir la clase 'multichoice'
            if (question.type === 'multichoice') {
                questionText.classList.add('multichoice');
            }

            // Si la pregunta es de tipo 'text', añadir la clase 'text-autocomplete'
            if (question.type === 'text') {
                questionText.classList.add('text-autocomplete');
            }


            
            card.appendChild(questionText);

            // Verificar el tipo de pregunta
            if (question.type === 'multichoice') {
                question.answers.forEach(answer => {
                    const label = document.createElement('label');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = `question${index}`;
                    checkbox.value = answer.correct;
                    label.appendChild(checkbox);
                    label.append(` ${decodeUnicode(answer.name)}`);
                    card.appendChild(label);
                    card.appendChild(document.createElement('br'));
                });
            } else if (question.type === 'choice') {
                const answerOptions = question.answers;
                shuffleArray(answerOptions);

                answerOptions.forEach(answer => {
                    const label = document.createElement('label');
                    label.innerHTML = `<input type="radio" name="question${index}" value="${answer.correct}"> ${decodeUnicode(answer.name)}`;
                    card.appendChild(label);
                    card.appendChild(document.createElement('br'));
                });
            } else if (question.type === 'text') {
                // Crear un input de texto para la respuesta
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `question${index}`;
                input.dataset.correctText = question.correctText; // Guarda la respuesta correcta en un data attribute

                card.appendChild(input);
            }
            card.setAttribute('data-question-type', question.type);
            quizQuestionsContainer.appendChild(card);
        });

        // Agregar botón para corregir respuestas
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Corregir respuestas del test';
        submitButton.addEventListener('click', calculateResults);
        quizQuestionsContainer.appendChild(submitButton);
    }

    
// ¿Cuál de las siguientes afirmaciones sobre Hadoop es falsa?
function calculateResults() {
    const questions = document.querySelectorAll('.card');
    let correctAnswers = 0;
    
    questions.forEach((card, index) => {
        let isCorrect = false;
        const questionType = card.getAttribute('data-question-type');
        let correctAnswerElement = card.querySelector('.correct-answer');

        // Eliminar respuesta correcta anterior si existe
        if (correctAnswerElement) correctAnswerElement.remove();

        if (questionType === 'choice' || questionType === 'multichoice') {
            const userAnswers = card.querySelectorAll(`input:checked`);
            let correctCount = 0;
            const correctOptions = [];
            
            // Obtener todas las respuestas correctas
            card.querySelectorAll('input').forEach(input => {
                if (input.value === 'true') correctOptions.push(input.parentElement.textContent.trim());
            });

            userAnswers.forEach(userAnswer => {
                if (userAnswer.value === 'true') correctCount++;
            });

            // Crear elemento para mostrar respuesta correcta
            const answerDiv = document.createElement('div');
            answerDiv.className = 'correct-answer';
            answerDiv.innerHTML = `<strong>Respuesta(s) correcta(s):</strong> ${correctOptions.join(', ')}`;
            
            // Lógica de validación
            if (questionType === 'choice' && correctCount === 1) {
                isCorrect = true;
            } else if (questionType === 'multichoice' && correctCount === correctOptions.length && userAnswers.length === correctOptions.length) {
                isCorrect = true;
            }

            if (!isCorrect) card.appendChild(answerDiv);

        } else if (questionType === 'text') {
            const input = card.querySelector('input[type="text"]');
            const correctText = input.dataset.correctText;
            const userAnswer = input.value.trim().toLowerCase();
            
            // Crear elemento para respuesta correcta
            const answerDiv = document.createElement('div');
            answerDiv.className = 'correct-answer';
            answerDiv.innerHTML = `<strong>Respuesta correcta:</strong> ${correctText}`;
            
            isCorrect = (userAnswer === correctText.toLowerCase());
            if (!isCorrect) card.appendChild(answerDiv);
        }

        // Estilo visual
        if (isCorrect) {
            correctAnswers++;
            card.style.backgroundColor = "#ccffcc";
        } else {
            card.style.backgroundColor = "#ffcccc";
            card.querySelector('.correct-answer').style.color = "#006600"; // Color para respuesta correcta
        }
    });
    
        if (questions.length > 0) {
            const score = (correctAnswers / questions.length) * 10;
            quizResultsContainer.innerHTML = `Has acertado ${correctAnswers} de ${questions.length} preguntas. Tu nota es: ${score.toFixed(2)} sobre 10.`;
        } else {
            quizResultsContainer.innerHTML = "No hay preguntas para mostrar.";
        }
        
        quizResultsContainer.style.display = 'block';

    
            // Verificar si el checkbox ya fue añadido para evitar duplicados
        if (!document.getElementById('hide-correct-answers-checkbox')) {
            console.log("Añadiendo checkbox y etiqueta al contenedor de resultados.");

            // Crear y añadir el checkbox para ocultar respuestas correctas
            const hideCorrectAnswersCheckbox = document.createElement('input');
            hideCorrectAnswersCheckbox.type = 'checkbox';
            hideCorrectAnswersCheckbox.id = 'hide-correct-answers-checkbox';
            hideCorrectAnswersCheckbox.addEventListener('change', toggleCorrectAnswersVisibility);

            const hideCorrectAnswersLabel = document.createElement('label');
            hideCorrectAnswersLabel.htmlFor = 'hide-correct-answers-checkbox';
            hideCorrectAnswersLabel.textContent = 'Ocultar respuestas correctas';

            quizResultsContainer.appendChild(hideCorrectAnswersCheckbox);
            quizResultsContainer.appendChild(hideCorrectAnswersLabel);
        }
    
        const questionCount = questions.length; // La cantidad real de preguntas presentadas
        const score = (correctAnswers / questionCount) * 10; // Escala la nota a 10
        quizResultsContainer.innerHTML = `Has acertado ${correctAnswers} de ${questionCount} preguntas. Tu nota es: ${score.toFixed(2)} sobre 10.`;
        quizResultsContainer.style.display = 'block';
    
        // Crear y mostrar el botón "Hacer otro test" después de mostrar los resultados
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Hacer otro test';
        retryButton.id = 'retry-quiz';
        quizResultsContainer.appendChild(retryButton);
    
        // Añadir un listener al botón para reiniciar el test
        retryButton.addEventListener('click', resetQuiz);
        
    

    }
    

    function toggleCorrectAnswersVisibility() {
        const checkbox = document.getElementById('hide-correct-answers-checkbox');
        const correctAnswers = document.querySelectorAll('.card[data-correct="true"]');
    
        correctAnswers.forEach(card => {
            card.style.display = checkbox.checked ? 'none' : 'block';
        });
    }

    // Función para mezclar aleatoriamente un array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Intercambio de elementos
        }
        return array;
    }


    function resetQuiz() {
        // Hacer visible el contenedor de quiz nuevamente
        document.getElementById('quiz-container').style.display = 'block';


        // Ocultar los contenedores de resultados y preguntas
        quizQuestionsContainer.style.display = 'none';
        quizResultsContainer.style.display = 'none';

        // Limpiar el contenido de preguntas y resultados
        quizQuestionsContainer.innerHTML = '';
        quizResultsContainer.innerHTML = '';

        // Habilitar nuevamente el botón de inicio y mostrar las opciones de selección
        document.getElementById('start-quiz').disabled = false;
        document.getElementById('quiz-selection').style.display = 'block';
    }

    document.getElementById('export-pdf').addEventListener('click', function() {
    const selectedTopic = document.getElementById('topic-select').value;
    fetch('schema.json')
        .then(response => response.json())
        .then(data => {
            const questions = data[selectedTopic];
            generatePDF(questions, selectedTopic); 
        });
    });

    function generatePDF(questions, subjectName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let y = 10; // Posición inicial en el eje Y para el texto
        let questionsArray = Object.values(questions).flat(); // Asumiendo estructura anidada

        questionsArray.forEach((question, index) => {
            doc.text(10, y, `${index + 1}. ${question.name}`);
            y += 10; // Ajusta según sea necesario para tu formato
            const correctAnswer = question.answers.find(answer => answer.correct);
            if (correctAnswer) {
                doc.text(15, y, `Respuesta correcta: ${correctAnswer.name}`);
                y += 10; // Incrementa Y para la próxima pregunta
            }

            // Asegúrate de no salirte de la página, si es necesario, añade una nueva
            if (y > 280) {
                doc.addPage();
                y = 10; // Restablece la posición Y para la nueva página
            }
        });

        // Guarda el documento
        const fileName = `${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_preguntas.pdf`;
        // Guarda el documento con el nombre de la asignatura incluido
        doc.save(fileName);
    }

});
