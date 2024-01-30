import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const MathHelperFunctionDefiniton = DefineFunction({
  callback_id: "math_helper_function",
  title: "Do maths",
  description: "Perform basic mathematical operations",
  source_file: "functions/math_helper.ts",
  input_parameters: {
    properties: {
      number_x: {
        type: Schema.types.number,
        title: "Value of X",
        description: "An integer or decimal",
        hint: "First argument into equation",
      },
      number_y: {
        type: Schema.types.number,
        title: "Value of Y",
        description: "An integer or decimal",
        hint: "Second argument into equation",
      },
      operator: {
        type: Schema.types.string,
        enum: ["+", "-", "x", "÷", "^"],
        choices: [
          { value: "+", title: "X + Y", description: "X plus Y" },
          { value: "-", title: "X - Y", description: "X minus Y" },
          { value: "x", title: "X x Y", description: "X multiplied by Y" },
          { value: "÷", title: "X ÷ Y", description: "X divided by Y" },
          { value: "^", title: "X^Y", description: "X to the power of Y" },
        ],
        title: "Operator",
        description: "Choose operator",
        hint: "X [operator] Y",
      },
    },
    required: ["number_x", "number_y", "operator"],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.number,
        title: "Math result",
      },
    },
    required: ["result"],
  },
});

export default SlackFunction(
  MathHelperFunctionDefiniton,
  ({ inputs }) => {
    const { number_x, number_y, operator } = inputs;

    // console.log("inputs ", inputs);

    let answer = null;
    switch (operator) {
      case "-":
        answer = number_x - number_y;
        break;
      case "x":
        answer = number_x * number_y;
        break;
      case "÷":
        answer = number_x / number_y;
        break;
      case "^":
        answer = Math.pow(number_x, number_y);
        break;
      case "+":
      default:
        answer = number_x + number_y;
        break;
    }

    if (isNaN(answer)) {
      console.log("Math error!", answer);
      const result = 0;
      return { outputs: { result } };
    } else {
      const result = answer;
      // console.log("answer is ", result);
      return { outputs: { result } };
    }
  },
);
