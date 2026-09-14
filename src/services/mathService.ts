import { MathProblem } from '../types';

export function generateMathProblem(excludeIds: string[] = []): MathProblem {
  const operators: ('+' | '−' | '×')[] = ['+', '−', '×'];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  if (operator === '+') {
    // Addition: e.g. 17 + 28 = 45 or 24 + 39 = 63
    num1 = Math.floor(Math.random() * 45) + 12;
    num2 = Math.floor(Math.random() * 45) + 12;
    answer = num1 + num2;
  } else if (operator === '−') {
    // Subtraction: e.g. 63 - 19 = 44
    num1 = Math.floor(Math.random() * 50) + 30;
    num2 = Math.floor(Math.random() * (num1 - 10)) + 11;
    answer = num1 - num2;
  } else {
    // Multiplication: e.g. 8 × 7 = 56 or 6 × 9 = 54
    num1 = Math.floor(Math.random() * 8) + 3; // 3 to 10
    num2 = Math.floor(Math.random() * 9) + 4; // 4 to 12
    answer = num1 * num2;
  }

  const id = `${num1}_${operator}_${num2}_${Date.now()}`;
  if (excludeIds.includes(id)) {
    return generateMathProblem(excludeIds);
  }

  return {
    id,
    num1,
    num2,
    operator,
    answer,
    equation: `${num1} ${operator} ${num2}`,
  };
}
