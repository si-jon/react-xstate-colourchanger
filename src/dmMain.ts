import { MachineConfig, send, Action, assign } from "xstate";
import { dmAppointmentMachine } from "./dmAppointment";

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
                    entry: say("What do you want to do?"),
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
                    { target: "nomatch" }
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
            entry: say("To do!"),
            on: { ENDSPEECH: 'init' }
        },
        dmTimer: {
            entry: say("Timer!"),
            on: { ENDSPEECH: 'init' }
        },
    },
})