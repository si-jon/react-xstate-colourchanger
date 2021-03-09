import { MachineConfig, send, Action, assign, actions } from "xstate";

import { grammar } from './grammars/appointmentGrammar'
import { yes_no_grammar } from './grammars/appointmentGrammar'

const { cancel } = actions;

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

const startRepromptTimer: Action<SDSContext, SDSEvent> = send("TIMER", { delay: 3000, id: "repromptTimer" })
const cancelRepromptTimer: Action<SDSContext, SDSEvent> = cancel("repromptTimer")
const resetRepromptCount: Action<SDSContext, SDSEvent> = assign({ repromptCount: context => 0 })

function promptAndAsk(prompt: Action<SDSContext, SDSEvent>, repompt: Action<SDSContext, SDSEvent>): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: "prompt",
        states: {
            prompt: {
                entry: prompt,
                on: {
                    ENDSPEECH: "ask",
                },
                exit: startRepromptTimer
            },
            ask: {
                entry: listen(),
                exit: cancelRepromptTimer
            },
            repromptCounter: {
                entry: [
                    send('STOP_LISTEN'),
                    assign({ repromptCount: context => context.repromptCount + 1 }),
                    say("Hey, are you awake?")
                ],
                on: {
                    ENDSPEECH: [
                        {
                            cond: (context) => context.repromptCount > 3,
                            target: "#giveup"
                        },
                        {
                            target: "reprompt"
                        }
                    ]
                },
            },
            reprompt: {
                entry: repompt,
                on: {
                    ENDSPEECH: "ask",
                },
                exit: startRepromptTimer
            },
            nomatch: {
                entry: say("Sorry, could you repeat that?"),
                on: { ENDSPEECH: "reprompt" }
            },
        }
    })
}

function inGrammar(val: string, context: SDSContext): boolean {
    return val in (grammar[context.recResult] || {})
}

function appointmentInformation(context: SDSContext): string {
    var text = ""
    if (context.wholeDay) {
        text = `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`
    }
    else {
        text = `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`
    }
    return text
}

function appointmentInformation2(context: SDSContext): string {
    var text = ""
    if (context.wholeDay) {
        text = `${context.person}. ${context.day}. Whole day. Create appointment?`
    }
    else {
        text = `${context.person}. ${context.day}. ${context.time}. Create appointment?`
    }
    return text
}

const createAppointmentPrompt: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: appointmentInformation(context)
}))

const createAppointmentReprompt: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: appointmentInformation2(context)
}))

export const dmAppointmentMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    id: "appointment",
    initial: "promptflow",
    entry: resetRepromptCount,
    states: {
        promptflow: {
            id: "promptflow",
            initial: "init",
            states: {
                init: {
                    initial: "welcome",
                    on: { ENDSPEECH: "who" },
                    states: {
                        welcome: {
                            entry: say("Let's create an appointment"),
                        }
                    }
                },
                who: {
                    initial: "promptAndAsk",
                    states: {
                        promptAndAsk: {
                            ...promptAndAsk(say("Whom are you meeting?"), say("You are meeting whom?")),
                        },
                        confirmation: {
                            entry: [
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `OK. ${context.person}`,
                                })),
                                resetRepromptCount
                            ],
                            on: { ENDSPEECH: "#promptflow.day" }
                        }
                    },
                    on: {
                        RECOGNISED: [
                            {
                                cond: (context) => context.recResult === "help",
                                target: "#common.help"
                            },
                            {
                                cond: (context) => inGrammar("person", context),
                                actions: [
                                    assign((context) => {
                                        return { person: grammar[context.recResult].person }
                                    })
                                ],
                                target: ".confirmation"
                            },
                            { target: ".promptAndAsk.nomatch" }
                        ],
                        TIMER: ".promptAndAsk.repromptCounter"
                    },
                },
                day: {
                    initial: "promptAndAsk",
                    states: {
                        promptAndAsk: {
                            ...promptAndAsk(say("On which day is your meeting?"), say("Which day?"))
                        },
                        confirmation: {
                            entry: [
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `OK. ${context.day}`,
                                })),
                                resetRepromptCount
                            ],
                            on: { ENDSPEECH: "#promptflow.whole_day" }
                        }
                    },
                    on: {
                        RECOGNISED: [{
                            cond: (context) => context.recResult === "help",
                            target: "#common.help"
                        },
                        {
                            cond: (context) => inGrammar("day", context),
                            actions: assign((context) => {
                                return { day: grammar[context.recResult].day }
                            }),
                            target: ".confirmation"
                        },
                        { target: ".promptAndAsk.nomatch" }
                        ],
                        TIMER: ".promptAndAsk.repromptCounter"
                    },
                },
                whole_day: {
                    initial: "promptAndAsk",
                    states: {
                        promptAndAsk: {
                            ...promptAndAsk(say("Will it take the whole day?"), say("Whole day?"))
                        },
                        confirmation: {
                            entry: [
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `OK. ${context.wholeDay}`,
                                })),
                                resetRepromptCount
                            ],
                            on: {
                                ENDSPEECH: [{
                                    cond: (context) => context.wholeDay,
                                    target: "#promptflow.create_appointment",
                                },
                                { target: "#promptflow.time" },
                                ]
                            }
                        },
                    },
                    on: {
                        RECOGNISED: [{
                            cond: (context) => context.recResult === "help",
                            target: "#common.help"
                        },
                        {
                            cond: (context) => context.recResult in yes_no_grammar,
                            actions: [
                                assign((context) => {
                                    return { wholeDay: yes_no_grammar[context.recResult] }
                                })
                            ],
                            target: ".confirmation",
                        },
                        { target: ".promptAndAsk.nomatch" }
                        ],
                        TIMER: ".promptAndAsk.repromptCounter"
                    }
                },
                time: {
                    initial: "promptAndAsk",
                    states: {
                        promptAndAsk: {
                            ...promptAndAsk(say("At what time is your meeting?"), say("What time?"))
                        },
                        confirmation: {
                            entry: [
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `OK. ${context.time}`,
                                })),
                                resetRepromptCount
                            ],
                            on: { ENDSPEECH: "#promptflow.create_appointment" }
                        },
                    },
                    on: {
                        RECOGNISED: [{
                            cond: (context) => context.recResult === "help",
                            target: "#common.help"
                        },
                        {
                            cond: (context) => "time" in (grammar[context.recResult] || {}),
                            actions:
                                assign((context) => {
                                    return { time: grammar[context.recResult].time }
                                }),
                            target: ".confirmation",

                        },
                        { target: ".promptAndAsk.nomatch" }
                        ],
                        TIMER: ".promptAndAsk.repromptCounter"
                    },
                },
                create_appointment: {
                    initial: "promptAndAsk",
                    states: {
                        promptAndAsk: {
                            ...promptAndAsk(createAppointmentPrompt, createAppointmentReprompt),
                        },
                    },
                    on: {
                        RECOGNISED: [{
                            cond: (context) => context.recResult === "help",
                            target: "#common.help"
                        },
                        {
                            cond: (context) => yes_no_grammar[context.recResult] === true,
                            target: "#appointment_created",
                        },
                        {
                            cond: (context) => yes_no_grammar[context.recResult] === false,
                            target: "who"
                        },
                        { target: ".promptAndAsk.nomatch" }],
                        TIMER: ".promptAndAsk.repromptCounter"
                    },
                },
                hist: {
                    type: "history",
                    history: "shallow"
                },
            },
        },
        common: {
            id: "common",
            states: {
                help: {
                    entry: say("This is a help message"),
                    on: { ENDSPEECH: "#promptflow.hist" },
                },
            },
        },
        giveup: {
            id: "giveup",
            entry: say("Bye bye!"),
            type: "final"
        },
        appointment_created: {
            id: "appointment_created",
            entry: say("Your appointment has been created!"),
            type: "final"
        }
    }
})

