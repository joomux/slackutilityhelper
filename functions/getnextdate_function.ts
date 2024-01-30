import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { datetime } from "https://deno.land/x/ptera/mod.ts";

export const GetNextDateFunctionDefinition = DefineFunction({
  callback_id: "getnextdate_function",
  title: "Get specific day",
  description: "Fetch the date of a day of the week in the future",
  source_file: "functions/getnextdate_function.ts",
  input_parameters: {
    properties: {
      day_of_week: {
        type: Schema.types.integer,
        title: "Day of the week",
        description: "Get next day of week",
        enum: [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
        ],
        choices: [
          { value: "1", title: "Monday" },
          { value: "2", title: "Tuesday" },
          { value: "3", title: "Wednesday" },
          { value: "4", title: "Thursday" },
          { value: "5", title: "Friday" },
          { value: "6", title: "Saturday" },
          { value: "7", title: "Sunday" },
        ],
      },
      jump_forward_weeks: {
        title: "Skip weeks",
        hint:
          "If 0, will try to use the current week or the next week if not possible. 1 will always start with next week.",
        type: Schema.types.integer,
        default: 0,
      },
      time: {
        title: "Time",
        hint: "The specific time to return",
        type: Schema.types.string,
        description: "In format HH:MM AM/PM e.g., 2:30 PM",
      },
      user: {
        type: Schema.slack.types.user_id,
        title: "Relative to user",
        description: "Select 'user running this workflow' for best results",
        hint: "Uses this user for time zone offset calculation",
      },
    },
    required: ["day_of_week", "time", "user"],
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
        title: "UTC Time",
      },
    },
    required: ["date_value", "timestamp_value"],
  },
});

export default SlackFunction(
  GetNextDateFunctionDefinition,
  async ({ client, inputs }) => {
    let { day_of_week, jump_forward_weeks, time, user } = inputs;

    // is selected day _after_ current day?
    // need to get time zone of user for that
    const user_obj = await client.users.info({ user: user });

    console.log(user_obj.user);

    const dt = datetime();
    dt.toZonedTime(user_obj.user.tz);
    const curr_weekday_num = +dt.format("w");

    console.log("user time zone", user_obj.user.tz);
    console.log("day of week selected: ", day_of_week);
    console.log("day of week current: ", curr_weekday_num);

    let hours_to_add = 0;
    if (user_obj.user.tz_label.toString().match(/Daylight/ig)) {
      // add an hour???
      console.log("we are in DST time, add an hour");
      hours_to_add = 1;
    }

    const days_to_add = +day_of_week - curr_weekday_num;
    let weeks_to_add = 0;
    if (days_to_add < 0) {
      // go to next week
      console.log("adjust to next week");
      weeks_to_add = 1;
    }
    if (typeof jump_forward_weeks != "number") {
      jump_forward_weeks = 0;
    }
    console.log("adding weeks: ", jump_forward_weeks);
    console.log("adding days: ", days_to_add);
    console.log("current date is: ", dt.format("YYYY-MM-dd"));
    const new_dt = dt.add({
      weeks: jump_forward_weeks + weeks_to_add,
      day: days_to_add,
      hour: hours_to_add,
    });

    console.log("date after adding days: ", new_dt.format("YYYY-MM-dd HH:mm"));

    const year = +new_dt.format("YYYY");
    const month = +new_dt.format("M");
    const day = +new_dt.format("d");
    const timezone = user_obj.user.tz.toString();
    // const timezone = "T" + user_obj.user.tz_offset / 3600;

    // let's rip apart the time!
    let hour = +time.split(":")[0];
    const minute = +time.split(":")[1].split(" ")[0];

    const meridian = time.split(":")[1].split(" ")[1].toUpperCase();

    console.log("meridian", meridian);

    if (
      hour < 12 && meridian == "PM"
    ) {
      console.log("adding 12 to the hours");
      hour += 12;
    }

    console.log("setting hour to", hour);
    console.log("using time zone", timezone);

    let final_dt = datetime({
      year: year,
      month: month,
      day: day,
      hour: hour, // + hours_to_add,
      minute: minute,
      second: 0,
    });
    final_dt = final_dt.subtract({ hour: 12 }).add({ hour: hours_to_add }); // why this adjustment??
    // final_dt = final_dt.toZonedTime(timezone);

    const date_value = final_dt.format("YYYY-MM-dd");
    const timestamp_value = Math.round(+final_dt.format("X"));
    const time_value = final_dt.format("h:mm a");

    console.log("date_value =", date_value);
    console.log("timestamp_value =", timestamp_value);
    console.log("time_value =", time_value);

    return {
      outputs: {
        date_value,
        timestamp_value,
        time_value,
      },
    };
  },
);
