# IA Questions Test

Aplicación web para la generación y gestión de preguntas de examen del Curso de Especialización en Inteligencia Artificial y Big Data.

## Descripción

IA Questions Test es una herramienta educativa diseñada para ayudar a estudiantes a prepararse para los exámenes del Curso de Especialización en Inteligencia Artificial y Big Data. La aplicación permite:

- Generar tests de práctica personalizados
- Extraer preguntas de exámenes anteriores
- Organizar preguntas por módulos y temas
- Evaluar respuestas automáticamente
- Exportar cuestionarios a PDF

## Módulos del curso

El Curso de Especialización en Inteligencia Artificial y Big Data incluye los siguientes módulos:

| Código | Módulo | Horas Semanales | Horas Totales |
|--------|--------|-----------------|---------------|
| 5075 | Big Data aplicado | 4 | 120 |
| 5071 | Modelos de Inteligencia Artificial | 3 | 90 |
| 5073 | Programación de Inteligencia Artificial | 7 | 210 |
| 5072 | Sistemas de aprendizaje automático | 3 | 90 |
| 5074 | Sistemas de Big Data | 3 | 90 |

## Características de la aplicación

- **Generador de Tests**: Crea cuestionarios personalizados seleccionando temas específicos
- **Extractor de Preguntas**: Permite importar preguntas desde código HTML de exámenes anteriores
- **Gestión de Respuestas**: Soporta preguntas de opción única, múltiple y texto libre
- **Evaluación Automática**: Califica automáticamente las respuestas y proporciona retroalimentación
- **Exportación a PDF**: Permite exportar preguntas para estudio offline
- **Diseño Responsivo**: Funciona en dispositivos móviles y de escritorio

## Tecnologías utilizadas

- HTML5, CSS3 y JavaScript (Vanilla ES6+)
- Bootstrap 5 para diseño responsivo
- FontAwesome para iconografía
- jsPDF para generación de documentos PDF
- Vitest para testing unitario

## Estructura del Proyecto

```
IA-Questions-test/
├── index.html                 # Página principal del generador de tests
├── scrapper.html             # Extractor de preguntas
├── js/                       # Scripts JavaScript
│   ├── utils.js             # Funciones compartidas (utils, helpers)
│   ├── quiz.js              # Lógica del generador de tests
│   ├── scrapper.js          # Lógica del extractor de preguntas
│   └── validator.js         # Validador de schema.json
├── css/                      # Hojas de estilo
│   ├── styles.css           # Estilos del quiz
│   └── scrapper_styles.css  # Estilos del scrapper
├── data/                     # Datos de la aplicación
│   └── schema.json          # Base de datos de preguntas (842KB)
├── tests/                    # Tests unitarios
│   ├── utils.test.js        # Tests de funciones utilitarias
│   └── validator.test.js    # Tests del validador
├── package.json              # Dependencias y scripts npm
├── vitest.config.js         # Configuración de Vitest
└── README.md                 # Este archivo
```

## Instalación y Uso

### Uso Directo (Sin Instalación)

1. Clona este repositorio:
   ```bash
   git clone https://github.com/jdamiancabello/IA-Questions-test.git
   cd IA-Questions-test
   ```

2. Abre el archivo `index.html` en tu navegador para iniciar la aplicación.

3. O accede a la versión online: [https://jdamiancabello.github.io/IA-Questions-test/](https://jdamiancabello.github.io/IA-Questions-test/)

### Desarrollo y Testing

Para desarrollo con testing y validación:

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Ejecuta los tests:
   ```bash
   npm test                    # Ejecutar todos los tests
   npm run test:watch          # Ejecutar tests en modo watch
   npm run test:coverage       # Ejecutar tests con coverage
   ```

3. Valida el schema.json:
   ```bash
   npm run validate
   ```

4. Inicia un servidor de desarrollo local:
   ```bash
   npm run dev
   ```

## Uso

### Generación de tests
1. Selecciona una asignatura del menú desplegable
2. Marca los temas que deseas incluir en el test
3. Especifica el número de preguntas
4. Haz clic en "Iniciar Quiz"
5. Responde a las preguntas y utiliza el botón "Corregir respuestas" para ver los resultados

### Extracción de preguntas
1. Navega a la sección "Extractor de Preguntas"
2. Selecciona la asignatura y tema donde guardar las preguntas
3. Pega el código HTML de las preguntas en el área de texto
4. Haz clic en "Procesar HTML"
5. Revisa y ajusta las preguntas extraídas
6. Guarda las preguntas en el schema.json

## Contribución

¡Contribuciones son bienvenidas! Por favor lee [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviar pull requests.

### Formas de Contribuir

1. **Reportar Bugs**: Abre un issue describiendo el problema
2. **Sugerir Mejoras**: Propón nuevas características o mejoras
3. **Añadir Preguntas**: Contribuye con nuevas preguntas al `data/schema.json`
4. **Mejorar Código**: Refactoriza, optimiza o añade tests
5. **Mejorar Documentación**: Actualiza o amplía la documentación

### Proceso de Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu función (`git checkout -b feature/nueva-funcion`)
3. Ejecuta los tests: `npm test`
4. Valida el schema si añades preguntas: `npm run validate`
5. Haz commit de tus cambios (`git commit -m 'feat: añade nueva función'`)
6. Sube tu rama (`git push origin feature/nueva-funcion`)
7. Abre un Pull Request

### Estándares de Código

- Usa JavaScript ES6+ vanilla (sin frameworks)
- Documenta funciones con JSDoc
- Escribe tests para nuevas funciones utilitarias
- Mantén compatibilidad con GitHub Pages (sin build requerido)
- Sigue las convenciones de código existentes

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Contacto

Para cualquier consulta relacionada con el proyecto, puedes contactar a través de GitHub.