document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-quiz');
    const topicSelect = document.getElementById('topic-select');
    const questionCountInput = document.getElementById('question-count');
    const quizQuestionsContainer = document.getElementById('quiz-questions');
    const quizResultsContainer = document.getElementById('quiz-results');
    const themeSelectContainer = document.getElementById('theme-select-container');


    // Define una variable para almacenar los datos globalmente
     let globalData = {};

    
    // Cargar los temas del JSON al iniciar
    fetch('schema.json')
        .then(response => response.json())
        .then(data => {
            globalData = data; // Guarda los datos para uso global
            topicSelect.appendChild(new Option("Selecciona una asignatura", "", true, true)); // Opción por defecto no seleccionable
            Object.keys(data).forEach(subject => {
                let totalQuestions = Object.values(data[subject]).reduce((total, current) => total + current.length, 0);
                let option = new Option(`${subject} (${totalQuestions} preguntas)`, subject);
                topicSelect.options[topicSelect.options.length] = option;
            });
        });

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
            textSpan.textContent = `${theme.replace(/\\u00f3/g, 'ó')} (${questionCount} preguntas)`;
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

            questionText.textContent = `${index + 1}. ${question.name}`
 
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
                    label.append(` ${answer.name}`);
                    card.appendChild(label);
                    card.appendChild(document.createElement('br'));
                });
            } else if (question.type === 'choice') {
                const answerOptions = question.answers;
                shuffleArray(answerOptions);

                answerOptions.forEach(answer => {
                    const label = document.createElement('label');
                    label.innerHTML = `<input type="radio" name="question${index}" value="${answer.correct}"> ${answer.name}`;
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
            let isCorrect = false; // Asumimos que la respuesta es incorrecta inicialmente
            const questionType = card.getAttribute('data-question-type');

    
            if (questionType === 'choice' || questionType === 'multichoice') {
                const userAnswers = card.querySelectorAll(`input:checked`);
                let correctCount = 0;
                userAnswers.forEach(userAnswer => {
                    if (userAnswer.value === 'true') correctCount++; // Contamos las respuestas correctas seleccionadas por el usuario
                });
                
                // Para preguntas de tipo 'choice', solo puede haber una respuesta correcta
                if (questionType === 'choice' && correctCount === 1) isCorrect = true;
                
                // Para preguntas de tipo 'multichoice', todas las respuestas correctas deben ser seleccionadas y ninguna incorrecta
                const totalCorrectAnswers = card.querySelectorAll(`input[value="true"]`).length;
                if (questionType === 'multichoice' && correctCount === totalCorrectAnswers && userAnswers.length === totalCorrectAnswers) isCorrect = true;
            } else if (questionType === 'text') {
                // Aquí iría tu lógica para validar las respuestas de tipo texto
                // ...
            }
    
            // Cambiar el color de fondo de la card según si la respuesta es correcta o no
            if (isCorrect) {
                correctAnswers++;
                card.style.backgroundColor = "#ccffcc"; // Verde pastel para respuestas correctas
                card.setAttribute('data-correct', 'true'); // Marca la card como correcta
            } else {
                card.style.backgroundColor = "#ffcccc"; // Rojo pastel para respuestas incorrectas
                card.removeAttribute('data-correct'); // Marca la card como incorrecta

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
