// Pure calculator logic — easy to reason about and (later) test.

export type Operator = "+" | "-" | "*" | "/" | null;

export interface CalcState {
  display: string;
  previousValue: number | null;
  operator: Operator;
  waitingForOperand: boolean;
}

export const initialState: CalcState = {
  display: "0",
  previousValue: null,
  operator: null,
  waitingForOperand: false,
};

function toNumber(value: string): number {
  // Allow entries like "12.5"; reject anything else by falling back to 0.
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function inputDigit(state: CalcState, digit: string): CalcState {
  const { display, waitingForOperand } = state;
  if (waitingForOperand) {
    return { ...state, display: digit, waitingForOperand: false };
  }
  if (display === "0") {
    return { ...state, display: digit };
  }
  if (display.replace(/[-.]/g, "").length >= 16) return state;
  return { ...state, display: display + digit };
}

export function inputDecimal(state: CalcState): CalcState {
  if (state.waitingForOperand) {
    return { ...state, display: "0.", waitingForOperand: false };
  }
  if (!state.display.includes(".")) {
    return { ...state, display: state.display + "." };
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
  // Trim trailing zeros from integer results of division.
  const str = parseFloat(value.toPrecision(12)).toString();
  return str.length > 16 ? value.toExponential(8) : str;
}

export function setOperator(state: CalcState, next: NonNullable<Operator>): CalcState {
  const current = toNumber(state.display);

  if (state.operator && !state.waitingForOperand && state.previousValue !== null) {
    const result = apply(state.previousValue, current, state.operator);
    return {
      previousValue: result,
      display: formatResult(result),
      operator: next,
      waitingForOperand: true,
    };
  }

  return {
    ...state,
    previousValue: current,
    operator: next,
    waitingForOperand: true,
  };
}

export function equals(state: CalcState): CalcState {
  if (state.operator === null || state.previousValue === null) return state;
  const current = toNumber(state.display);
  const result = apply(state.previousValue, current, state.operator);
  return {
    display: formatResult(result),
    previousValue: null,
    operator: null,
    waitingForOperand: true,
  };
}

export function clearAll(): CalcState {
  return { ...initialState };
}

export function toggleSign(state: CalcState): CalcState {
  if (state.display === "0" || state.display === "Error") return state;
  const next = state.display.startsWith("-")
    ? state.display.slice(1)
    : `-${state.display}`;
  return { ...state, display: next };
}

export function percent(state: CalcState): CalcState {
  const value = toNumber(state.display) / 100;
  return { ...state, display: formatResult(value) };
}

export function backspace(state: CalcState): CalcState {
  if (state.waitingForOperand) return state;
  if (state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith("-"))) {
    return { ...state, display: "0" };
  }
  return { ...state, display: state.display.slice(0, -1) };
}