// Pure calculator logic — easy to reason about and (later) test.

export type Operator = "+" | "-" | "*" | "/" | null;

export const OPERATOR_GLYPH: Record<NonNullable<Operator>, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

export interface CalcState {
  /** Large bottom display — current value being entered, or computed result. */
  display: string;
  /** Small grey line above the display — the literal expression the user typed. */
  expression: string;
  previousValue: number | null;
  operator: Operator;
  waitingForOperand: boolean;
  /** True immediately after `=` — next operator continues from the result. */
  justEvaluated: boolean;
}

export const initialState: CalcState = {
  display: "0",
  expression: "",
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  justEvaluated: false,
};

function toNumber(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function inputDigit(state: CalcState, digit: string): CalcState {
  const { display, expression, waitingForOperand, justEvaluated } = state;

  // After `=`, typing a digit starts a brand-new calculation.
  if (justEvaluated) {
    return {
      ...state,
      display: digit,
      expression: digit,
      previousValue: null,
      operator: null,
      waitingForOperand: false,
      justEvaluated: false,
    };
  }

  if (waitingForOperand) {
    return {
      ...state,
      display: digit,
      expression: `${expression} ${digit}`,
      waitingForOperand: false,
    };
  }

  if (display === "0") {
    return {
      ...state,
      display: digit,
      expression: expression === "" ? digit : expression.slice(0, -1) + digit,
    };
  }

  if (display.replace(/[-.]/g, "").length >= 16) return state;

  return {
    ...state,
    display: display + digit,
    expression: expression + digit,
  };
}

export function inputDecimal(state: CalcState): CalcState {
  const { display, expression, waitingForOperand, justEvaluated } = state;

  if (justEvaluated) {
    return {
      ...state,
      display: "0.",
      expression: "0.",
      previousValue: null,
      operator: null,
      waitingForOperand: false,
      justEvaluated: false,
    };
  }

  if (waitingForOperand) {
    return {
      ...state,
      display: "0.",
      expression: `${expression} 0.`,
      waitingForOperand: false,
    };
  }

  if (!display.includes(".")) {
    return {
      ...state,
      display: display + ".",
      expression: expression + ".",
    };
  }

  return state;
}

function apply(a: number, b: number, op: NonNullable<Operator>): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
  }
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  const str = parseFloat(value.toPrecision(12)).toString();
  return str.length > 16 ? value.toExponential(8) : str;
}

export function setOperator(state: CalcState, next: NonNullable<Operator>): CalcState {
  const { display, expression, previousValue, operator, waitingForOperand, justEvaluated } =
    state;
  const glyph = OPERATOR_GLYPH[next];
  const current = toNumber(display);

  // After `=`, pressing an operator continues the calculation from the result.
  if (justEvaluated) {
    return {
      ...state,
      expression: `${display} ${glyph}`,
      previousValue: current,
      operator: next,
      waitingForOperand: true,
      justEvaluated: false,
    };
  }

  // Chained operator: compute pending op first, then replace the operator glyph.
  if (operator && !waitingForOperand && previousValue !== null) {
    const result = apply(previousValue, current, operator);
    const resultStr = formatResult(result);
    return {
      display: resultStr,
      expression: `${resultStr} ${glyph}`,
      previousValue: result,
      operator: next,
      waitingForOperand: true,
      justEvaluated: false,
    };
  }

  return {
    ...state,
    expression: `${expression} ${glyph}`.trimStart(),
    previousValue: current,
    operator: next,
    waitingForOperand: true,
    justEvaluated: false,
  };
}

export function equals(state: CalcState): CalcState {
  if (state.operator === null || state.previousValue === null) return state;
  const current = toNumber(state.display);
  const result = apply(state.previousValue, current, state.operator);
  const resultStr = formatResult(result);
  return {
    display: resultStr,
    expression: state.expression,
    previousValue: null,
    operator: null,
    waitingForOperand: false,
    justEvaluated: true,
  };
}

export function clearAll(): CalcState {
  return { ...initialState };
}

export function toggleSign(state: CalcState): CalcState {
  if (state.display === "0" || state.display === "Error") return state;
  const flipped = state.display.startsWith("-")
    ? state.display.slice(1)
    : `-${state.display}`;
  // Mirror the sign flip into the expression's trailing number.
  const expression = mirrorSignInExpression(state.expression, flipped);
  return { ...state, display: flipped, expression };
}

function mirrorSignInExpression(expression: string, newDisplay: string): string {
  // Replace the trailing numeric token (e.g. "2 * -3" -> "2 * -3" or "2 * 3" -> "2 * 3").
  const match = expression.match(/(-?\d*\.?\d+)$/);
  if (!match || match.index === undefined) return expression;
  return expression.slice(0, match.index) + newDisplay;
}

export function percent(state: CalcState): CalcState {
  const value = toNumber(state.display) / 100;
  const resultStr = formatResult(value);
  const expression = mirrorSignInExpression(state.expression, resultStr);
  return { ...state, display: resultStr, expression };
}

export function backspace(state: CalcState): CalcState {
  if (state.justEvaluated) return state;
  if (state.waitingForOperand) {
    // Last token in expression is an operator like " + " — drop it (3 chars).
    const expr = state.expression.replace(/\s[+\u2212\u00D7\u00F7]\s?$/, "");
    return {
      ...state,
      expression: expr,
      operator: null,
      previousValue: null,
      waitingForOperand: false,
    };
  }
  if (state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith("-"))) {
    return {
      ...state,
      display: "0",
      expression: state.expression.length > 1 ? state.expression.slice(0, -1) : "",
    };
  }
  return {
    ...state,
    display: state.display.slice(0, -1),
    expression: state.expression.slice(0, -1),
  };
}