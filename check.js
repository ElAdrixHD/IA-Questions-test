// validateSchema.js

const fs = require('fs');
const filePath = 'schema.json';

// Leer el fichero schema.json
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error leyendo el fichero ${filePath}:`, err);
    process.exit(1);
  }

  try {
    const jsonData = JSON.parse(data);
    console.log('JSON cargado correctamente.');
    
    // Validar la estructura del JSON
    const errors = validateSchema(jsonData);
    
    if (errors.length > 0) {
      console.error('Se encontraron errores en el esquema:');
      errors.forEach(error => console.error('- ' + error));
      process.exit(1);
    } else {
      console.log('El esquema es válido.');
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
