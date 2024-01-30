import { Manifest } from "deno-slack-sdk/mod.ts";
// import SampleWorkflow from "./workflows/sample_workflow.ts";
// import SampleObjectDatastore from "./datastores/sample_datastore.ts";
import { DatetimeFunctionDefinition } from "./functions/datetime_function.ts";
import { GetNextDateFunctionDefinition } from "./functions/getnextdate_function.ts";
import { MathHelperFunctionDefiniton } from "./functions/math_helper.ts";

export default Manifest({
  name: "Utility Helper",
  description: "Dates, times and maths! Woohoo!",
  icon: "assets/helper.png",
  functions: [
    DatetimeFunctionDefinition,
    GetNextDateFunctionDefinition,
    MathHelperFunctionDefiniton,
  ],
  outgoingDomains: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "users:read",
  ],
});
