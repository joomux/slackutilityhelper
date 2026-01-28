import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
// import { APIProxy } from "deno-slack-api/api-proxy.ts";
// import SampleObjectDatastore from "../datastores/sample_datastore.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const DatediffFunctionDefinition = DefineFunction({
  callback_id: "datediff_function",
  title: "Calculate date difference",
  description: "Determine the difference between two dates",
  source_file: "functions/datediff_function.ts",
  input_parameters: {
    properties: {
      date1: {
        type: Schema.slack.types.date,
        title: "First Date",
        description: "The start date",
      },
      date2: {
        type: Schema.slack.types.date,
        title: "Second Date",
        description: "The end date",
      },
      unit: {
        type: Schema.types.string,
        title: "Unit of Time",
        description: "Calculate difference in...",
        enum: ["Days", "Weeks", "Months", "Years"],
        default: "Days",
      },
      decimal_places: {
        type: Schema.types.integer,
        title: "Decimal Places",
        description: "Number of decimal places for the result (0-10)",
        default: 0,
      },
    },
    required: ["date1", "date2", "unit"],
  },
  output_parameters: {
    properties: {
      difference: {
        type: Schema.types.number,
        title: "Date Difference",
        description: "The calculated difference in the selected unit",
      },
      unit_used: {
        type: Schema.types.string,
        title: "Unit Used",
        description: "The unit of time used for the calculation",
      },
      is_anniversary: {
        type: Schema.types.boolean,
        title: "Is Anniversary",
        description: "True if Date2 has the same month and day as Date1",
      },
    },
    required: ["difference", "unit_used", "is_anniversary"],
  },
});

export default SlackFunction(
  DatediffFunctionDefinition,
  async ({ client, inputs }) => {
    const { date1, date2, unit, decimal_places = 0 } = inputs;
    debug(client, `inputs: ${JSON.stringify(inputs)}`);
    debug(
      client,
      `calculating the difference between ${date1} and ${date2} in ${unit}`,
    );

    const startDate = new Date(date1);
    const endDate = new Date(date2);
    
    // Calculate the difference in milliseconds
    const diffMs = endDate.getTime() - startDate.getTime();
    
    // Clamp decimal_places to a reasonable range (0-10)
    const places = Math.max(0, Math.min(10, decimal_places || 0));
    
    let difference: number;
    
    switch (unit) {
      case "Days":
        // Convert milliseconds to days
        difference = diffMs / (1000 * 60 * 60 * 24);
        break;
        
      case "Weeks":
        // Convert milliseconds to weeks
        difference = diffMs / (1000 * 60 * 60 * 24 * 7);
        break;
        
      case "Months":
        // Calculate months difference (accounting for varying month lengths)
        const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
        const monthsDiff = endDate.getMonth() - startDate.getMonth();
        let monthsTotal = yearsDiff * 12 + monthsDiff;
        
        // For fractional months, calculate the day difference
        if (places > 0) {
          const dayDiff = endDate.getDate() - startDate.getDate();
          const daysInMonth = new Date(
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            0
          ).getDate();
          monthsTotal += dayDiff / daysInMonth;
        } else {
          // Adjust if the day of month hasn't been reached yet
          if (endDate.getDate() < startDate.getDate()) {
            monthsTotal -= 1;
          }
        }
        difference = monthsTotal;
        break;
        
      case "Years":
        // Calculate years difference
        let yearsTotal = endDate.getFullYear() - startDate.getFullYear();
        
        if (places > 0) {
          // For fractional years, add the month and day portion
          const monthFraction = (endDate.getMonth() - startDate.getMonth()) / 12;
          const dayFraction = (endDate.getDate() - startDate.getDate()) / 365;
          yearsTotal += monthFraction + dayFraction;
        } else {
          // Adjust if the month/day hasn't been reached yet in the current year
          if (
            endDate.getMonth() < startDate.getMonth() ||
            (endDate.getMonth() === startDate.getMonth() && 
             endDate.getDate() < startDate.getDate())
          ) {
            yearsTotal -= 1;
          }
        }
        difference = yearsTotal;
        break;
        
      default:
        // Default to days if unit is not recognized
        difference = diffMs / (1000 * 60 * 60 * 24);
    }
    
    // Round to the specified number of decimal places
    const roundedDifference = Number(difference.toFixed(places));
    
    // Check if Date2 is an anniversary of Date1 (same month and day)
    const isAnniversary = startDate.getMonth() === endDate.getMonth() && 
                          startDate.getDate() === endDate.getDate();
    
    debug(client, `difference in ${unit}: ${roundedDifference}`);
    debug(client, `is anniversary: ${isAnniversary}`);

    return { 
      outputs: { 
        difference: roundedDifference,
        unit_used: unit,
        is_anniversary: isAnniversary,
      } 
    };
  },
);


async function debug(client: object, msg: string, obj?: object) {
  console.log(msg);
  // await client.chat.postMessage({
  //   channel: "C06CSBMETF1",
  //   text: msg,
  // });
}
