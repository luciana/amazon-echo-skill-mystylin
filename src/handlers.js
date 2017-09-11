
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

var state = {
    "STARTMODE": '_STARTMODE',
    "DEALMODE": '_DEALMODE'
};

var newSessionRequestHandler =  function(){
    this.handler.state = state.STARTMODE;
    if(Object.keys(this.attributes).length === 0 ){
        this.attributes['dealList'] = {};
        this.attributes['activeDeal'] = 0;
    }
	if (this.event.request.type === Events.LAUNCH_REQUEST) {
		this.emit(Events.LAUNCH_REQUEST);
	} else if (this.event.request.type === "IntentRequest") {
		this.emit(this.event.request.intent.name);
    }
};

var launchRequestHandler = function() {
    console.log("Starting launchRequestHandler()");
    this.emit(":ask", Messages.WELCOME, Messages.WELCOME + Messages.DO_YOU_WANT_DEALS);
    console.log("Ending launchRequestHandler()");
};


var getDealHandler = function () {
    var evt = this.event;
    Helpers.getAddress(evt).then(
        (location) => {
            try{
                console.log("address returned from getaddress promise",location);
                searchDealHandler(this, location, Helpers.getTreatmetSlot(evt.request));
            }catch(e){
               this.emit(":tell", Messages.ERROR, Messages.ERROR);
            }            
        },
        (failure) => {
            var ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
            var PERMISSIONS = [ALL_ADDRESS_PERMISSION];
            this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
        });
};

var searchDealHandler = function(obj, location, treatment){
    var dealService = new DealService();
    var dealRequest = dealService.searchDeal(location, treatment);
    if( dealRequest ) {
        dealRequest.then((response) => {
            console.log(response);
            this.attributes['dealList'] = response;
            switch(response.statusCode) {
                case 200:
                    var deal = response.deal[this.attributes['activeDeal']];
                    deliverDeal(obj,deal);
                    break;
                case 404:
                    //var message = response.message;
                    obj.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
                    break;
                case 204:
                    obj.emit(":tell", Messages.NO_DEAL);
                    break;
                default:
                    obj.emit(":tell", Messages.ERROR, Messages.ERROR);
            }
        });
    }else{
         obj.emit(":tell", Messages.NO_DEAL);
    }
};

var deliverDeal = function(obj,deal){
    var expirationDate = Helpers.convertDate(deal['deal_expiration_date']);
    var DEAL_MESSAGE =  `${deal['salon_title']}` + Messages.SALON_OFFER +
        `${unescape(deal['deal_description'])}` + Messages.DEAL_EXPIRES + 
        expirationDate;
    var imageObj = {
                smallImageUrl: 'https://imgs.xkcd.com/comics/standards.png',
                largeImageUrl: 'https://imgs.xkcd.com/comics/standards.png'
            };
    obj.emit(':tellWithCard', DEAL_MESSAGE, "Promotion", DEAL_MESSAGE, imageObj);
};

var amazonYesHandler = function() {
    console.info("Starting amazonYesHandler()");
    this.emit(Intents.GET_DEAL);
    console.info("Ending amazonYesHandler()");
};

var amazonNoHandler = function() {
    console.info("Starting amazonNoHandler()");
    this.emit(Intents.DO_NOT_GET_DEAL);
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

var amazonNextHandler = function() {
    activeDeal += 1;
    console.info("Starting amazonNextHandler()");
    var dl = this.attributes['dealList'];
    console.log("Deal List ", dl);
    console.log("Deal List count", dl.length);
    if(activeDeal <= dl.length){
        deliverDeal(this, dl[activeDeal]);
    }else{
        this.emit(":tell", Messages.ALL_DEALS_DELIVERED);
    }
    
    console.info("Ending amazonNextHandler()");
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
handlers[Intents.AMAZON_YES] = amazonYesHandler;
handlers[Intents.AMAZON_NO] = amazonNoHandler;
handlers[Intents.AMAZON_HELP] = amazonHelpHandler;

module.exports = handlers;
