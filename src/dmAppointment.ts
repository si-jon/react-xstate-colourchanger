import { MachineConfig, send, Action, assign } from "xstate";


function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

const grammar: { [index: string]: { person?: string, day?: string, time?: string } } = {
    // Persons
    "John": { person: "John Appleseed" },
    "Mary": { person: "Mary Shelly" },
    "Jane": { person: "Jane Austen" },
    "Albert": { person: "Albert Einstein" },
    "Coco": { person: "Coco Chanel" },
    "Rebecca": { person: "Rebecka Black" },
    "Vlad": { person: "Vlad Maraev" },
    // Weekdays
    "on Monday": { day: "Monday" },
    "on Tuesday": { day: "Tuesday" },
    "on Wednesday": { day: "Wednesday" },
    "on Thursday": { day: "Thursday" },
    "on Friday": { day: "Friday" },
    "on Saturday": { day: "Saturday" },
    "on Sunday": { day: "Sunday" },
    "Monday": { day: "Monday" },
    "Tuesday": { day: "Tuesday" },
    "Wednesday": { day: "Wednesday" },
    "Thursday": { day: "Thursday" },
    "Friday": { day: "Friday" },
    "Saturday": { day: "Saturday" },
    "Sunday": { day: "Sunday" },
    // Times
    8: { time: "8:00" },
    9: { time: "9:00" },
    10: { time: "10:00" },
    11: { time: "11:00" },
    12: { time: "12:00" },
    1: { time: "1:00" },
    2: { time: "2:00" },
    3: { time: "3:00" },
    4: { time: "4:00" },
    5: { time: "5:00" },
    "at 8 p.m.": { time: "8:00" },
    "at 9 p.m.": { time: "9:00" },
    "at 10 p.m.": { time: "10:00" },
    "at 11 p.m.": { time: "11:00" },
    "at 12 p.m.": { time: "12:00" },
    "at 1 p.m.": { time: "1:00" },
    "at 2 p.m.": { time: "2:00" },
    "at 3 p.m.": { time: "3:00" },
    "at 4 p.m.": { time: "4:00" },
    "at 5 p.m.": { time: "5:00" },
    "at 8": { time: "8:00" },
    "at 9": { time: "9:00" },
    "at 10": { time: "10:00" },
    "at 11": { time: "11:00" },
    "at 12": { time: "12:00" },
    "at 1": { time: "1:00" },
    "at 2": { time: "2:00" },
    "at 3": { time: "3:00" },
    "at 4": { time: "4:00" },
    "at 5": { time: "5:00" },
}

const grammar_2: { [index: string]: {  } } = {
    "yes": true,
    "you bet": true,
    "yeah": true,
    "no": false,
    "no way": false,
    "nope": false,
}


export const dmAppointmentMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            initial: "prompt",
            on: { ENDSPEECH: "who" },
            states: {
                prompt: { entry: say("Let's create an appointment") }
            }
        },
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "person" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { person: grammar[context.recResult].person } }),
                    target: "day"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("Whom are you meeting?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't know them"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        day: {
            initial: "confirmation",
            on: {
                RECOGNISED: [{
                    cond: (context) => "day" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { day: grammar[context.recResult].day } }),
                    target: "whole_day"
                },
                { target: ".nomatch" }]},
            states: {
                confirmation: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person}.`,
                    })),
                    on: { ENDSPEECH: "prompt" }
                },
                prompt: {
                    entry: say("On which day is your meeting?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't know that day"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        whole_day: {
            initial: "confirmation",
            on: {
                RECOGNISED: [
                    {
                        cond: (context) => grammar_2[context.recResult] === true,
                        target: "create_appointment_whole_day",
                    },
                    {
                        cond: (context) => grammar_2[context.recResult] === false, 
                        target: "time"
                    },
                    { target: ".nomatch" }]},
            states: {
                confirmation: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.day}`,
                    })),
                    on: { ENDSPEECH: "prompt" }
                },
                prompt: {
                    entry: say("Will it take the whole day?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I didn't understand your answer"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        time: {
            initial: "confirmation",
            on: {
                RECOGNISED: [{
                    cond: (context) => "time" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { time: grammar[context.recResult].time } }),
                    target: "create_appointment_time"

                },
                { target: ".nomatch" }]},
            states: {
                confirmation: {
                    entry: say(`OK.`),
                    on: { ENDSPEECH: "prompt" }
                },
                prompt: {
                    entry: say("What time is your meeting?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, I didn't catch that"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        create_appointment_whole_day: {
            initial: "confirmation",
            on: {
                RECOGNISED: [
                    {
                        cond: (context) => grammar_2[context.recResult] === true,
                        target: "appointment_created",
                    },
                    {
                        cond: (context) => grammar_2[context.recResult] === false,
                        target: "who"
                    },
                    { target: ".nomatch" }]},
            states: {
                confirmation: {
                    entry: say(`OK.`),
                    on: { ENDSPEECH: "prompt" }
                },
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`,
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, I didn't catch that"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        create_appointment_time: {
            initial: "confirmation",
            on: {
                RECOGNISED: [
                    {
                        cond: (context) => grammar_2[context.recResult] === true,
                        target: "appointment_created",
                    },
                    {
                        cond: (context) => grammar_2[context.recResult] === false,
                        target: "who"
                    },
                    { target: ".nomatch" }]},
            states: {
                confirmation: {
                    entry: say(`OK.`),
                    on: { ENDSPEECH: "prompt" }
                },
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`,
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, I didn't catch that"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        appointment_created: {
            entry: say("Your appointment has been created!"),
            type: 'final'
        }
    }
})
