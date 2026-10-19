import Decimal from 'decimal.js';
import { EXTENDED_CONSTANTS } from './constants.ts';

// Configure Decimal precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 20
});

export const PI = Decimal.acos(-1);
export const E = new Decimal(1).exp();

export interface EvalResult {
  success: boolean;
  value: string;
  error?: string;
}

type TokenType = 'NUMBER' | 'CONST' | 'OP' | 'LPAREN' | 'RPAREN' | 'FUNC' | 'POSTFIX_OP';

interface Token {
  type: TokenType;
  value: string;
}

const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '^': 3,
  'u-': 4, // Unary minus
  '!': 5,  // Factorial
  '%': 5,  // Percentage postfix
  'func': 6
};

const RIGHT_ASSOCIATIVE = new Set(['^', 'u-']);

const KNOWN_FUNCTIONS = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'sqrt', 'log', 'ln'];

/**
 * Tokenizes mathematical infix expressions.
 */
export function tokenize(rawExpr: string): Token[] {
  // Normalize symbols
  let expr = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/√/g, 'sqrt')
    .replace(/,/g, '')
    .trim();

  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number parsing (digits and decimal point)
    if (/\d/.test(ch) || (ch === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let numStr = '';
      while (i < expr.length && (/[\d.]/.test(expr[i]))) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Function parsing: sin, cos, tan, asin, acos, atan, sqrt, log, ln
    let matchedFunc = false;
    for (const fn of KNOWN_FUNCTIONS) {
      if (expr.startsWith(fn, i)) {
        tokens.push({ type: 'FUNC', value: fn });
        i += fn.length;
        matchedFunc = true;
        break;
      }
    }
    if (matchedFunc) continue;

    // Constants matching (π, e, φ, c, h, G, kB, NA, etc.)
    if (ch === 'π' || expr.startsWith('pi', i)) {
      tokens.push({ type: 'CONST', value: PI.toString() });
      i += ch === 'π' ? 1 : 2;
      continue;
    }

    if (ch === 'e' && (i + 1 >= expr.length || !/[a-z]/i.test(expr[i + 1]))) {
      tokens.push({ type: 'CONST', value: E.toString() });
      i++;
      continue;
    }

    let matchedConst = false;
    for (const c of EXTENDED_CONSTANTS) {
      if (c.symbol !== 'π' && c.symbol !== 'e' && expr.startsWith(c.symbol, i)) {
        const nextCharIdx = i + c.symbol.length;
        // Ensure not part of an identifier if alphabetical
        if (nextCharIdx >= expr.length || !/[a-z]/i.test(expr[nextCharIdx])) {
          tokens.push({ type: 'CONST', value: c.value });
          i += c.symbol.length;
          matchedConst = true;
          break;
        }
      }
    }
    if (matchedConst) continue;

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Factorial and Percentage postfix operators
    if (ch === '!' || ch === '%') {
      tokens.push({ type: 'POSTFIX_OP', value: ch });
      i++;
      continue;
    }

    // Standard Operators
    if (['+', '-', '*', '/', '^'].includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: '${ch}'`);
  }

  // Insert implicit multiplication and distinguish unary minus
  const processed: Token[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const cur = tokens[k];
    const prev = k > 0 ? tokens[k - 1] : null;

    // Check for implicit multiplication:
    // NUMBER / CONST / RPAREN / POSTFIX_OP followed by LPAREN / FUNC / CONST / NUMBER
    if (prev) {
      const prevCanMultiply = prev.type === 'NUMBER' || prev.type === 'CONST' || prev.type === 'RPAREN' || prev.type === 'POSTFIX_OP';
      const curCanMultiply = cur.type === 'LPAREN' || cur.type === 'FUNC' || cur.type === 'CONST' ||
        (cur.type === 'NUMBER' && (prev.type === 'RPAREN' || prev.type === 'CONST'));
      if (prevCanMultiply && curCanMultiply) {
        processed.push({ type: 'OP', value: '*' });
      }
    }

    // Check for unary minus:
    // '-' at the beginning, or after an operator or LPAREN
    if (cur.type === 'OP' && cur.value === '-') {
      if (!prev || prev.type === 'OP' || prev.type === 'LPAREN') {
        processed.push({ type: 'OP', value: 'u-' });
        continue;
      }
    }

    processed.push(cur);
  }

  return processed;
}

/**
 * Converts infix tokens to postfix (RPN) using Dijkstra's Shunting-yard algorithm.
 */
export function infixToRPN(tokens: Token[]): Token[] {
  const outputQueue: Token[] = [];
  const opStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'NUMBER' || token.type === 'CONST') {
      outputQueue.push(token);
    } else if (token.type === 'POSTFIX_OP') {
      // Factorial operates immediately on preceding operand in RPN
      outputQueue.push(token);
    } else if (token.type === 'FUNC') {
      opStack.push(token);
    } else if (token.type === 'OP') {
      const o1 = token.value;
      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'LPAREN') break;

        const o2 = top.value;
        const p1 = PRECEDENCE[o1] || 0;
        const p2 = top.type === 'FUNC' ? PRECEDENCE['func'] : PRECEDENCE[o2] || 0;

        const isRightAssoc = RIGHT_ASSOCIATIVE.has(o1);
        if ((!isRightAssoc && p1 <= p2) || (isRightAssoc && p1 < p2)) {
          outputQueue.push(opStack.pop()!);
        } else {
          break;
        }
      }
      opStack.push(token);
    } else if (token.type === 'LPAREN') {
      opStack.push(token);
    } else if (token.type === 'RPAREN') {
      let foundMatchingLparen = false;
      while (opStack.length > 0) {
        const top = opStack.pop()!;
        if (top.type === 'LPAREN') {
          foundMatchingLparen = true;
          break;
        }
        outputQueue.push(top);
      }
      if (!foundMatchingLparen) {
        throw new Error('Mismatched parentheses: missing opening parenthesis');
      }
      // If function is on top of stack, pop it to output
      if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNC') {
        outputQueue.push(opStack.pop()!);
      }
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.type === 'LPAREN' || top.type === 'RPAREN') {
      throw new Error('Mismatched parentheses: unmatched parenthesis in expression');
    }
    outputQueue.push(top);
  }

  return outputQueue;
}

function calculateFactorial(d: Decimal): Decimal {
  if (!d.isInteger() || d.isNegative()) {
    throw new Error('Factorial is only defined for non-negative integers');
  }
  const n = d.toNumber();
  if (n > 170) throw new Error('Factorial overflow (max 170)');
  if (n === 0 || n === 1) return new Decimal(1);

  let res = new Decimal(1);
  for (let k = 2; k <= n; k++) {
    res = res.times(k);
  }
  return res;
}

/**
 * Evaluates a Postfix (RPN) queue using Decimal.js.
 */
export function evaluateRPN(rpnQueue: Token[], angleMode: 'DEG' | 'RAD' = 'DEG'): Decimal {
  const stack: Decimal[] = [];

  for (let idx = 0; idx < rpnQueue.length; idx++) {
    const token = rpnQueue[idx];
    if (token.type === 'NUMBER' || token.type === 'CONST') {
      stack.push(new Decimal(token.value));
    } else if (token.type === 'POSTFIX_OP') {
      if (token.value === '!') {
        if (stack.length < 1) throw new Error('Missing operand for factorial');
        const a = stack.pop()!;
        stack.push(calculateFactorial(a));
      } else if (token.value === '%') {
        if (stack.length < 1) throw new Error('Missing operand for percentage');
        const a = stack.pop()!;
        // If next token in RPN is an addition or subtraction, scale relative to the base operand
        const nextToken = idx + 1 < rpnQueue.length ? rpnQueue[idx + 1] : null;
        if (nextToken && nextToken.type === 'OP' && (nextToken.value === '+' || nextToken.value === '-') && stack.length >= 1) {
          const base = stack[stack.length - 1];
          stack.push(base.times(a).dividedBy(100));
        } else {
          stack.push(a.dividedBy(100));
        }
      }
    } else if (token.type === 'FUNC') {
      if (stack.length < 1) throw new Error(`Missing operand for function '${token.value}'`);
      const a = stack.pop()!;

      switch (token.value) {
        case 'sqrt':
          if (a.isNegative()) throw new Error('Invalid input: square root of negative number');
          stack.push(a.squareRoot());
          break;
        case 'ln':
          if (a.lessThanOrEqualTo(0)) throw new Error('Invalid input: ln of non-positive number');
          stack.push(a.ln());
          break;
        case 'log':
          if (a.lessThanOrEqualTo(0)) throw new Error('Invalid input: log of non-positive number');
          stack.push(a.log(10));
          break;
        case 'sin': {
          const rad = angleMode === 'DEG' ? a.times(PI).dividedBy(180) : a;
          stack.push(rad.sin());
          break;
        }
        case 'cos': {
          const rad = angleMode === 'DEG' ? a.times(PI).dividedBy(180) : a;
          stack.push(rad.cos());
          break;
        }
        case 'tan': {
          const rad = angleMode === 'DEG' ? a.times(PI).dividedBy(180) : a;
          stack.push(rad.tan());
          break;
        }
        case 'asin': {
          if (a.lessThan(-1) || a.greaterThan(1)) throw new Error('Invalid input: asin domain is [-1, 1]');
          const rad = a.asin();
          stack.push(angleMode === 'DEG' ? rad.times(180).dividedBy(PI) : rad);
          break;
        }
        case 'acos': {
          if (a.lessThan(-1) || a.greaterThan(1)) throw new Error('Invalid input: acos domain is [-1, 1]');
          const rad = a.acos();
          stack.push(angleMode === 'DEG' ? rad.times(180).dividedBy(PI) : rad);
          break;
        }
        case 'atan': {
          const rad = a.atan();
          stack.push(angleMode === 'DEG' ? rad.times(180).dividedBy(PI) : rad);
          break;
        }
        default:
          throw new Error(`Unsupported function: ${token.value}`);
      }
    } else if (token.type === 'OP') {
      if (token.value === 'u-') {
        if (stack.length < 1) throw new Error('Missing operand for negation');
        const a = stack.pop()!;
        stack.push(a.negated());
        continue;
      }

      if (stack.length < 2) throw new Error(`Missing operands for operator '${token.value}'`);
      const b = stack.pop()!;
      const a = stack.pop()!;

      switch (token.value) {
        case '+':
          stack.push(a.plus(b));
          break;
        case '-':
          stack.push(a.minus(b));
          break;
        case '*':
          stack.push(a.times(b));
          break;
        case '/':
          if (b.isZero()) throw new Error('Cannot divide by zero');
          stack.push(a.dividedBy(b));
          break;
        case '^':
          stack.push(a.pow(b));
          break;
        default:
          throw new Error(`Unsupported operator: ${token.value}`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Malformed expression');
  }

  return stack[0];
}

/**
 * End-to-end evaluation of mathematical expression string.
 */
export function evaluateExpression(expr: string, angleMode: 'DEG' | 'RAD' = 'DEG'): EvalResult {
  try {
    const trimmed = expr.trim();
    if (!trimmed) {
      return { success: true, value: '0' };
    }
    const tokens = tokenize(trimmed);
    const rpn = infixToRPN(tokens);
    const result = evaluateRPN(rpn, angleMode);

    // Round clean zeroes or near precision limits (e.g. sin(180) -> 0)
    let finalStr = result.toFixed(14).replace(/\.?0+$/, '');
    if (finalStr === '-0') finalStr = '0';
    if (finalStr === '') finalStr = result.toString();

    return { success: true, value: finalStr };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Calculation error';
    return { success: false, value: '0', error: msg };
  }
}
