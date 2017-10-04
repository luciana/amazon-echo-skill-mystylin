var Helpers = require('./helpers'),
    Events = require('./events'),
	Messages = require('./speech');

var getDealModeHandler = function() {
    console.log("Attempt to get device location ");
    Helpers.getAlexaAddress(this.event.context).then(
    (location) => {
        try{
            console.log("Address successfully retrieved, from user alexa device", location);
            Helpers.searchDealHandler(this, location, Helpers.getTreatmetSlot(this.event.request));
        }catch(e){              
           this.emit(":tell", Messages.ERROR, Messages.ERROR);
        }
    },
    (failure) => {
        console.log("Reject from get Alexa Address");
        var ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
        var PERMISSIONS = [ALL_ADDRESS_PERMISSION];
        this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
    });
};

// var newSessionRequestHandler = function() {
//     console.log("DEAL MODE DEALing newSessionRequestHandler()");
//     this.handler.state = '';
//     this.emitWithState(Events.NEW_SESSION); // Equivalent to the DEAL Mode NewSession handler
//     console.log("DEAL MODE Ending newSessionRequestHandler()");
// };

var unhandledRequestHandler = function() {
    console.log("DEAL MODE DEALing unhandledRequestHandler()");
    this.emit(":tell", Messages.UNHANDLED);
    console.log("DEAL MODE Ending unhandledRequestHandler()");
};

var sessionEndedRequestHandler = function() {
    console.info("DEAL MODE DEALing sessionEndedRequestHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("DEAL MODE Ending sessionEndedRequestHandler()");
};

var amazonHelpHandler = function() {
    console.info("DEAL MODE DEALing amazonHelpHandler()");
    this.emit(":ask", Messages.HELP, Messages.HELP);
    console.info("DEAL MODE Ending amazonHelpHandler()");
};

var amazonCancelHandler = function() {
    console.info("DEAL MODE DEALing amazonCancelHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("DEAL MODE Ending amazonCancelHandler()");
};

var amazonStopHandler = function() {
    console.info("DEAL MODE DEALing amazonStopHandler()");
    this.emit(":ask", Messages.STOP, Messages.STOP);
    console.info("DEAL MODE Ending amazonStopHandler()");
};


module.exports = {
   // "newSessionRequestHandler": newSessionRequestHandler,
	"getDealModeHandler": getDealModeHandler,
	"unhandledRequestHandler": unhandledRequestHandler,
	"amazonStopHandler": amazonStopHandler,
	"amazonCancelHandler": amazonCancelHandler,
	"amazonHelpHandler": amazonHelpHandler,
	"sessionEndedRequestHandler":sessionEndedRequestHandler
};