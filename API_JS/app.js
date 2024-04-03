const { SkillBuilders } = require('ask-sdk-core');
const { Service } = require('googleapis');
const { DateTime } = require('luxon');

const skillBuilder = SkillBuilders.custom();

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CALENDAR_ID = '';

// Função para criar um evento no Google Calendar
async function createEvent({ day, month, hour, minute, title }) {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: SCOPES,
    });
    const calendar = google.calendar({ version: 'v3', auth });

    const eventDateTime = DateTime.fromFormat(`${day} ${month} ${hour}:${minute}`, 'dd LLL HH:mm');

    const event = {
        summary: title,
        start: {
            dateTime: eventDateTime.toISO(),
            timeZone: 'America/Sao_Paulo',
        },
        end: {
            dateTime: eventDateTime.plus({ hours: 1 }).toISO(),
            timeZone: 'America/Sao_Paulo',
        }
    };

    const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: event,
    });

    return response.data;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Olá! Eu posso ajudá-lo a adicionar eventos ao seu calendário. Em que posso ajudar?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const CreateEventIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CreateEventIntent';
    },
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        const { slots } = request.intent;

        const { day, month, hour, minute, title } = slots;

        try {
            const eventData = await createEvent({
                day: day.value,
                month: month.value,
                hour: hour.value,
                minute: minute.value,
                title: title.value
            });
            const speakOutput = 'Evento criado com sucesso!';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            console.error('Error creating event:', error);
            const speakOutput = 'Desculpe, ocorreu um problema ao criar o evento. Por favor, tente novamente.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Você pode me pedir para criar um evento. Por exemplo, você pode dizer: Crie um evento para amanhã às 10 horas.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const CancelOrStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Até logo!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hmm, não tenho certeza. Você pode dizer Olá ou Ajuda. O que você gostaria de fazer?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Desculpe, não entendi. Como posso ajudar?')
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speakOutput = `Você acionou a intenção ${intentName}.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const CatchAllExceptionHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`Error handled: ${error.message}`);
        const speakOutput = 'Desculpe, houve um problema ao processar sua solicitação. Por favor, tente novamente.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

skillBuilder.addRequestHandlers(
    LaunchRequestHandler,
    CreateEventIntentHandler,
    HelpIntentHandler,
    CancelOrStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
);

skillBuilder.addErrorHandlers(CatchAllExceptionHandler);

exports.handler = skillBuilder.lambda();