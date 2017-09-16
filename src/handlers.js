
/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 */
var Alexa = require('alexa-sdk'),
	Intents = require('./intents'),
	Events = require('./events'),
    NewSessionHandlers = require('./handlerNewSession'),
    StartHandlers = require('./handlerStartmode');

var STATES = {
    "STARTMODE": '_STARTMODE',
    "DEALMODE": '_DEALMODE'
};

var newSessionHandlers = {};
// Add event newSessionHandlers
newSessionHandlers[Events.NEW_SESSION] = NewSessionHandlers.newSessionRequestHandler;
newSessionHandlers[Events.LAUNCH_REQUEST] = NewSessionHandlers.launchRequestHandler;
newSessionHandlers[Events.SESSION_ENDED] = NewSessionHandlers.sessionEndedRequestHandler;
newSessionHandlers[Events.UNHANDLED] = NewSessionHandlers.unhandledRequestHandler;
// Add intent newSessionHandlers
newSessionHandlers[Intents.AMAZON_CANCEL] = NewSessionHandlers.amazonCancelHandler;
newSessionHandlers[Intents.AMAZON_STOP] = NewSessionHandlers.amazonStopHandler;
// newSessionHandlers[Intents.AMAZON_YES] = NewSessionHandlers.amazonYesHandler;
// newSessionHandlers[Intents.AMAZON_NO] = NewSessionHandlers.amazonNoHandler;
newSessionHandlers[Intents.AMAZON_HELP] = NewSessionHandlers.amazonHelpHandler;


var startHandlers = {};
// Add event handlers
newSessionHandlers[Events.NEW_SESSION] = NewSessionHandlers.newSessionRequestHandler;
startHandlers[Events.SESSION_ENDED] = StartHandlers.sessionEndedRequestHandler;
startHandlers[Events.UNHANDLED] = StartHandlers.unhandledRequestHandler;
// Add intent handlers
startHandlers[Intents.GET_DEAL] = StartHandlers.getDealHandler;
startHandlers[Intents.AMAZON_NEXT] = StartHandlers.amazonNextHandler;
startHandlers[Intents.AMAZON_CANCEL] = StartHandlers.amazonCancelHandler;
startHandlers[Intents.AMAZON_STOP] = StartHandlers.amazonStopHandler;
var startModeHandlers = Alexa.CreateStateHandler(STATES.STARTMODE,startHandlers);

module.exports = {
    "newSessionHandlers": newSessionHandlers,
    "startModeHandlers": startModeHandlers
};
