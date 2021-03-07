import { MachineConfig, send, Action, assign } from "xstate";

import { grammar } from './grammars/appointmentGrammar'
import { yes_no_grammar } from './grammars/appointmentGrammar'

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: "prompt",
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: "ask" }
            },
            ask: {
                entry: listen()
            },
            nomatch: {
                entry: say("Sorry, could you repeat that?"),
                on: { ENDSPEECH: "prompt" }
            }
        }
    })
}

function inGrammar(val: string, context: SDSContext): boolean {
    return val in (grammar[context.recResult] || {})
}

function appointmentInformationPrompt(context: SDSContext): string {
    var text = ""
    if (context.wholeDay) {
        text = `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`
    }
    else {
        text = `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`
    }
    return text
}

export const dmAppointmentMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    id: 'appointment',
    initial: "init",
    states: {
        init: {
            initial: "welcome",
            on: { ENDSPEECH: "who" },
            states: {
                welcome: { entry: say("Let's create an appointment") }
            }
        },
        who: {
            initial: "promptAndAsk",
            states: {
                promptAndAsk: {
                    ...promptAndAsk("Whom are you meeting?"),
                },
                confirmation: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person}`,
                    })),
                    on: { ENDSPEECH: "#appointment.day" }
                }
            },
            on: {
                RECOGNISED: [{
                    cond: (context) => inGrammar("person", context),
                    actions: [
                        assign((context) => {
                            return { person: grammar[context.recResult].person }
                        })
                    ],
                    target: ".confirmation"

                },
                { target: ".promptAndAsk.nomatch" }
                ]
            },
        },
        day: {
            initial: "promptAndAsk",
            states: {
                promptAndAsk: {
                    ...promptAndAsk("On which day is your meeting?")
                },
                confirmation: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.day}`,
                    })),
                    on: { ENDSPEECH: "#appointment.whole_day" }
                }
            },
            on: {
                RECOGNISED: [{
                    cond: (context) => inGrammar("day", context),
                    actions: assign((context) => {
                        return { day: grammar[context.recResult].day }
                    }),
                    target: ".confirmation"
                },
                { target: ".promptAndAsk.nomatch" }
                ]
            },
        },
        whole_day: {
            initial: "promptAndAsk",
            states: {
                promptAndAsk: {
                    ...promptAndAsk("Will it take the whole day?")
                },
                confirmation: {
                    entry: [send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.wholeDay}`,
                    }))],
                    on: {
                        ENDSPEECH: [{
                                cond: (context) => context.wholeDay,
                                target: "#appointment.create_appointment",
                            },
                            { target: "#appointment.time" },
                        ]
                    }
                },
            },
            on: {
                RECOGNISED: [{
                        cond: (context) => context.recResult in yes_no_grammar,
                        actions:[
                            assign((context) => {
                                return { wholeDay: yes_no_grammar[context.recResult] }
                            })
                        ],
                        target: ".confirmation",
                    },
                    { target: ".promptAndAsk.nomatch" }
                ]
            }
        },
        time: {
            initial: "promptAndAsk",
            states: {
                promptAndAsk: {
                    ...promptAndAsk("At what time is your meeting?")
                },
                confirmation: {
                    entry: [send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.time}`,
                    }))],
                    on: { ENDSPEECH: "#appointment.create_appointment" }
                },
            },
            on: {
                RECOGNISED: [{
                        cond: (context) => "time" in (grammar[context.recResult] || {}),
                        actions: 
                            assign((context) => {
                                return { time: grammar[context.recResult].time } }),
                        target: ".confirmation",
                    
                    },
                    { target: ".promptAndAsk.nomatch" }
                ]
            },
        },
        create_appointment: {
            initial: "prompt",
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: appointmentInformationPrompt(context),
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
            },
            on: {
                RECOGNISED: [
                    {
                        cond: (context) => yes_no_grammar[context.recResult] === true,
                        target: "appointment_created",
                    },
                    {
                        cond: (context) => yes_no_grammar[context.recResult] === false,
                        target: "who"
                    },
                    { target: ".nomatch" }]
            },
        },
        appointment_created: {
            entry: say("Your appointment has been created!"),
            type: 'final'
        }
    }
})

