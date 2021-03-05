import { MachineConfig, send, Action } from "xstate";

// SRGS parser and example (logs the results to console on page load)
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/smartHomeGrammar'

const loadedGrammar = loadGrammar(grammar)

const sayAction: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: useGrammar(context.recResult)
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function useGrammar(text: string): string {
    const prs = parse(text.split(/\s+/), loadedGrammar)
    const result = prs.resultsForRule(loadedGrammar.$root)[0]
    var output = ""
    console.log(result)
    if (result === undefined)
    {
        output = "Sorry, I couldn't understand that."
    }
    else
    {
        output = "OK! " + result.object + ". " + result.action + "."
    }
    return output
}

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: {
                entry: send('LISTEN'),
            },
        }
    })
}


export const dmSmartHomeMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            initial: "prompt",
            on: { ENDSPEECH: "askAction" },
            states: {
                prompt: { entry: say("Welcome to smart home!") }
            }
        },
        askAction: {
            on: {
                RECOGNISED: [
                    { target: 'doAction' }
                ]
            },
            ...promptAndAsk("What do you want me to do?")
        },
        doAction: {
            entry: sayAction,
            type: 'final'
        }
    }
})
