
/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 */
var Alexa = require('alexa-sdk'),
	Intents = require('./intents'),
	Events = require('./events'),
    NewSessionHandlers = require('./handlerNewSession'),
    StartHandlers = require('./handlerStartmode'),
    DealHandlers = require('./handlerDealmode');

var STATES = {
    "STARTMODE": '_STARTMODE',
    "DEALNEARMODE": '_DEALNEARMODE'
};

var newSessionHandlers = {};
newSessionHandlers[Events.NEW_SESSION] = NewSessionHandlers.newSessionRequestHandler;
newSessionHandlers[Events.LAUNCH_REQUEST] = NewSessionHandlers.launchRequestHandler;
newSessionHandlers[Events.SESSION_ENDED] = NewSessionHandlers.sessionEndedRequestHandler;
newSessionHandlers[Events.UNHANDLED] = NewSessionHandlers.unhandledRequestHandler;
newSessionHandlers[Intents.AMAZON_CANCEL] = NewSessionHandlers.amazonCancelHandler;
newSessionHandlers[Intents.AMAZON_STOP] = NewSessionHandlers.amazonStopHandler;
newSessionHandlers[Intents.AMAZON_HELP] = NewSessionHandlers.amazonHelpHandler;


var startHandlers = {};
startHandlers[Events.SESSION_ENDED] = StartHandlers.sessionEndedRequestHandler;
startHandlers[Events.UNHANDLED] = StartHandlers.unhandledRequestHandler;
startHandlers[Intents.GET_DEAL] = StartHandlers.getDealHandler;
startHandlers[Intents.AMAZON_NEXT] = StartHandlers.amazonNextHandler;
startHandlers[Intents.AMAZON_CANCEL] = StartHandlers.amazonCancelHandler;
startHandlers[Intents.AMAZON_STOP] = StartHandlers.amazonStopHandler;
var startModeHandlers = Alexa.CreateStateHandler(STATES.STARTMODE,startHandlers);

var dealHandlers = {};
dealHandlers[Events.SESSION_ENDED] = DealHandlers.sessionEndedRequestHandler;
dealHandlers[Events.UNHANDLED] = DealHandlers.unhandledRequestHandler;
dealHandlers[Intents.GET_DEAL_NEAR_ME] = DealHandlers.getDealModeHandler;
dealHandlers[Intents.AMAZON_CANCEL] = DealHandlers.amazonCancelHandler;
dealHandlers[Intents.AMAZON_STOP] = DealHandlers.amazonStopHandler;
var dealModeHandlers = Alexa.CreateStateHandler(STATES.DEALNEARMODE,dealHandlers);

module.exports = {
    "newSessionHandlers": newSessionHandlers,
    "startModeHandlers": startModeHandlers,
    "dealModeHandlers": dealModeHandlers
};
