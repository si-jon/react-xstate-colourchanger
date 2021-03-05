import { MachineConfig, send, Action, assign } from "xstate";
import { dmAppointmentMachine } from "./dmAppointment";
import { dmColourChangerMachine } from "./dmColourChanger";
import { dmSmartHomeMachine } from "./dmSmartHome";

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

function query(text: string): Action<SDSContext, SDSEvent> {
    console.log("Sending query")
    return send((_context: SDSContext) => ({ type: "QUERY", value: text }))
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },
	    welcome: {
	        on: {
	    	    RECOGNISED: {
	    	        actions: send((context) => ({ type: "QUERY", value: context.recResult })),
	    	        target: 'wait',
                }
            },
            initial: 'prompt',
            states: {
                prompt: {
                    entry: say("Hi! What do you want me to do?"),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: listen(),
                },
            },
	    },
        wait: {
            on: {
                RESPONSE: [
                    {
                        cond: (context, event) => event.value === "appointment",
                        target: 'dmAppointment'
                    },
                    {
                        cond: (context, event) => event.value === "todo_item",
                        target: 'dmTodo'
                    },
                    {
                        cond: (context, event) => event.value === "timer",
                        target: 'dmTimer'
                    },
                    {
                        cond: (context, event) => event.value === "change_colour",
                        target: 'dmColourChanger'
                    },
                    {
                        cond: (context, event) => event.value === "smart_home",
                        target: 'dmSmartHome'
                    },
                    { target: 'nomatch' }
                ],
                RESPONSE_ERROR: {
                    target: 'error'
                }
            }
        },
        error: {
            entry: say("Oh no, an error!"),
            on: { ENDSPEECH: 'init' }
        },
        nomatch: {
            entry: say("Sorry, I don't know how to do this."),
            on: { ENDSPEECH: 'init' }
        },
        dmAppointment: {
            ...dmAppointmentMachine,
            onDone: {
                target: 'init' 
            }
        },
        dmTodo: {
            entry: say("Let's create a to-do item!"),
            on: { ENDSPEECH: 'init' }
        },
        dmTimer: {
            entry: say("Let's set a timer!"),
            on: { ENDSPEECH: 'init' }
        },
        dmColourChanger: {
            ...dmColourChangerMachine,
            onDone: {
                target: 'init' 
            }
        },
        dmSmartHome: {
            ...dmSmartHomeMachine,
            onDone: {
                target: 'init' 
            }
        },
    },
})