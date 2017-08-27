
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


	if (this.event.context.System.user){

	}else
	{
		
	}
	//FIX: can not test this from the emulator - get error
	// var consentToken = this.event.context.System.user.permissions.consentToken;
	// if(!consentToken){
	// 	this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
	// 	//TODO: what should we do if the user does not have location permission set?
	// 	return;
	// }
	
	var dealService = new DealService();
    var dealRequest = dealService.getDeals();

    dealRequest.then((response) => {
        switch(response.statusCode) {
            case 200:
                console.log("Deal successfully retrieved, now responding to user.");
                var deal = response.deal;

                var DEAL_MESSAGE = Messages.DEAL_AVAILABLE +
                    `${deal['name']}`;

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
  //       var deal = new Deal();
  //       var self = this;
  //       deal.get()     
  //           .then((data) => initialize(data, deal))
  //           .then((deal) => speechDealText(deal))
  //           .catch((err) => console.error("ERR WITH DEAL",err));


  //       var  speechDealText = function(deal){
  //           console.log('deal', deal);
  //           console.log("device id", self.event.context.System.device.deviceId);
  //           var speechOutput = "We have great deals for you.";
  //           speechOutput += "How about ";
  //           var dealText = "You can have 50% off haircut from Shawn K's spa. This is good until today!";
  //               speechOutput += dealText;
  //           var cardTitle = deal.name;
  //           var cardContent = deal.description;
  //           var imageObj = {
  //               smallImageUrl: 'https://imgs.xkcd.com/comics/standards.png',
  //               largeImageUrl: 'https://imgs.xkcd.com/comics/standards.png'
  //           };
  //             self.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
  //       };

  //       var initialize = function(data, deal){
		//     if ((typeof data != "undefined") || (Object.keys(data).length !== 0) ){
		//         var data1 = data[0];
		//         try {
		//             deal.id = data1.id;
		//             deal.name = data1.name;
		//             deal.description = data1.description;
		//             deal.imageUrl = data1.imageUrl;
		//             deal.treatment = data1.treatment;
		//             deal.expireDateTime = data1.expireDateTime;
		//         }catch(e){
		//             console.log("ERROR INITIALIZING DEAL DATA");
		//         }
		//     }
		//      console.log("data1",deal);
		//     return deal;
		// };
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
