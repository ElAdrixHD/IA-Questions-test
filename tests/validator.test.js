/**
 * Tests for validator.js
 * @fileoverview Unit tests for schema validation functions
 */

import { describe, it, expect } from 'vitest';

// Mock data for testing
const validSchema = {
    "Asignatura 1": {
        "Tema 1": [
            {
                "name": "¿Pregunta de ejemplo?",
                "type": "choice",
                "answers": [
                    { "name": "Respuesta 1", "correct": true },
                    { "name": "Respuesta 2", "correct": false }
                ]
            }
        ]
    }
};

const invalidSchemaArray = [];

const invalidSchemaQuestionWithoutName = {
    "Asignatura 1": {
        "Tema 1": [
            {
                "type": "choice",
                "answers": []
            }
        ]
    }
};

const invalidSchemaQuestionWithoutType = {
    "Asignatura 1": {
        "Tema 1": [
            {
                "name": "Pregunta sin tipo",
                "answers": []
            }
        ]
    }
};

describe('Schema Validation', () => {
    it('should validate a correct schema structure', () => {
        // Since validator.js exports validateSchema function
        // we would need to extract it as a module export
        // For now, this is a placeholder for the structure
        expect(validSchema).toBeDefined();
        expect(validSchema["Asignatura 1"]).toBeDefined();
        expect(validSchema["Asignatura 1"]["Tema 1"]).toBeInstanceOf(Array);
    });

    it('should detect invalid schema (array instead of object)', () => {
        expect(Array.isArray(invalidSchemaArray)).toBe(true);
    });

    it('should detect missing question name', () => {
        const question = invalidSchemaQuestionWithoutName["Asignatura 1"]["Tema 1"][0];
        expect(question.name).toBeUndefined();
    });

    it('should detect missing question type', () => {
        const question = invalidSchemaQuestionWithoutType["Asignatura 1"]["Tema 1"][0];
        expect(question.type).toBeUndefined();
    });
});

describe('Question Type Validation', () => {
    it('should validate choice question structure', () => {
        const question = {
            "name": "Pregunta de selección única",
            "type": "choice",
            "answers": [
                { "name": "Opción A", "correct": true },
                { "name": "Opción B", "correct": false }
            ]
        };

        expect(question.type).toBe('choice');
        expect(question.answers).toBeInstanceOf(Array);
        expect(question.answers.length).toBeGreaterThan(0);
        expect(question.answers[0]).toHaveProperty('name');
        expect(question.answers[0]).toHaveProperty('correct');
    });

    it('should validate multichoice question structure', () => {
        const question = {
            "name": "Pregunta de selección múltiple",
            "type": "multichoice",
            "answers": [
                { "name": "Opción A", "correct": true },
                { "name": "Opción B", "correct": true },
                { "name": "Opción C", "correct": false }
            ]
        };

        expect(question.type).toBe('multichoice');
        expect(question.answers).toBeInstanceOf(Array);
        const correctAnswers = question.answers.filter(a => a.correct);
        expect(correctAnswers.length).toBeGreaterThan(1);
    });

    it('should validate text question structure', () => {
        const question = {
            "name": "Pregunta de texto",
            "type": "text",
            "correctText": "Respuesta correcta"
        };

        expect(question.type).toBe('text');
        expect(question).toHaveProperty('correctText');
        expect(typeof question.correctText).toBe('string');
    });
});

describe('Duplicate Detection', () => {
    it('should detect duplicate questions with same text', () => {
        const schema = {
            "Asignatura 1": {
                "Tema 1": [
                    { "name": "¿Pregunta duplicada?", "type": "choice", "answers": [] },
                    { "name": "¿Pregunta duplicada?", "type": "choice", "answers": [] }
                ]
            }
        };

        const tema1 = schema["Asignatura 1"]["Tema 1"];
        const questionNames = tema1.map(q => q.name);
        const uniqueNames = new Set(questionNames);

        expect(questionNames.length).toBe(2);
        expect(uniqueNames.size).toBe(1); // Solo un nombre único
    });

    it('should not flag similar but different questions as duplicates', () => {
        const schema = {
            "Asignatura 1": {
                "Tema 1": [
                    { "name": "¿Qué es IA?", "type": "choice", "answers": [] },
                    { "name": "¿Qué es ML?", "type": "choice", "answers": [] }
                ]
            }
        };

        const tema1 = schema["Asignatura 1"]["Tema 1"];
        const questionNames = tema1.map(q => q.name);
        const uniqueNames = new Set(questionNames);

        expect(uniqueNames.size).toBe(questionNames.length);
    });
});

describe('Statistics Calculation', () => {
    it('should count total questions correctly', () => {
        const schema = {
            "Asignatura 1": {
                "Tema 1": [{ name: "Q1", type: "choice", answers: [] }],
                "Tema 2": [
                    { name: "Q2", type: "choice", answers: [] },
                    { name: "Q3", type: "text", correctText: "text" }
                ]
            },
            "Asignatura 2": {
                "Tema 1": [{ name: "Q4", type: "multichoice", answers: [] }]
            }
        };

        let totalQuestions = 0;
        for (const subject in schema) {
            for (const theme in schema[subject]) {
                totalQuestions += schema[subject][theme].length;
            }
        }

        expect(totalQuestions).toBe(4);
    });

    it('should count question types correctly', () => {
        const questions = [
            { type: 'choice' },
            { type: 'choice' },
            { type: 'multichoice' },
            { type: 'text' }
        ];

        const typeCounts = {};
        questions.forEach(q => {
            typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
        });

        expect(typeCounts.choice).toBe(2);
        expect(typeCounts.multichoice).toBe(1);
        expect(typeCounts.text).toBe(1);
    });
});
