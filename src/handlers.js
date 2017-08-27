
/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 */
var AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient'),
	DealService = require('./DealService'),
	config = require('./config'),
	Intents = require('./intents'),
	Events = require('./events'),
	Messages = require('./speech');

var ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
var PERMISSIONS = [ALL_ADDRESS_PERMISSION];

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


	if (this.event.context.System.user.permissions){
		var consentToken = this.event.context.System.user.permissions.consentToken;
		if(!consentToken){
			this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
			//TODO: what should we do if the user does not have location permission set?
			return;
		}
		var deviceId = this.event.context.System.device.deviceId;
		var apiEndpoint = this.event.context.System.apiEndpoint;

		var alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
		var addressRequest = alexaDeviceAddressClient.getCountryAndPostalCode();

		addressRequest.then((addressResponse) => {
			switch(addressResponse.statusCode){
				case 200:
					console.log("Address successfully retrieved, now responding to user.");
	                var address = addressResponse.address;
	                var ADDRESS_MESSAGE = Messages.ADDRESS_AVAILABLE +
	                    `${address['postalCode']}, ${address['countryCode']}}`;
	                this.emit(":tell", ADDRESS_MESSAGE);
					break;
				case 204:
					break;
				case 403:
					break;
				default:
					this.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
			}
		});

	}else {
		//testing from Service Simulator
		address = { "countryCode" : "US","postalCode" : "44124"};
	}
	
	var dealService = new DealService();
	var treatment = 'nails';
	var postalCode = address.postalCode;
    var dealRequest = dealService.searchDeal(postalCode, treatment);

    dealRequest.then((response) => {
        switch(response.statusCode) {
            case 200:
                console.log("Deal successfully retrieved", response.deal);
                var deal = response.deal;

                var DEAL_MESSAGE = Messages.DEAL_AVAILABLE +
                    `${deal['deal_title']}`;

                this.emit(":tell", DEAL_MESSAGE);
                break;
            case 204:
                // This likely means that the user didn't have their address set via the companion app.
                console.log("Successfully requested from the device address API, but no address was returned.");
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
