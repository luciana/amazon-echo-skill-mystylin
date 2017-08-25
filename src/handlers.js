
/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 */
var AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient'),
	Deal = require('deal'),
	config = require('./config'),
	Intents = require('./Intents'),
	Events = require('./Events'),
	Messages = require('./Messages');

var ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
var PERMISSIONS = [ALL_ADDRESS_PERMISSION];


/* New Session Handler */

var newSessionRequestHandler =  function(){
	console.log("Starting newSessionHandler()");

	if (this.event.request.type === Events.LAUNCH_REQUEST) {
		this.emit(Events.LAUNCH_REQUEST);
	} else if (this.event.request.type === "IntentRequest") {
		this.emit(this.event.request.intent.name);
    }
    console.log("Ending newSessionHandler()");
};

var launchRequestHandler = function() {
    console.info("Starting launchRequestHandler()");
    this.emit(":ask", Messages.WELCOME + Messages.DO_YOU_WANT_DEALS, Messages.DO_YOU_WANT_DEALS);
    console.info("Ending launchRequestHandler()");
};


var oneshotGetDealsIntent = function () {
        var deal = new Deal();
        var self = this;
        deal.get()     
            .then((data) => initialize(data, deal))
            .then((deal) => speechDealText(deal))
            .catch((err) => console.error("ERR WITH DEAL",err));


        var  speechDealText = function(deal){
            console.log('deal', deal);
            console.log("device id", self.event.context.System.device.deviceId);
            var speechOutput = "We have great deals for you.";
            speechOutput += "How about ";
            var dealText = "You can have 50% off haircut from Shawn K's spa. This is good until today!";
                speechOutput += dealText;
            var cardTitle = deal.name;
            var cardContent = deal.description;
            var imageObj = {
                smallImageUrl: 'https://imgs.xkcd.com/comics/standards.png',
                largeImageUrl: 'https://imgs.xkcd.com/comics/standards.png'
            };
              self.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
        };

        var initialize = function(data, deal){
		    if ((typeof data != "undefined") || (Object.keys(data).length !== 0) ){
		        var data1 = data[0];
		        try {
		            deal.id = data1.id;
		            deal.name = data1.name;
		            deal.description = data1.description;
		            deal.imageUrl = data1.imageUrl;
		            deal.treatment = data1.treatment;
		            deal.expireDateTime = data1.expireDateTime;
		        }catch(e){
		            console.log("ERROR INITIALIZING DEAL DATA");
		        }
		    }
		     console.log("data1",deal);
		    return deal;
		};
};

var unhandledRequestHandler = function() {
    console.info("Starting unhandledRequestHandler()");
    this.emit(":tell", Messages.UNHANDLED);
    // this.emit('OneshotGetDealsIntent');
    console.info("Ending unhandledRequestHandler()");
};

var amazonHelpHandler = function() {
    console.info("Starting amazonHelpHandler()");
    this.emit(":ask", Messages.HELP, Messages.HELP);
    console.info("Ending amazonHelpHandler()");
};

/**
 * This is the handler for the Amazon cancel built in intent.
 */
var amazonCancelHandler = function() {
    console.info("Starting amazonCancelHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("Ending amazonCancelHandler()");
};

/**
 * This is the handler for the Amazon stop built in intent.
 */
var amazonStopHandler = function() {
    console.info("Starting amazonStopHandler()");
    this.emit(":ask", Messages.STOP, Messages.STOP);
    console.info("Ending amazonStopHandler()");
};


var handlers = {};
// Add event handlers
handlers[Events.NEW_SESSION] = newSessionRequestHandler;
handlers[Events.LAUNCH_REQUEST] = launchRequestHandler;
handlers[Events.SESSION_ENDED] = sessionEndedRequestHandler;
handlers[Events.UNHANDLED] = unhandledRequestHandler;

// Add intent handlers
handlers[Intents.GET_DEALS] = oneshotGetDealsIntent;
handlers[Intents.AMAZON_CANCEL] = amazonCancelHandler;
handlers[Intents.AMAZON_STOP] = amazonStopHandler;
handlers[Intents.AMAZON_HELP] = amazonHelpHandler;

module.exports = handlers;
