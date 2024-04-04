// Importação das bibliotecas necessárias
const { SkillBuilders } = require('ask-sdk-core');
const { Service } = require('googleapis');
const { DateTime } = require('luxon');

// Inicialização do Skill Builder
const skillBuilder = SkillBuilders.custom();

// Escopos e ID do Calendário do Google
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CALENDAR_ID = '';

// Função para criar um evento no Google Calendar
async function createEvent({ day, month, hour, minute, title }) {
    // Autenticação usando as credenciais fornecidas pelo arquivo JSON
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credenciais.json',
        scopes: SCOPES,
    });
    // Criação da instância do calendário
    const calendar = google.calendar({ version: 'v3', auth });

    // Formatação da data e hora do evento usando Luxon
    const eventDateTime = DateTime.fromFormat(`${day} ${month} ${hour}:${minute}`, 'dd LLL HH:mm');

    // Criação do evento com informações de título, início e fim
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

    // Inserção do evento no calendário usando a API do Google Calendar
    const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: event,
    });

    return response.data;
}

// Handler para o pedido de inicialização da skill
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

// Handler para o pedido de criação de evento
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
            // Chamada da função para criar o evento
            const eventData = await createEvent({
                day: day.value,
                month: month.value,
                hour: hour.value,
                minute: minute.value,
                title: title.value
            });

            // Confirmação de sucesso
            const speakOutput = 'Evento criado com sucesso!';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            // Manipulação de erros
            console.error('Erro ao criar evento:', error);
            const speakOutput = 'Desculpe, ocorreu um problema ao criar o evento. Por favor, tente novamente.';
            return handlerInput.respon
                .speak(speakOutput)
                .getResponse();
        }
    }
};

// Handler para o pedido de ajuda
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

// Handlers para os pedidos de cancelamento ou parada
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

// Handler para o pedido de fallback (quando a skill não entende o pedido)
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

// Handler para o pedido de encerramento da sessão
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'cancerlas evendo';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

// Handler para refletir a intenção recebida
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

// Handler para capturar quaisquer exceções não tratadas
const CatchAllExceptionHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`Erro tratado: ${error.message}`);
        const speakOutput = 'Desculpe, houve um problema ao processar sua solicitação. Por favor, tente novamente.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

// Adição de todos os handlers ao Skill Builder
skillBuilder.addRequestHandlers(
    LaunchRequestHandler,
    CreateEventIntentHandler,
    HelpIntentHandler,
    CancelOrStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
);

// Adição do handler para tratamento de erros
skillBuilder.addErrorHandlers(CatchAllExceptionHandler);

// Exportação do handler para a AWS Lambda
exports.handler = skillBuilder.lambda();



