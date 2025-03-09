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

- HTML5, CSS3 y JavaScript
- Bootstrap 5 para diseño responsivo
- FontAwesome para iconografía
- jsPDF para generación de documentos PDF

## Instalación

1. Clona este repositorio:
   ```
   git clone https://github.com/jdamiancabello/IA-Questions-test.git
   ```

2. Abre el archivo `index.html` en tu navegador para iniciar la aplicación.

3. La aplicación también está disponible online en: [https://jdamiancabello.github.io/IA-Questions-test/](https://jdamiancabello.github.io/IA-Questions-test/)

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

Si deseas contribuir a este proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu función (`git checkout -b feature/nueva-funcion`)
3. Haz commit de tus cambios (`git commit -m 'Añade nueva función'`)
4. Sube tu rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

**Contribución de preguntas**: Puedes enviar un Pull Request con tu archivo `schema.json` actualizado para añadir nuevas preguntas a la base de datos. Las preguntas serán revisadas antes de ser incorporadas al repositorio principal.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Contacto

Para cualquier consulta relacionada con el proyecto, puedes contactar a través de GitHub.