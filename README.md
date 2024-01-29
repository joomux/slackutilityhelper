# Utility Helper for Slack Workflow Builder

This project adds support for user-relative date/time calculations to allow for dynamic dates being calculated, as well as handling math.

This will a new *Utility Helper* step into Workflow Builder with 2 sub-steps (dub-steps?)...

## Calculate Date
Determines a date and time in the future relative to the time the workflow is run and the time zone of the user selected.

**Value Difference:** The value into the future you wish to determine a date for. 
**Units:** The unit by which you wish to look into the future. 
**Time (optional):** The specific time, relative to the *Relative to user* to set the calculated date to.
**Relative to user:** A user to which the *Time* value is relative to

## Example use case
A new project comes in! Run a workflow that:
1. Creates a new channel
2. Adds people to that channel
3. *Calculates a date* for 3 days time at 10am (the meeting start time)
4. *Calculates a date* for 3 days time at 11am (the meeting end time)
5. Schedule a meeting (using Google Calendar or Outlook) to begin using the value calculated in step 3 and an end time using the value calculated at 4
6. Post calendar invite details into the channel

## Do Maths
Performs a mathematical calculation based on 2 input numbers

**Value of X:** The value of the first number in the equation
**Value of Y:** The value of the second number in the equation
**Operator:** The calculation to perform
* \+ Add them together
* \- Subtract Y from X
* x Multiple them together
* ÷ X divided by Y (X/Y)
* ^ Raise X to the power of Y

## Example use case
Perform calculations based on date coming in from a Salesforce record and post the results to channel.

Note that it's possible to use this step multiple repeatedly to build complex equations.