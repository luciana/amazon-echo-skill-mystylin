
/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 */
var DealService = require('./DealService'),
	config = require('./config'),
	Intents = require('./intents'),
	Events = require('./events'),
	Helpers = require('./helpers'),
	Messages = require('./speech');

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
    console.log("Starting launchRequestHandler()");
    this.emit(":ask", Messages.WELCOME, Messages.WELCOME + Messages.DO_YOU_WANT_DEALS);
    console.log("Ending launchRequestHandler()");
};


var getDealHandler = function () {
	console.log("Starting getDealHandler()");
	var request = this.event.request;
	//var treatment = Helpers.getSlot(request, "treatment");
	var address = Helpers.getAddress(this.event.context);
	//var postalCode = address.postalCode;
	//console.log("deal search for ", treatment, postalCode);
	var cityName = Helpers.getCitySlot(request);
	console.log("deal search in city ", cityName);

	var dealService = new DealService();
    var dealRequest = dealService.searchDeal(
								    	address.postalCode, 
								    	Helpers.getTreatmetSlot(request));

    dealRequest.then((response) => {
        switch(response.statusCode) {
            case 200:
                console.log("Deal successfully retrieved", response.deal.results[0]);
                var deal = response.deal.results[0];

                var DEAL_MESSAGE =  `${deal['salon_title']}` + Messages.SALON_OFFER +
                    `${deal['deal_title']}` + Messages.DEAL_GOOD_UNTIL + 
                    `${deal['deal_expiration_date']}`

                this.emit(":tell", DEAL_MESSAGE);
                break;
            case 204:
                this.emit(":tell", Messages.NO_DEAL);
                break;
            default:
                this.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
        }

        console.info("Ending getAddressHandler()");
    });
		console.log("Ending getDealHandler()");
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


var handlers = {};
// Add event handlers
handlers[Events.NEW_SESSION] = newSessionRequestHandler;
handlers[Events.LAUNCH_REQUEST] = launchRequestHandler;
handlers[Events.SESSION_ENDED] = sessionEndedRequestHandler;
handlers[Events.UNHANDLED] = unhandledRequestHandler;

// Add intent handlers
handlers[Intents.GET_DEAL] = getDealHandler;
handlers[Intents.AMAZON_CANCEL] = amazonCancelHandler;
handlers[Intents.AMAZON_STOP] = amazonStopHandler;
handlers[Intents.AMAZON_HELP] = amazonHelpHandler;

module.exports = handlers;
