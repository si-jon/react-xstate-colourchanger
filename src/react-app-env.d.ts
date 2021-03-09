/// <reference types="react-scripts" />

declare module 'react-speech-kit';

interface SDSContext {
    recResult: string;
    nluData: any;
    ttsAgenda: string;
    person: string;
    day: string;
    wholeDay: bool;
    time: string;
    query: string;
    snippet: string;
    repromptCount: integer;
}

type SDSEvent =
    | { type: 'CLICK' }
    | { type: 'RECOGNISED' }
    | { type: 'ASRRESULT', value: string }
    | { type: 'ENDSPEECH' }
    | { type: 'LISTEN' }
    | { type: 'STOP_LISTEN' }
    | { type: 'SPEAK', value: string }
    | { type: 'QUERY', value: string }
    | { type: 'RESPONSE', value: string }
    | { type: 'RESPONSE_ERROR', value: string }
    | { type: 'TIMER' };
