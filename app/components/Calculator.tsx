"use client";

import { useEffect, useReducer } from "react";
import {
  CalcState,
  backspace,
  clearAll,
  equals,
  inputDecimal,
  inputDigit,
  percent,
  setOperator,
  toggleSign,
} from "../lib/calculator";

type Action =
  | { type: "DIGIT"; digit: string }
  | { type: "DECIMAL" }
  | { type: "OPERATOR"; op: "+" | "-" | "*" | "/" }
  | { type: "EQUALS" }
  | { type: "CLEAR" }
  | { type: "SIGN" }
  | { type: "PERCENT" }
  | { type: "BACKSPACE" };

function reducer(state: CalcState, action: Action): CalcState {
  switch (action.type) {
    case "DIGIT":
      return inputDigit(state, action.digit);
    case "DECIMAL":
      return inputDecimal(state);
    case "OPERATOR":
      return setOperator(state, action.op);
    case "EQUALS":
      return equals(state);
    case "CLEAR":
      return clearAll();
    case "SIGN":
      return toggleSign(state);
    case "PERCENT":
      return percent(state);
    case "BACKSPACE":
      return backspace(state);
  }
}

interface ButtonDef {
  label: string;
  onClick: () => void;
  kind: "digit" | "operator" | "action" | "equals";
  span?: number;
}

function buildButtons(dispatch: React.Dispatch<Action>, state: CalcState): ButtonDef[][] {
  const digit = (d: string) => () => dispatch({ type: "DIGIT", digit: d });
  const op = (o: "+" | "-" | "*" | "/") => () => dispatch({ type: "OPERATOR", op: o });

  return [
    [
      { label: "AC", kind: "action", onClick: () => dispatch({ type: "CLEAR" }) },
      { label: "+/-", kind: "action", onClick: () => dispatch({ type: "SIGN" }) },
      { label: "%", kind: "action", onClick: () => dispatch({ type: "PERCENT" }) },
      { label: "÷", kind: "operator", onClick: op("/") },
    ],
    [
      { label: "7", kind: "digit", onClick: digit("7") },
      { label: "8", kind: "digit", onClick: digit("8") },
      { label: "9", kind: "digit", onClick: digit("9") },
      { label: "×", kind: "operator", onClick: op("*") },
    ],
    [
      { label: "4", kind: "digit", onClick: digit("4") },
      { label: "5", kind: "digit", onClick: digit("5") },
      { label: "6", kind: "digit", onClick: digit("6") },
      { label: "−", kind: "operator", onClick: op("-") },
    ],
    [
      { label: "1", kind: "digit", onClick: digit("1") },
      { label: "2", kind: "digit", onClick: digit("2") },
      { label: "3", kind: "digit", onClick: digit("3") },
      { label: "+", kind: "operator", onClick: op("+") },
    ],
    [
      { label: "0", kind: "digit", onClick: digit("0"), span: 2 },
      { label: ".", kind: "digit", onClick: () => dispatch({ type: "DECIMAL" }) },
      { label: "=", kind: "equals", onClick: () => dispatch({ type: "EQUALS" }) },
    ],
  ];
}

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, {
    display: "0",
    expression: "",
    previousValue: null,
    operator: null,
    waitingForOperand: false,
    justEvaluated: false,
  });

  // Keyboard support.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        dispatch({ type: "DIGIT", digit: e.key });
      } else if (e.key === ".") {
        dispatch({ type: "DECIMAL" });
      } else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
        dispatch({ type: "OPERATOR", op: e.key });
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        dispatch({ type: "EQUALS" });
      } else if (e.key === "Backspace") {
        dispatch({ type: "BACKSPACE" });
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        dispatch({ type: "CLEAR" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const rows = buildButtons(dispatch, state);

  return (
    <div className="calculator" role="application" aria-label="Calculator">
      <div
        className="display"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="display"
      >
        <div
          className="expression"
          data-testid="expression"
          title={state.expression}
        >
          {state.expression || "\u00A0"}
        </div>
        <div className="result" data-testid="result">
          {state.display}
        </div>
      </div>
      <div className="keypad">
        {rows.flat().map((btn) => (
          <button
            key={btn.label}
            type="button"
            className={`key key--${btn.kind}`}
            style={btn.span === 2 ? { gridColumn: "span 2" } : undefined}
            onClick={btn.onClick}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}