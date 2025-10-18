# Guía de Contribución - IA Questions Test

¡Gracias por tu interés en contribuir a IA Questions Test! Este documento proporciona guías y mejores prácticas para contribuir al proyecto.

## Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Puedo Contribuir](#cómo-puedo-contribuir)
- [Guías de Estilo](#guías-de-estilo)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Estructura del Proyecto](#estructura-del-proyecto)

## Código de Conducta

Este proyecto se adhiere a estándares profesionales de respeto y colaboración. Al participar, te comprometes a mantener un ambiente acogedor y constructivo para todos.

## Cómo Puedo Contribuir

### Reportar Bugs

Antes de crear un issue de bug:
1. Verifica que no exista ya un issue similar
2. Verifica que estás usando la última versión
3. Recopila información sobre tu entorno (navegador, SO, etc.)

Al reportar un bug, incluye:
- **Descripción clara**: ¿Qué esperabas que pasara y qué pasó?
- **Pasos para reproducir**: Enumera los pasos específicos
- **Capturas de pantalla**: Si es aplicable
- **Información del entorno**: Navegador, versión, sistema operativo
- **Console logs**: Errores de JavaScript si los hay

### Sugerir Mejoras

Para sugerir una mejora o nueva funcionalidad:
1. Abre un issue con el tag `enhancement`
2. Describe claramente la mejora propuesta
3. Explica por qué sería útil para el proyecto
4. Si es posible, proporciona ejemplos de implementación

### Añadir Preguntas al Schema

Para contribuir con nuevas preguntas de examen:

1. **Ubicación**: Las preguntas se almacenan en `data/schema.json`

2. **Formato**: Sigue la estructura existente:
   ```json
   {
     "Asignatura": {
       "Tema": [
         {
           "name": "¿Texto de la pregunta?",
           "type": "choice|multichoice|text",
           "answers": [
             { "name": "Respuesta 1", "correct": true },
             { "name": "Respuesta 2", "correct": false }
           ]
         }
       ]
     }
   }
   ```

3. **Tipos de Preguntas**:
   - `choice`: Selección única (radio buttons)
   - `multichoice`: Selección múltiple (checkboxes)
   - `text`: Respuesta de texto libre

4. **Validación**: Antes de hacer commit:
   ```bash
   npm run validate
   ```

5. **Calidad**: Asegúrate de que:
   - La pregunta está bien redactada
   - Las respuestas son claras y precisas
   - La respuesta correcta está marcada adecuadamente
   - No hay preguntas duplicadas

### Contribuir con Código

Para contribuir mejoras al código:

1. **Fork** el repositorio
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/mi-mejora
   ```
3. **Haz tus cambios** siguiendo las guías de estilo
4. **Escribe tests** si añades nueva funcionalidad
5. **Ejecuta los tests**:
   ```bash
   npm test
   ```
6. **Commit** tus cambios:
   ```bash
   git commit -m "feat: descripción de la mejora"
   ```
7. **Push** a tu fork:
   ```bash
   git push origin feature/mi-mejora
   ```
8. **Abre un Pull Request**

## Guías de Estilo

### JavaScript

- **ES6+**: Usa características modernas de JavaScript
- **Vanilla JS**: No uses frameworks (React, Vue, etc.)
- **Funciones puras**: Prefiere funciones sin side effects cuando sea posible
- **Nombres descriptivos**: Usa nombres claros y descriptivos
- **JSDoc**: Documenta funciones públicas

#### Ejemplo de Función Bien Documentada

```javascript
/**
 * Baraja un array usando el algoritmo Fisher-Yates
 * @param {Array} array - Array a barajar
 * @returns {Array} Nuevo array con elementos barajados
 * @example
 * shuffleArray([1, 2, 3, 4, 5]) // returns [3, 1, 5, 2, 4]
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
```

### Mensajes de Commit

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan lógica)
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Tareas de mantenimiento

Ejemplos:
```
feat: agregar exportación a CSV
fix: corregir validación de preguntas duplicadas
docs: actualizar README con nueva estructura
refactor: extraer función de renderizado a utils
test: añadir tests para shuffleArray
```

### HTML/CSS

- **Semántico**: Usa HTML semántico
- **Responsive**: Bootstrap 5 para diseño responsive
- **Accesibilidad**: Usa ARIA labels cuando sea apropiado
- **BEM**: Considera usar metodología BEM para clases CSS

### Testing

- **Vitest**: Usa Vitest para tests unitarios
- **Coverage**: Apunta a >70% de cobertura en funciones utils
- **Descriptivo**: Tests deben ser autodocumentados

```javascript
describe('shuffleArray', () => {
    it('should return an array with the same length', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffleArray(input);
        expect(result).toHaveLength(input.length);
    });
});
```

## Proceso de Pull Request

### Antes de Enviar

1. ✅ Tests pasan: `npm test`
2. ✅ Schema válido (si modificaste): `npm run validate`
3. ✅ Sin errores de consola
4. ✅ Probado en múltiples navegadores (Chrome, Firefox, Safari)
5. ✅ Código documentado con JSDoc

### Checklist del PR

- [ ] Título descriptivo
- [ ] Descripción clara de cambios
- [ ] Screenshots si hay cambios visuales
- [ ] Tests incluidos para nueva funcionalidad
- [ ] Documentación actualizada si es necesario
- [ ] Sin conflictos con `main`

### Revisión

- El mantener del proyecto revisará tu PR
- Puede solicitar cambios
- Una vez aprobado, será merged a `main`
- Las contribuciones significativas serán reconocidas

## Estructura del Proyecto

### Directorios Principales

```
├── js/               # Código JavaScript
│   ├── utils.js     # Funciones compartidas
│   ├── quiz.js      # Lógica del quiz
│   ├── scrapper.js  # Extractor de preguntas
│   └── validator.js # Validador de schema
├── css/              # Estilos
├── data/             # Datos (schema.json)
└── tests/            # Tests unitarios
```

### Archivos Importantes

- `js/utils.js`: Funciones compartidas entre módulos
- `data/schema.json`: Base de datos de preguntas
- `js/validator.js`: Validador del schema
- `tests/*.test.js`: Tests unitarios

## Recursos Adicionales

- [Issues](https://github.com/jdamiancabello/IA-Questions-test/issues)
- [Pull Requests](https://github.com/jdamiancabello/IA-Questions-test/pulls)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Vitest Documentation](https://vitest.dev/)

## Contacto

Para preguntas o dudas:
- Abre un issue con la etiqueta `question`
- Contacta a los mantenedores a través de GitHub

---

¡Gracias por contribuir a IA Questions Test! 🎓✨
