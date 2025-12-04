import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { Parser } from "expr-eval";

export const MathExpressionFunctionDefinition = DefineFunction({
  callback_id: "math_expression_function",
  title: "Evaluate Math Expression",
  description: "Evaluate a mathematical expression",
  source_file: "functions/math_expression.ts",
  input_parameters: {
    properties: {
      expression: {
        type: Schema.types.string,
        title: "Math Expression",
        description: "A mathematical expression to evaluate",
        hint: "1 + 2 * 3",
      },
      round_to: {
        type: Schema.types.integer,
        title: "Round to",
        description: "The number of decimal places to round to",
        hint: "2",
        "enum": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "choices": [
          { value: 0, title: "0" },
          { value: 1, title: "1" },
          { value: 2, title: "2" },
          { value: 3, title: "3" },
          { value: 4, title: "4" },
          { value: 5, title: "5" },
          { value: 6, title: "6" },
        ],
        "default": 2,
      },
    },
    required: ["expression"],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.number,
        title: "Math result",
      }
    },
    required: ["result"],
  },
});

export default SlackFunction(
  MathExpressionFunctionDefinition,
  ({ inputs }) => {
    const { expression, round_to = 2 } = inputs;
    const parser = new Parser();
    const result = parser.parse(expression).evaluate({});
    const rounded_result = Math.round(result * Math.pow(10, round_to)) / Math.pow(10, round_to);
    return { outputs: { result: rounded_result } };
  },
);