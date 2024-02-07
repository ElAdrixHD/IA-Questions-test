document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-quiz');
    const topicSelect = document.getElementById('topic-select');
    const questionCountInput = document.getElementById('question-count');
    const quizQuestionsContainer = document.getElementById('quiz-questions');
    const quizResultsContainer = document.getElementById('quiz-results');

    // Cargar los temas del JSON al iniciar
    fetch('schema.json')
        .then(response => response.json())
        .then(data => {
            for (let topic in data) {
                let option = document.createElement('option');
                option.value = topic;
                option.textContent = topic;
                topicSelect.appendChild(option);
            }
        });

    // Iniciar el quiz
    startButton.addEventListener('click', function() {
        const selectedTopic = topicSelect.value;
        const questionCount = parseInt(questionCountInput.value, 10);
        fetch('schema.json')
            .then(response => response.json())
            .then(data => {
                const questions = data[selectedTopic];
                startQuiz(questions, questionCount);
            });
    });

    function startQuiz(questionsObj, questionCount) {
        quizQuestionsContainer.innerHTML = '';
        quizResultsContainer.innerHTML = '';
        quizResultsContainer.style.display = 'none';
    
        // Convertir el objeto de preguntas en un array de preguntas
        let questionsArray = Object.values(questionsObj).flat(); // Asumiendo estructura anidada
    
        // Mezclar el array de preguntas aleatoriamente
        questionsArray = shuffleArray(questionsArray);
    
        // Limitar el número de preguntas a la cantidad seleccionada por el usuario
        const limitedQuestions = questionsArray.slice(0, questionCount);
    
       
        limitedQuestions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            
            const questionText = document.createElement('p');
            questionText.textContent = `${index + 1}. ${question.name}`;
            questionDiv.appendChild(questionText);
            
            // Mezclar las opciones de respuesta
            const answerOptions = question.answers;
            shuffleArray(answerOptions);

            answerOptions.forEach(answer => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="radio" name="question${index}" value="${answer.correct}"> ${answer.name}`;
                questionDiv.appendChild(label);
                questionDiv.appendChild(document.createElement('br'));
            });
    
    
            quizQuestionsContainer.appendChild(questionDiv);
        });
    
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Enviar respuestas';
        submitButton.addEventListener('click', calculateResults);
        quizQuestionsContainer.appendChild(submitButton);
    
        quizQuestionsContainer.style.display = 'block';
    }
    

    function calculateResults() {
        const questions = document.querySelectorAll('.question');
        let correctAnswers = 0;
    
        questions.forEach(question => {
            const correctAnswer = question.querySelector(`input[type="radio"][value="true"]`);
            const userAnswer = question.querySelector(`input[type="radio"]:checked`);
    
            // Encuentra todas las opciones de respuesta y restablece el color por defecto
            const allAnswers = question.querySelectorAll('label');
            allAnswers.forEach(answer => answer.style.color = ''); // Restablece el color
    
            if (userAnswer) {
                // Si el usuario seleccionó una respuesta, comprueba si es correcta
                const isCorrect = userAnswer.value === 'true';
                if (isCorrect) {
                    correctAnswers++;
                    userAnswer.parentElement.style.color = 'green';
                } else {
                    userAnswer.parentElement.style.color = 'red';
                }
            }
            
            // Marca la correcta en verde solo si existe una respuesta correcta marcada
            if (correctAnswer) {
                correctAnswer.parentElement.style.color = 'green';
            }
        });
    
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
    
        // Deshabilitar el botón de envío para evitar reenvíos
        document.querySelector('button').disabled = true;
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
        // Ocultar los contenedores de resultados y preguntas
        quizQuestionsContainer.style.display = 'none';
        quizResultsContainer.style.display = 'none';

        // Limpiar el contenido de preguntas y resultados
        quizQuestionsContainer.innerHTML = '';
        quizResultsContainer.innerHTML = '';

        // Habilitar nuevamente el botón de inicio y mostrar las opciones de selección
        document.getElementById('start-quiz').disabled = false;
        document.getElementById('quiz-selection').style.display = 'block';

        // Opcional: Restablecer los valores predeterminados de selección y número de preguntas si es necesario
        document.getElementById('topic-select').selectedIndex = 0;
        document.getElementById('question-count').value = 5; // Ajusta esto según tu valor predeterminado
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
