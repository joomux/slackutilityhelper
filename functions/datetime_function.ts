import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
// import { APIProxy } from "deno-slack-api/api-proxy.ts";
// import SampleObjectDatastore from "../datastores/sample_datastore.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const DatetimeFunctionDefinition = DefineFunction({
  callback_id: "datetime_function",
  title: "Calculate date",
  description: "Determine a relative date and time value based on inputs",
  source_file: "functions/datetime_function.ts",
  input_parameters: {
    properties: {
      reference_date: {
        type: Schema.slack.types.date,
        title: "Reference Date",
        description: "Starting point for calculation (leave empty to use current date)",
        hint: "The date to calculate from. If not provided, uses the time the workflow runs",
      },
      relative_count: {
        type: Schema.types.integer,
        title: "Value Difference",
        description: "How many days, hours or minutes into the future?",
      },
      relative_unit: {
        type: Schema.types.string,
        title: "Units",
        description: "Move forward by...",
        enum: ["Days", "Weeks", "Months", "Years"],
        // enum: ["Days"],
      },
      time_specific: {
        type: Schema.types.string,
        title: "Time",
        description: "In format HH:MM AM/PM e.g., 2:30 PM",
      },
      user: {
        type: Schema.slack.types.user_id,
        title: "Relative to user",
        description: "Select 'user running this workflow' for best results",
        hint: "Uses this user for time zone offset calculation",
      },
    },
    required: ["relative_count", "relative_unit", "user"],
  },
  output_parameters: {
    properties: {
      date_value: {
        type: Schema.slack.types.date,
        title: "Date Value",
        description: "The calculated date",
      },
      timestamp_value: {
        type: Schema.slack.types.timestamp,
        title: "Time Value",
        description: "The calculated timestamp",
      },
      time_value: {
        type: Schema.types.string,
        title: "Pretty Time",
      },
    },
    required: ["date_value", "timestamp_value"],
  },
});

export default SlackFunction(
  DatetimeFunctionDefinition,
  async ({ client, inputs }) => {
    // console.log("here we go", inputs);
    const { reference_date, relative_count, relative_unit, time_specific, user } = inputs;
    debug(client, `inputs: ${JSON.stringify(inputs)}`);
    debug(
      client,
      `jumping ${relative_count} ${relative_unit.toLocaleLowerCase()} into the future...`,
    );

    debug(client, `user id = ${user}`);

    const user_obj = await client.users.info({ user: user });
    const tz_offset = user_obj.user.tz_offset * 1000;
    debug(client, "type of tz_offset " + typeof user_obj.user.tz_offset);
    debug(client, `user object ${JSON.stringify(user_obj)}`);

    // get current datetime or use reference_date if provided
    let d: Date;
    if (reference_date) {
      d = new Date(reference_date);
      debug(client, `Using reference date: ${reference_date}`);
    } else {
      d = new Date();
      debug(client, `Using current date/time`);
    }
    
    debug(client, `Current date: ${d.getDate()}`);
    debug(client, `current UTC time: ${d.getTime()}`);
    debug(
      client,
      `raw offset: ${user_obj.user.tz_offset}\nadding offset value: ${tz_offset}`,
    );

    // adjust for TZ offset
    d.setTime(d.getTime() + tz_offset);
    debug(client, `adjusted LOCAL time ${d.getTime()}`);

    // add or subtract input value as input unit
    if (relative_unit == "Days") {
      d.setDate(d.getDate() + relative_count);
    } else if (relative_unit == "Hours") {
      d.setHours(d.getHours() + relative_count);
    }

    switch (relative_unit) {
      case "Years":
        d.setFullYear(d.getFullYear() + relative_count);
        break;
      case "Months":
        d.setMonth(d.getMonth() + relative_count);
        break;
      case "Days":
        d.setDate(d.getDate() + relative_count);
        // d.setTime(d.getTime() + relative_count * 24 * 60 * 60 * 1000);
        break;
      case "Weeks":
        d.setDate(d.getDate() + relative_count * 7);
        break;
      case "Hours":
        d.setHours(d.getHours() + relative_count);
        break;
      case "Minutes":
        d.setMinutes(d.getMinutes() + relative_count);
        break;
      default:
        break;
    }

    debug(client, `Adjusted date: ${d.getDate()}`);

    if (time_specific) {
      // now adjust the time
      const r = /([\d]+):([\d]{2})\s*(AM|PM)/gmi;
      const m = r.exec(time_specific);
      // console.log("matches", m);

      const hour = +d.getHours();
      const mins = d.getMinutes();
      let meri = "AM";

      if (hour >= 12) {
        const meri = "PM";
      }

      if (m?.length == 4) {
        const hour = +m[1];
        const mins = +m[2];
        const meri = m[3].toUpperCase();
        // console.log("in the IF");
        // console.log("meri = ", meri);
        // console.log("hour: ", hour);

        if (meri == "PM" && hour < 12) {
          const newhours = hour + 12;
          d.setHours(newhours);
        } else {
          d.setHours(hour);
        }
        d.setMinutes(mins);
      }
    }

    debug(client, `Revised date after time stuff: ${d.getDate()}`);

    const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
    const month = d.getMonth() < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes();

  // build output vars
  const date_value = `${d.getFullYear()}-${month}-${day}`;
  const timestamp_value = Math.floor((d.getTime() - tz_offset) / 1000);
  
  // Format time in human-readable 12-hour format (e.g., 8:00am, 11:23pm)
  const hours24 = d.getHours();
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  const ampm = hours24 >= 12 ? "pm" : "am";
  const time_value = `${hours12}:${minutes}${ampm}`;

    debug(
      client,
      `Timezone offset ${d.getTimezoneOffset()}\nDate: ${date_value}\nTime: ${timestamp_value}\nPretty: ${time_value}`,
    );

    // const date_value = "";
    // const timestamp_value = "";

    return { outputs: { date_value, timestamp_value, time_value } };
  },
);

async function debug(client: object, msg: string, obj?: object) {
  console.log(msg);
  // await client.chat.postMessage({
  //   channel: "C06CSBMETF1",
  //   text: msg,
  // });
}
