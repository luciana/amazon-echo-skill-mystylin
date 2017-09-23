
/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 */
var DealService = require('./dealService'),
    Messages = require('./speech'),
    Events = require('./events'),
    Intents = require('./intents'),
    Handlers = require('./handlers');

var newSessionRequestHandler =  function(){
     console.log("Starting newSessionRequestHandler()");
     console.log("newSessionRequestHandler event", this.event);
    if(Object.keys(this.attributes).length === 0 ){
        this.attributes['dealList'] = {};
        this.attributes['activeDeal'] = 0;
    }
    this.handler.state = '_STARTMODE';
	if (this.event.request.type === Events.LAUNCH_REQUEST) {
		this.emit(Events.LAUNCH_REQUEST);
	} else if (this.event.request.type === "IntentRequest") {
        this.emitWithState(this.event.request.intent.name, true);
    }
};

var launchRequestHandler = function() {
    console.log("Starting launchRequestHandler()");

     console.log("launchRequestHandler event", this.event);
     this.handler.state = '_STARTMODE';
     this.emit(":ask",  Messages.WELCOME + Messages.DO_YOU_WANT_DEALS, Messages.WELCOME + Messages.DO_YOU_WANT_DEALS);
     //this.response.speak(Messages.WELCOME + Messages.DO_YOU_WANT_DEALS).listen();
     //this.emit(':responseReady');
    
    //this.emitWithState(Intents.GET_DEAL, true);
    console.log("Ending launchRequestHandler()");
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

module.exports = {
    "newSessionRequestHandler": newSessionRequestHandler,
    "launchRequestHandler": launchRequestHandler,
    "unhandledRequestHandler": unhandledRequestHandler,
    "amazonHelpHandler": amazonHelpHandler,
    "sessionEndedRequestHandler":sessionEndedRequestHandler,
    "amazonStopHandler": amazonStopHandler,
    "amazonCancelHandler": amazonCancelHandler,
};