/**
 * Tests for utils.js
 * @fileoverview Unit tests for shared utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    decodeUnicode,
    shuffleArray,
    debounce,
    getQuestionsStats,
    formatPercentage
} from '../js/utils.js';

describe('decodeUnicode', () => {
    it('should decode Unicode escape sequences', () => {
        expect(decodeUnicode('Espa\\u00f1a')).toBe('España');
        expect(decodeUnicode('Caf\\u00e9')).toBe('Café');
    });

    it('should handle strings without Unicode sequences', () => {
        expect(decodeUnicode('Hello World')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
        expect(decodeUnicode('')).toBe('');
    });

    it('should decode multiple Unicode sequences', () => {
        expect(decodeUnicode('\\u00a1Hola! \\u00bfC\\u00f3mo est\\u00e1s?'))
            .toBe('¡Hola! ¿Cómo estás?');
    });
});

describe('shuffleArray', () => {
    it('should return an array with the same length', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffleArray(input);
        expect(result).toHaveLength(input.length);
    });

    it('should contain all original elements', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffleArray(input);
        expect(result.sort()).toEqual(input.sort());
    });

    it('should not modify the original array', () => {
        const input = [1, 2, 3, 4, 5];
        const original = [...input];
        shuffleArray(input);
        expect(input).toEqual(original);
    });

    it('should handle empty arrays', () => {
        const result = shuffleArray([]);
        expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
        const result = shuffleArray([42]);
        expect(result).toEqual([42]);
    });
});

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('should debounce function calls', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn();
        debouncedFn();
        debouncedFn();

        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn('arg1', 'arg2');

        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should reset timer on subsequent calls', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn();
        vi.advanceTimersByTime(50);
        debouncedFn();
        vi.advanceTimersByTime(50);

        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);

        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('getQuestionsStats', () => {
    it('should return correct statistics for mixed question types', () => {
        const questions = [
            { type: 'choice', answers: [{ correct: true }, { correct: false }] },
            { type: 'choice', answers: [{ correct: false }, { correct: false }] },
            { type: 'multichoice', answers: [{ correct: true }] },
            { type: 'text', correctText: 'answer' }
        ];

        const stats = getQuestionsStats(questions);

        expect(stats.total).toBe(4);
        expect(stats.byType).toEqual({
            choice: 2,
            multichoice: 1,
            text: 1
        });
        expect(stats.hasCorrect).toBe(2);
        expect(stats.hasIncorrect).toBe(1);
    });

    it('should handle empty array', () => {
        const stats = getQuestionsStats([]);

        expect(stats.total).toBe(0);
        expect(stats.byType).toEqual({});
        expect(stats.hasCorrect).toBe(0);
        expect(stats.hasIncorrect).toBe(0);
    });

    it('should count questions by type correctly', () => {
        const questions = [
            { type: 'choice', answers: [] },
            { type: 'choice', answers: [] },
            { type: 'multichoice', answers: [] },
            { type: 'text' }
        ];

        const stats = getQuestionsStats(questions);

        expect(stats.byType.choice).toBe(2);
        expect(stats.byType.multichoice).toBe(1);
        expect(stats.byType.text).toBe(1);
    });
});

describe('formatPercentage', () => {
    it('should format decimal values as percentages', () => {
        expect(formatPercentage(0.5)).toBe('50.0%');
        expect(formatPercentage(0.856)).toBe('85.6%');
        expect(formatPercentage(1)).toBe('100.0%');
    });

    it('should handle direct percentage values', () => {
        expect(formatPercentage(50, 1, false)).toBe('50.0%');
        expect(formatPercentage(85.6, 1, false)).toBe('85.6%');
    });

    it('should respect decimal places', () => {
        expect(formatPercentage(0.12345, 0)).toBe('12%');
        expect(formatPercentage(0.12345, 2)).toBe('12.35%');
        expect(formatPercentage(0.12345, 3)).toBe('12.345%');
    });

    it('should handle edge cases', () => {
        expect(formatPercentage(0)).toBe('0.0%');
        expect(formatPercentage(0, 0)).toBe('0%');
    });
});
