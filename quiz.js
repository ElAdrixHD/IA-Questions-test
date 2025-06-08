document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-quiz');
    const topicSelect = document.getElementById('topic-select');
    const questionCountInput = document.getElementById('question-count');
    const quizQuestionsContainer = document.getElementById('quiz-questions');
    const quizResultsContainer = document.getElementById('quiz-results');
    const themeSelectContainer = document.getElementById('theme-select-container');
    const goToScrapperButton = document.getElementById('go-to-scrapper');
    const exportPdfButton = document.getElementById('export-pdf');
    const exportSelectedPdfButton = document.getElementById('export-selected-pdf');

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
            
            // Limpiar cualquier opción anterior
            topicSelect.innerHTML = '<option value="" disabled selected>Selecciona una asignatura</option>';
            
            Object.keys(data).forEach(subject => {
                let totalQuestions = Object.values(data[subject]).reduce((total, current) => total + current.length, 0);
                let option = new Option(`${decodeUnicode(subject)} (${totalQuestions} preguntas)`, subject);
                topicSelect.options[topicSelect.options.length] = option;
            });
            
            // Mostrar un mensaje si no hay datos
            if (Object.keys(data).length === 0) {
                topicSelect.innerHTML = '<option value="" disabled selected>No hay asignaturas disponibles</option>';
            }
        })
        .catch(error => {
            console.error('Error cargando temas:', error);
            topicSelect.innerHTML = '<option value="" disabled selected>Error al cargar asignaturas</option>';
        });

    topicSelect.addEventListener('change', function() {
        const selectedSubject = topicSelect.value;
        themeSelectContainer.innerHTML = ''; // Limpia contenedor previo
        
        if (!selectedSubject || !globalData[selectedSubject]) {
            themeSelectContainer.innerHTML = '<div class="alert alert-warning">Selecciona una asignatura válida</div>';
            return;
        }

        // Agregar titulo al contenedor de temas
        themeSelectContainer.innerHTML = '<h6 class="mb-3 fw-bold"><i class="fas fa-bookmark me-2"></i>Selecciona los temas:</h6>';
        
        // Agregar checkbox para seleccionar todos
        const selectAllContainer = document.createElement('div');
        selectAllContainer.className = 'mb-2 pb-2 border-bottom';
        
        const selectAllLabel = document.createElement('label');
        selectAllLabel.className = 'form-check form-check-inline';
        
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-themes';
        selectAllCheckbox.className = 'form-check-input';
        
        selectAllLabel.appendChild(selectAllCheckbox);
        
        const selectAllText = document.createElement('span');
        selectAllText.textContent = 'Seleccionar todos';
        selectAllText.className = 'form-check-label fw-bold';
        selectAllLabel.appendChild(selectAllText);
        
        selectAllContainer.appendChild(selectAllLabel);
        themeSelectContainer.appendChild(selectAllContainer);
        
        // Event listener para "Seleccionar todos"
        selectAllCheckbox.addEventListener('change', function() {
            document.querySelectorAll('#theme-select-container input[type="checkbox"]:not(#select-all-themes)').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });

        Object.keys(globalData[selectedSubject]).forEach((theme, index) => {
            let questionCount = globalData[selectedSubject][theme].length;
            
            const themeLabel = document.createElement('label');
            themeLabel.className = 'form-check';
            
            const themeCheckbox = document.createElement('input');
            themeCheckbox.type = 'checkbox';
            themeCheckbox.id = `theme-${index}`;
            themeCheckbox.className = 'form-check-input';
            themeCheckbox.name = 'themes';
            themeCheckbox.value = theme;
            
            themeLabel.appendChild(themeCheckbox);
            
            const themeText = document.createElement('span');
            themeText.textContent = `${decodeUnicode(theme)} (${questionCount} preguntas)`;
            themeText.className = 'form-check-label';
            themeLabel.appendChild(themeText);
            
            themeSelectContainer.appendChild(themeLabel);
        });
    });

    goToScrapperButton.addEventListener('click', function() {
        window.location.href = 'scrapper.html';
    });

    // Iniciar el quiz
    startButton.addEventListener('click', function() {
        const selectedSubject = topicSelect.value;
        let selectedThemes = [];
        
        // Recoge todos los checkboxes marcados
        document.querySelectorAll('#theme-select-container input[type="checkbox"]:not(#select-all-themes):checked').forEach((checkbox) => {
            selectedThemes.push(checkbox.value);
        });
    
        if (!selectedSubject) {
            showAlert('Por favor, selecciona una asignatura.', 'warning');
            return;
        }
        
        if (selectedThemes.length === 0) {
            showAlert('Por favor, selecciona al menos un tema.', 'warning');
            return;
        }
    
        // Usar let en lugar de const para permitir modificar el valor más adelante
        let questionCount = parseInt(questionCountInput.value, 10);
        if (questionCount < 1) {
            showAlert('El número de preguntas debe ser al menos 1.', 'warning');
            return;
        }
        
        let filteredQuestions = [];
    
        // Filtra las preguntas basadas en los subtemas seleccionados
        selectedThemes.forEach(theme => {
            if(globalData[selectedSubject][theme]) {
                filteredQuestions = shuffleArray(filteredQuestions.concat(globalData[selectedSubject][theme]));
            }
        });
        
        if (filteredQuestions.length === 0) {
            showAlert('No hay preguntas disponibles para los temas seleccionados.', 'warning');
            return;
        }
    
        if (filteredQuestions.length < questionCount) {
            showAlert(`Solo hay ${filteredQuestions.length} preguntas disponibles. Se mostrarán todas.`, 'info');
            questionCount = filteredQuestions.length;
        }
        
        startQuiz(filteredQuestions, questionCount);
    });
    
    // Función para mostrar alertas
    function showAlert(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alertDiv.role = 'alert';
        
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insertar la alerta antes del contenedor de selección
        document.getElementById('quiz-selection').prepend(alertDiv);
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }

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
        const limitedQuestions = questionsArray.slice(0, questionCount);
        
        // Agregar título y navbar
        quizQuestionsContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <h2 class="mb-0">Preguntas del Test</h2>
                <button id="back-to-selection" class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-arrow-left me-1"></i>Volver
                </button>
            </div>
        `;
        
        // Event listener para el botón de volver
        document.getElementById('back-to-selection').addEventListener('click', resetQuiz);

        // Crear una card para cada pregunta
        limitedQuestions.forEach((question, index) => {
            const card = document.createElement('div');
            card.className = 'card question p-3 mb-3 shadow-sm';
            card.setAttribute('data-question-type', question.type);

            // Número y texto de la pregunta
            const questionHeader = document.createElement('div');
            questionHeader.className = 'd-flex align-items-start';
            
            const questionNumberBadge = document.createElement('span');
            questionNumberBadge.className = 'badge bg-primary rounded-pill me-2 mt-1';
            questionNumberBadge.textContent = index + 1;
            questionHeader.appendChild(questionNumberBadge);
            
            const questionText = document.createElement('p');
            questionText.textContent = decodeUnicode(question.name);
            questionText.className = 'bold mb-3';
 
            // Si la pregunta es de tipo especial, añadir la clase correspondiente
            if (question.type === 'multichoice') {
                questionText.classList.add('multichoice');
            } else if (question.type === 'text') {
                questionText.classList.add('text-autocomplete');
            }
            
            questionHeader.appendChild(questionText);
            card.appendChild(questionHeader);

            // Opciones de respuesta según el tipo de pregunta
            const answerContainer = document.createElement('div');
            answerContainer.className = 'mt-2';
            
            if (question.type === 'multichoice') {
                question.answers.forEach((answer, aIndex) => {
                    const answerDiv = document.createElement('div');
                    answerDiv.className = 'form-check mb-2';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'form-check-input';
                    checkbox.id = `question${index}-answer${aIndex}`;
                    checkbox.name = `question${index}`;
                    checkbox.value = answer.correct;
                    
                    const label = document.createElement('label');
                    label.className = 'form-check-label';
                    label.htmlFor = `question${index}-answer${aIndex}`;
                    label.textContent = decodeUnicode(answer.name);
                    
                    answerDiv.appendChild(checkbox);
                    answerDiv.appendChild(label);
                    answerContainer.appendChild(answerDiv);
                });
            } else if (question.type === 'choice') {
                const answerOptions = shuffleArray([...question.answers]);
                
                answerOptions.forEach((answer, aIndex) => {
                    const answerDiv = document.createElement('div');
                    answerDiv.className = 'form-check mb-2';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.className = 'form-check-input';
                    radio.id = `question${index}-answer${aIndex}`;
                    radio.name = `question${index}`;
                    radio.value = answer.correct;
                    
                    const label = document.createElement('label');
                    label.className = 'form-check-label';
                    label.htmlFor = `question${index}-answer${aIndex}`;
                    label.textContent = decodeUnicode(answer.name);
                    
                    answerDiv.appendChild(radio);
                    answerDiv.appendChild(label);
                    answerContainer.appendChild(answerDiv);
                });
            } else if (question.type === 'text') {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'mb-3';
                
                const label = document.createElement('label');
                label.className = 'form-label text-muted small';
                label.textContent = 'Escribe tu respuesta:';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control';
                input.name = `question${index}`;
                input.dataset.correctText = question.correctText;
                input.placeholder = 'Tu respuesta...';
                
                inputGroup.appendChild(label);
                inputGroup.appendChild(input);
                answerContainer.appendChild(inputGroup);
            }
            
            card.appendChild(answerContainer);
            quizQuestionsContainer.appendChild(card);
        });

        // Agregar botón para corregir respuestas
        const submitButtonContainer = document.createElement('div');
        submitButtonContainer.className = 'd-grid gap-2 col-md-6 mx-auto mb-4';
        
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Corregir respuestas';
        submitButton.className = 'btn btn-primary';
        submitButton.id = 'submit-button';
        submitButton.innerHTML = '<i class="fas fa-check-circle me-2"></i>Corregir respuestas';
        
        submitButton.addEventListener('click', calculateResults);
        submitButtonContainer.appendChild(submitButton);
        quizQuestionsContainer.appendChild(submitButtonContainer);
    }

    function calculateResults() {
        const questions = document.querySelectorAll('.card.question');
        let correctAnswers = 0;
        
        questions.forEach((card, index) => {
            let isCorrect = false;
            const questionType = card.getAttribute('data-question-type');
            
            // Eliminar cualquier feedback anterior
            card.classList.remove('correct', 'incorrect');
            const oldFeedback = card.querySelector('.feedback-container');
            if (oldFeedback) oldFeedback.remove();
            
            // Crear contenedor para el feedback
            const feedbackContainer = document.createElement('div');
            feedbackContainer.className = 'feedback-container mt-3 pt-3 border-top';
            
            if (questionType === 'choice' || questionType === 'multichoice') {
                const userAnswers = card.querySelectorAll(`input:checked`);
                let correctCount = 0;
                const correctOptions = [];
                
                // Obtener todas las respuestas correctas
                card.querySelectorAll('input').forEach(input => {
                    if (input.value === 'true') {
                        const labelText = document.querySelector(`label[for="${input.id}"]`).textContent;
                        correctOptions.push(labelText);
                    }
                });

                userAnswers.forEach(userAnswer => {
                    if (userAnswer.value === 'true') correctCount++;
                });

                // Lógica de validación
                if (questionType === 'choice' && correctCount === 1 && userAnswers.length === 1 && userAnswers[0].value === 'true') {
                    isCorrect = true;
                } else if (questionType === 'multichoice') {
                    // Contar total de opciones correctas
                    const totalCorrectOptions = card.querySelectorAll('input[value="true"]').length;
                    // Contar respuestas seleccionadas incorrectas
                    const incorrectSelected = Array.from(userAnswers).filter(input => input.value === 'false').length;
                    
                    // Es correcto si seleccionó todas las correctas y ninguna incorrecta
                    isCorrect = (correctCount === totalCorrectOptions && incorrectSelected === 0);
                }

                if (!isCorrect) {
                    feedbackContainer.innerHTML = `
                        <div class="alert alert-info mb-0">
                            <strong><i class="fas fa-info-circle me-2"></i>Respuesta${correctOptions.length > 1 ? 's' : ''} correcta${correctOptions.length > 1 ? 's' : ''}:</strong>
                            <ul class="mb-0 mt-1">
                                ${correctOptions.map(option => `<li>${option}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            } else if (questionType === 'text') {
                const input = card.querySelector('input[type="text"]');
                const correctText = input.dataset.correctText;
                const userAnswer = input.value.trim().toLowerCase();
                
                isCorrect = (userAnswer === correctText.toLowerCase());
                
                if (!isCorrect) {
                    feedbackContainer.innerHTML = `
                        <div class="alert alert-info mb-0">
                            <strong><i class="fas fa-info-circle me-2"></i>Respuesta correcta:</strong> ${correctText}
                        </div>
                    `;
                }
            }

            // Aplicar estilo visual según resultado
            if (isCorrect) {
                correctAnswers++;
                card.classList.add('correct');
                
                // Añadir badge de correcto
                const badgeContainer = document.createElement('div');
                badgeContainer.className = 'mt-2 text-success';
                badgeContainer.innerHTML = '<i class="fas fa-check-circle me-1"></i><strong>¡Correcto!</strong>';
                
                feedbackContainer.appendChild(badgeContainer);
            } else {
                card.classList.add('incorrect');
            }
            
            // Añadir el feedback a la tarjeta
            card.appendChild(feedbackContainer);
        });

        // Calcular puntuación
        const questionCount = questions.length;
        const score = (correctAnswers / questionCount) * 10;
        
        // Mostrar resultados
        quizResultsContainer.innerHTML = '';
        quizResultsContainer.style.display = 'block';
        
        // Crear contenedor de resultados con más información
        quizResultsContainer.innerHTML = `
            <div class="text-center">
                <h3>Resultados del Test</h3>
                <div class="progress mb-3" style="height: 25px;">
                    <div class="progress-bar ${score >= 5 ? 'bg-success' : 'bg-danger'}" 
                         role="progressbar" 
                         style="width: ${correctAnswers / questionCount * 100}%;" 
                         aria-valuenow="${correctAnswers}" 
                         aria-valuemin="0" 
                         aria-valuemax="${questionCount}">
                        ${correctAnswers}/${questionCount}
                    </div>
                </div>
                <p class="mb-3">Has acertado <strong>${correctAnswers}</strong> de <strong>${questionCount}</strong> preguntas.</p>
                <h4 class="mb-4">Tu nota es: <span class="${score >= 5 ? 'text-success' : 'text-danger'}">${score.toFixed(2)}</span> sobre 10</h4>
                
                <div class="d-flex justify-content-center gap-2">
                    <button id="hide-show-answers" class="btn btn-outline-secondary">
                        <i class="fas fa-eye-slash me-2"></i>Ocultar respuestas correctas
                    </button>
                    <button id="retry-quiz" class="btn btn-primary">
                        <i class="fas fa-redo me-2"></i>Hacer otro test
                    </button>
                </div>
            </div>
        `;
        
        // Event listener para el botón de ocultar/mostrar respuestas
        document.getElementById('hide-show-answers').addEventListener('click', function() {
            const button = this;
            const correctCards = document.querySelectorAll('.card.question.correct');
            
            if (button.getAttribute('data-hidden') === 'true') {
                // Mostrar tarjetas
                correctCards.forEach(card => {
                    card.style.display = 'block';
                });
                button.innerHTML = '<i class="fas fa-eye-slash me-2"></i>Ocultar respuestas correctas';
                button.setAttribute('data-hidden', 'false');
            } else {
                // Ocultar tarjetas
                correctCards.forEach(card => {
                    card.style.display = 'none';
                });
                button.innerHTML = '<i class="fas fa-eye me-2"></i>Mostrar respuestas correctas';
                button.setAttribute('data-hidden', 'true');
            }
        });
        
        // Event listener para el botón de hacer otro test
        document.getElementById('retry-quiz').addEventListener('click', resetQuiz);
        
        // Scroll a los resultados
        quizResultsContainer.scrollIntoView({ behavior: 'smooth' });

        // Animación de confeti si la nota es 8 o superior
        if (score >= 8 && typeof confetti === 'function') {
            confetti({
                particleCount: 400,
                spread: 90,
                origin: { y: 0.5 },
                zIndex: 9999
            });
        }
        // Animación de "suspenso" si la nota es menor de 5
        else if (score < 5) {
            // Crear un contenedor para la lluvia de emojis
            const emojiRain = document.createElement('div');
            emojiRain.id = 'emoji-rain';
            emojiRain.style.position = 'fixed';
            emojiRain.style.top = '0';
            emojiRain.style.left = '0';
            emojiRain.style.width = '100vw';
            emojiRain.style.height = '100vh';
            emojiRain.style.pointerEvents = 'none';
            emojiRain.style.zIndex = '9999';
            document.body.appendChild(emojiRain);

            // Crear múltiples emojis que caen
            const emojiCount = 30;
            for (let i = 0; i < emojiCount; i++) {
                const emoji = document.createElement('span');
                emoji.textContent = '😢';
                emoji.style.position = 'absolute';
                emoji.style.left = Math.random() * 100 + 'vw';
                emoji.style.top = '-3em';
                emoji.style.fontSize = (2 + Math.random() * 2) + 'rem';
                emoji.style.opacity = 0.85;
                emoji.style.transition = 'transform 2.5s linear, opacity 2.5s linear';
                emojiRain.appendChild(emoji);
                setTimeout(() => {
                    emoji.style.transform = `translateY(${90 + Math.random() * 10}vh)`;
                    emoji.style.opacity = 0.2;
                }, 50 + Math.random() * 500);
            }
            // Eliminar la animación tras unos segundos
            setTimeout(() => {
                if (emojiRain.parentNode) emojiRain.parentNode.removeChild(emojiRain);
            }, 3000);
        }
    }

    // Función para mezclar aleatoriamente un array
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Intercambio de elementos
        }
        return newArray;
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

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Event listener para exportar todas las preguntas a PDF
    document.getElementById('export-pdf').addEventListener('click', function() {
        const selectedSubject = topicSelect.value;
        
        // Validaciones básicas
        if (!selectedSubject) {
            showAlert("Por favor, selecciona una asignatura primero.", 'warning');
            return;
        }
        
        fetch('schema.json')
            .then(response => response.json())
            .then(data => {
                const questions = data[selectedSubject];
                generatePDF(questions, selectedSubject); 
            })
            .catch(error => {
                console.error('Error generando PDF:', error);
                showAlert("Ocurrió un error al generar el PDF.", 'danger');
            });
    });

    // Event listener para exportar preguntas seleccionadas a PDF
    document.getElementById('export-selected-pdf').addEventListener('click', function() {
        const selectedSubject = topicSelect.value;
        const selectedThemes = Array.from(document.querySelectorAll('#theme-select-container input[type="checkbox"]:not(#select-all-themes):checked'))
                                    .map(checkbox => checkbox.value);
    
        // Validaciones básicas
        if (!selectedSubject) {
            showAlert("Por favor, selecciona una asignatura primero.", 'warning');
            return;
        }
        
        if (selectedThemes.length === 0) {
            showAlert("Por favor, selecciona al menos un tema.", 'warning');
            return;
        }
    
        // Filtrar preguntas de los temas seleccionados
        let filteredQuestions = {};
        
        selectedThemes.forEach(theme => {
            if (globalData[selectedSubject] && globalData[selectedSubject][theme]) {
                filteredQuestions[theme] = globalData[selectedSubject][theme];
            }
        });
    
        if (Object.keys(filteredQuestions).length === 0) {
            showAlert("No hay preguntas en los temas seleccionados.", 'warning');
            return;
        }
    
        // Generar PDF con las preguntas filtradas
        generatePDF(filteredQuestions, selectedSubject);
    });

    function createThemeElements(selectedSubject, globalData, themeSelectContainer) {
        themeSelectContainer.innerHTML = ''; // Limpia contenedor previo
        
        if (!selectedSubject || !globalData[selectedSubject]) {
            themeSelectContainer.innerHTML = '<div class="alert alert-warning">Selecciona una asignatura válida</div>';
            return;
        }
    
        // Agregar titulo al contenedor de temas
        themeSelectContainer.innerHTML = '<h6 class="mb-3 fw-bold"><i class="fas fa-bookmark me-2"></i>Selecciona los temas:</h6>';
        
        // Agregar checkbox para seleccionar todos
        const selectAllContainer = document.createElement('div');
        selectAllContainer.className = 'mb-2 pb-2 border-bottom';
        
        const selectAllLabel = document.createElement('label');
        selectAllLabel.className = 'form-check form-check-inline';
        
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-themes';
        selectAllCheckbox.className = 'form-check-input';
        
        selectAllLabel.appendChild(selectAllCheckbox);
        
        const selectAllText = document.createElement('span');
        selectAllText.textContent = 'Seleccionar todos';
        selectAllText.className = 'form-check-label fw-bold';
        selectAllLabel.appendChild(selectAllText);
        
        selectAllContainer.appendChild(selectAllLabel);
        themeSelectContainer.appendChild(selectAllContainer);
        
        // Event listener para "Seleccionar todos"
        selectAllCheckbox.addEventListener('change', function() {
            document.querySelectorAll('#theme-select-container input[type="checkbox"]:not(#select-all-themes)').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    
        // Contenedor de temas para mejor organización en móvil
        const themesListContainer = document.createElement('div');
        themesListContainer.className = 'themes-list';
        themeSelectContainer.appendChild(themesListContainer);
    
        Object.keys(globalData[selectedSubject]).forEach((theme, index) => {
            let questionCount = globalData[selectedSubject][theme].length;
            
            const themeLabel = document.createElement('label');
            themeLabel.className = 'form-check theme-label';
            
            const themeCheckbox = document.createElement('input');
            themeCheckbox.type = 'checkbox';
            themeCheckbox.id = `theme-${index}`;
            themeCheckbox.className = 'form-check-input';
            themeCheckbox.name = 'themes';
            themeCheckbox.value = theme;
            
            const themeText = document.createElement('span');
            themeText.textContent = `${decodeUnicode(theme)} (${questionCount} preguntas)`;
            themeText.className = 'form-check-label';
            
            themeLabel.appendChild(themeCheckbox);
            themeLabel.appendChild(themeText);
            
            themesListContainer.appendChild(themeLabel);
        });
    }

    topicSelect.addEventListener('change', function() {
        const selectedSubject = topicSelect.value;
        createThemeElements(selectedSubject, globalData, themeSelectContainer);
    });
    

    // Función mejorada para generar el PDF
    function generatePDF(questions, subjectName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        const margin = 10; 
        const maxWidth = doc.internal.pageSize.getWidth() - 2 * margin;
        let y = margin;
        const lineHeight = 8;
        
        // Añadir título del documento
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const title = `Cuestionario de ${decodeUnicode(subjectName)}`;
        doc.text(title, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += lineHeight * 2;
        
        // Añadir fecha
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        const today = new Date();
        const dateStr = today.toLocaleDateString('es-ES');
        doc.text(`Generado el ${dateStr}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += lineHeight * 2;
        
        // Función para añadir texto con control de saltos de página
        const addText = (text, isBold = false, isAnswerCorrect = false) => {
            const fontSize = isAnswerCorrect ? 8 : (isBold ? 10 : 8);
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", isAnswerCorrect ? "bold" : (isBold ? "bold" : "normal"));
            
            // Dividir el texto en líneas que quepan en el ancho
            const splitText = doc.splitTextToSize(text, maxWidth);
            
            splitText.forEach(line => {
                if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    y = margin * 1.5;
                }
                doc.text(line, margin, y);
                y += lineHeight;
            });
        };
        
        // Contador para preguntas
        let questionCounter = 0;
        
        // Recorrer todos los temas y sus preguntas
        for (const theme in questions) {
            // Añadir el nombre del tema como encabezado
            y += lineHeight; // Espacio antes del título de sección
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(decodeUnicode(theme), margin, y);
            y += lineHeight * 1.5;
            
            // Agregar las preguntas del tema
            questions[theme].forEach((question) => {
                questionCounter++;
                
                // Añadir pregunta
                addText(`${questionCounter}. ${decodeUnicode(question.name)}`, true);
                
                // Añadir todas las respuestas
                if (question.type !== 'text') {
                    question.answers.forEach((answer, ansIndex) => {
                        const answerText = `${decodeUnicode(answer.name)}`;
                        const isCorrect = answer.correct;
                        
                        if (isCorrect) {
                            addText(`- ${answerText}`, false, true);
                        } else {
                            addText(`- ${answerText}`, false); 
                        }
                    });
                } else {
                    addText(`- ${question.correctText}`, false, true);
                }
                
                y += lineHeight * 0.5; // Espacio entre preguntas
            });
            
            y += lineHeight; // Espacio después de cada tema
        }
    
        // Guardar PDF
        const fileName = `${decodeUnicode(subjectName).replace(/[^a-zA-Z0-9]/g, '_')}_preguntas.pdf`;
        doc.save(fileName);
        
        // Mostrar mensaje de éxito
        showAlert(`PDF generado con éxito: "${fileName}"`, 'success');
    }

    // --- MODO OSCURO ---
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    function setDarkMode(enabled) {
        document.body.classList.toggle('dark-mode', enabled);
        if (enabled) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
        } else {
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
        }
    }
    // Inicializar modo según localStorage o preferencia del sistema
    let darkMode = localStorage.getItem('darkMode');
    if (darkMode === null) darkMode = prefersDark ? 'true' : 'false';
    setDarkMode(darkMode === 'true');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const enabled = !document.body.classList.contains('dark-mode');
            setDarkMode(enabled);
            localStorage.setItem('darkMode', enabled);
        });
    }
});