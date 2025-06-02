// validateSchema.js

const fs = require('fs');
const filePath = 'schema.json';

// Función para decodificar secuencias Unicode en una cadena
function decodeUnicode(str) {
  return str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) =>
    String.fromCharCode(parseInt(grp, 16))
  );
}

// Función para normalizar el texto de las preguntas para comparación
function normalizeQuestionText(text) {
  return decodeUnicode(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[¿?¡!]/g, ''); // Quitar signos de puntuación de apertura/cierre
}

// Leer el fichero schema.json
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error leyendo el fichero ${filePath}:`, err);
    process.exit(1);
  }

  try {
    const jsonData = JSON.parse(data);
    console.log('JSON cargado correctamente.');
    console.log('=====================================\n');
    
    // Validar la estructura del JSON
    const errors = validateSchema(jsonData);
    
    if (errors.length > 0) {
      console.error('❌ Se encontraron errores en el esquema:');
      errors.forEach(error => console.error('  - ' + error));
    } else {
      console.log('✅ La estructura del esquema es válida.');
    }
    
    console.log('\n=====================================\n');
    
    // Buscar preguntas duplicadas
    const duplicates = findDuplicateQuestions(jsonData);
    
    if (duplicates.length > 0) {
      console.warn('⚠️  Se encontraron preguntas duplicadas:\n');
      duplicates.forEach((duplicate, index) => {
        console.log(`${index + 1}. Pregunta: "${decodeUnicode(duplicate.questionText)}"`);
        console.log('   Encontrada en:');
        duplicate.locations.forEach(loc => {
          console.log(`     - Asignatura: ${decodeUnicode(loc.subject)} | Tema: ${decodeUnicode(loc.theme)} | Posición: ${loc.index + 1}`);
        });
        console.log('');
      });
      console.log(`Total de preguntas duplicadas: ${duplicates.length}`);
    } else {
      console.log('✅ No se encontraron preguntas duplicadas.');
    }
    
    console.log('\n=====================================\n');
    
    // Mostrar estadísticas
    showStatistics(jsonData);
    
    // Determinar código de salida
    if (errors.length > 0) {
      process.exit(1);
    }
    
  } catch (parseError) {
    console.error('Error de parseo del JSON:', parseError.message);
    process.exit(1);
  }
});

/**
 * Función para validar la estructura del schema.
 * @param {object} data - El JSON parseado del schema.
 * @returns {string[]} Array de errores encontrados (vacío si no hay errores).
 */
function validateSchema(data) {
  const errors = [];

  // El JSON debe ser un objeto (no array ni null)
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('El JSON debe ser un objeto que contenga asignaturas.');
    return errors;
  }

  // Recorrer cada asignatura
  for (const subject in data) {
    const subjectValue = data[subject];
    if (typeof subjectValue !== 'object' || subjectValue === null || Array.isArray(subjectValue)) {
      errors.push(`La asignatura "${subject}" debe contener un objeto de temas.`);
      continue;
    }

    // Recorrer cada tema dentro de la asignatura
    for (const theme in subjectValue) {
      const questions = subjectValue[theme];
      if (!Array.isArray(questions)) {
        errors.push(`El tema "${theme}" de la asignatura "${subject}" debe ser un array de preguntas.`);
        continue;
      }

      // Validar cada pregunta del tema
      questions.forEach((question, index) => {
        if (typeof question !== 'object' || question === null) {
          errors.push(`La pregunta en la posición ${index} del tema "${theme}" de la asignatura "${subject}" debe ser un objeto.`);
          return;
        }

        // Validar que la pregunta tenga una propiedad "name" de tipo string
        if (!question.hasOwnProperty('name') || typeof question.name !== 'string') {
          errors.push(`La pregunta en la posición ${index} del tema "${theme}" de la asignatura "${subject}" debe tener una propiedad "name" de tipo string.`);
        }

        // Validar que la pregunta tenga una propiedad "type" de tipo string
        if (!question.hasOwnProperty('type') || typeof question.type !== 'string') {
          errors.push(`La pregunta en la posición ${index} del tema "${theme}" de la asignatura "${subject}" debe tener una propiedad "type" de tipo string.`);
          return;
        }

        // Validar en función del tipo de pregunta
        if (question.type === 'choice' || question.type === 'multichoice') {
          if (!question.hasOwnProperty('answers') || !Array.isArray(question.answers)) {
            errors.push(`La pregunta "${question.name}" en el tema "${theme}" de la asignatura "${subject}" debe tener un array "answers".`);
          } else {
            question.answers.forEach((answer, answerIndex) => {
              if (typeof answer !== 'object' || answer === null) {
                errors.push(`La respuesta en la posición ${answerIndex} de la pregunta "${question.name}" debe ser un objeto.`);
                return;
              }
              if (!answer.hasOwnProperty('name') || typeof answer.name !== 'string') {
                errors.push(`La respuesta en la posición ${answerIndex} de la pregunta "${question.name}" debe tener una propiedad "name" de tipo string.`);
              }
              if (!answer.hasOwnProperty('correct') || typeof answer.correct !== 'boolean') {
                errors.push(`La respuesta en la posición ${answerIndex} de la pregunta "${question.name}" debe tener una propiedad "correct" de tipo boolean.`);
              }
            });
          }
        } else if (question.type === 'text') {
          if (!question.hasOwnProperty('correctText') || typeof question.correctText !== 'string') {
            errors.push(`La pregunta "${question.name}" de tipo "text" en el tema "${theme}" de la asignatura "${subject}" debe tener una propiedad "correctText" de tipo string.`);
          }
        } else {
          errors.push(`La pregunta "${question.name}" en el tema "${theme}" de la asignatura "${subject}" tiene un "type" desconocido: "${question.type}".`);
        }
      });
    }
  }

  return errors;
}

/**
 * Función para encontrar preguntas duplicadas en el schema.
 * @param {object} data - El JSON parseado del schema.
 * @returns {Array} Array de objetos con información sobre duplicados.
 */
function findDuplicateQuestions(data) {
  const questionMap = new Map();
  const duplicates = [];
  
  // Recorrer todas las preguntas y crear un mapa
  for (const subject in data) {
    for (const theme in data[subject]) {
      const questions = data[subject][theme];
      
      if (Array.isArray(questions)) {
        questions.forEach((question, index) => {
          if (question.name) {
            const normalizedText = normalizeQuestionText(question.name);
            
            if (!questionMap.has(normalizedText)) {
              questionMap.set(normalizedText, []);
            }
            
            questionMap.get(normalizedText).push({
              subject,
              theme,
              index,
              originalText: question.name
            });
          }
        });
      }
    }
  }
  
  // Identificar duplicados
  questionMap.forEach((locations, normalizedText) => {
    if (locations.length > 1) {
      duplicates.push({
        questionText: locations[0].originalText,
        normalizedText,
        locations: locations
      });
    }
  });
  
  return duplicates;
}

/**
 * Función para mostrar estadísticas del schema.
 * @param {object} data - El JSON parseado del schema.
 */
function showStatistics(data) {
  console.log('📊 Estadísticas del schema:');
  console.log('----------------------------');
  
  let totalQuestions = 0;
  let totalSubjects = 0;
  let totalThemes = 0;
  const questionTypes = {};
  
  for (const subject in data) {
    totalSubjects++;
    console.log(`\n📚 ${decodeUnicode(subject)}:`);
    
    let subjectQuestions = 0;
    
    for (const theme in data[subject]) {
      totalThemes++;
      const questions = data[subject][theme];
      
      if (Array.isArray(questions)) {
        const themeQuestionCount = questions.length;
        subjectQuestions += themeQuestionCount;
        totalQuestions += themeQuestionCount;
        
        console.log(`   📌 ${decodeUnicode(theme)}: ${themeQuestionCount} preguntas`);
        
        // Contar tipos de preguntas
        questions.forEach(q => {
          if (q.type) {
            questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
          }
        });
      }
    }
    
    console.log(`   Total en ${decodeUnicode(subject)}: ${subjectQuestions} preguntas`);
  }
  
  console.log('\n----------------------------');
  console.log(`Total de asignaturas: ${totalSubjects}`);
  console.log(`Total de temas: ${totalThemes}`);
  console.log(`Total de preguntas: ${totalQuestions}`);
  
  console.log('\nDistribución por tipo de pregunta:');
  for (const type in questionTypes) {
    console.log(`   - ${type}: ${questionTypes[type]} preguntas`);
  }
}
