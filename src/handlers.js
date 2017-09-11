
/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 */
var Alexa = require('alexa-sdk'),
    DealService = require('./DealService'),
	config = require('./config'),
	Intents = require('./intents'),
	Events = require('./events'),
	Helpers = require('./helpers'),
	Messages = require('./speech'),
    StartHandlers = require('./handlers-startmode');

var STATES = {
    "STARTMODE": '_STARTMODE',
    "DEALMODE": '_DEALMODE'
};

var newSessionRequestHandler =  function(){
    if(Object.keys(this.attributes).length === 0 ){
        this.attributes['dealList'] = {};
        this.attributes['activeDeal'] = 0;
    }
	if (this.event.request.type === Events.LAUNCH_REQUEST) {
		this.emit(Events.LAUNCH_REQUEST);
	} else if (this.event.request.type === "IntentRequest") {
        
        this.handler.state = STATES.STARTMODE;
        console.log("handler state" , this.handler.state);
        var intentName = this.event.request.intent.name;
        console.log("INTENT", intentName);
        this.emitWithState(intentName, true);
    }
};

var launchRequestHandler = function() {
    console.log("Starting launchRequestHandler()");
    this.emit(":ask", Messages.WELCOME, Messages.WELCOME + Messages.DO_YOU_WANT_DEALS);
    console.log("Ending launchRequestHandler()");
};


var amazonYesHandler = function() {
    console.info("Starting amazonYesHandler()");
    this.handler.state = STATES.STARTMODE;
    this.emitWithState(Intents.GET_DEAL, true);
    console.info("Ending amazonYesHandler()");
};

var amazonNoHandler = function() {
    console.info("Starting amazonNoHandler()");
    this.emit(Messages.DO_NOT_GET_DEAL);
    console.info("Ending amazonNoHandler()");
};

var unhandledRequestHandler = function() {
    console.log("Starting unhandledRequestHandler()");
    this.emit(":tell", Messages.UNHANDLED);
    console.log("Ending unhandledRequestHandler()");
};

var sessionEndedRequestHandler = function() {
    console.info("Starting sessionEndedRequestHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("Ending sessionEndedRequestHandler()");
};

var amazonHelpHandler = function() {
    console.info("Starting amazonHelpHandler()");
    this.emit(":ask", Messages.HELP, Messages.HELP);
    console.info("Ending amazonHelpHandler()");
};

var amazonCancelHandler = function() {
    console.info("Starting amazonCancelHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("Ending amazonCancelHandler()");
};

var amazonStopHandler = function() {
    console.info("Starting amazonStopHandler()");
    this.emit(":ask", Messages.STOP, Messages.STOP);
    console.info("Ending amazonStopHandler()");
};


var newSessionHandlers = {};
// Add event newSessionHandlers
newSessionHandlers[Events.NEW_SESSION] = newSessionRequestHandler;
newSessionHandlers[Events.LAUNCH_REQUEST] = launchRequestHandler;
newSessionHandlers[Events.SESSION_ENDED] = sessionEndedRequestHandler;
newSessionHandlers[Events.UNHANDLED] = unhandledRequestHandler;

// Add intent newSessionHandlers
//newSessionHandlers[Intents.GET_DEAL] = getDealHandler;
newSessionHandlers[Intents.AMAZON_CANCEL] = amazonCancelHandler;
newSessionHandlers[Intents.AMAZON_STOP] = amazonStopHandler;
newSessionHandlers[Intents.AMAZON_YES] = amazonYesHandler;
newSessionHandlers[Intents.AMAZON_NO] = amazonNoHandler;
newSessionHandlers[Intents.AMAZON_HELP] = amazonHelpHandler;


var startHandlers = {};

// Add event handlers
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
