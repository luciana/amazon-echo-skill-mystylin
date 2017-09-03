
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
	var dealService = new DealService();
	var cityName = Helpers.getCitySlot(request);
	var defaultAddress = { "countryCode" : "US","postalCode" : 44139, "lat": 41.3897764, "lng":-81.44122589999999};
	var address ={};
	if(cityName){
		console.log("recognized city name", cityName);
		address = Helpers.getGoogleAddress(cityName);
	}else{
		console.log("attempt to get device location ");
		address = Helpers.getAlexaAddress(this.event.context);
		if (!address){
			var ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
			var PERMISSIONS = [ALL_ADDRESS_PERMISSION];
			this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
		}
	}
	if(!address){
		address = defaultAddress;
	}
	
	console.log("Address object ", address);
    var dealRequest = dealService.searchDeal(address, Helpers.getTreatmetSlot(request));

    dealRequest.then((response) => {
    	console.log(response);
        switch(response.statusCode) {
            case 200:              
                var deal = response.deal;                
                var DEAL_MESSAGE =  `${deal['salon_title']}` + Messages.SALON_OFFER +
                    `${deal['deal_title']}` + Messages.DEAL_GOOD_UNTIL + 
                    `${deal['deal_expiration_date']}`

                this.emit(":tell", DEAL_MESSAGE);
                break;
            case 404:
            	//var message = response.message;
            	this.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
                //this.emit(":tell", Messages.NO_DEAL);
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
