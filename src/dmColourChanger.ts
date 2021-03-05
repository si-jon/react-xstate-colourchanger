import { MachineConfig, send, Action } from "xstate";

// SRGS parser and example (logs the results to console on page load)
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/warmupGrammar'

const gram = loadGrammar(grammar)
const input = "do be do be do"
const prs = parse(input.split(/\s+/), gram)
const result = prs.resultsForRule(gram.$root)[0]

console.log(result)

const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
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


export const dmColourChangerMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            initial: "prompt",
            on: { ENDSPEECH: "askColour" },
            states: {
                prompt: { entry: say("Let's change the colour!") }
            }
        },
        askColour: {
            on: {
                RECOGNISED: [
                    { target: 'stop', cond: (context) => context.recResult === 'stop' },
                    { target: 'repaint' }]
            },
            ...promptAndAsk("Tell me the colour")
        },
        stop: {
            entry: say("Ok"),
            always: 'init'
        },
        repaint: {
            initial: 'prompt',
            states: {
                prompt: {
                    entry: sayColour,
                    on: { ENDSPEECH: 'repaint' }
                },
                repaint: {
                    entry: 'changeColour',
                    type: 'final'
                }
            }
        }
    }
})
