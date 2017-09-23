var Helpers = require('./helpers'),
	DealService = require('./dealService'),
	Messages = require('./speech');

var getDealHandler = function() {
    //console.log("get deal handler event", this.event);
    //   console.log("current dialogState: "+ JSON.stringify(this.event.request.dialogState));
    var filledSlots = delegateSlotCollection.call(this);
    console.log("current slots: "+JSON.stringify(filledSlots));
    var evt = this.event;
    Helpers.getAddress(evt).then(
        (location) => {
            try{
                console.log("address returned from getaddress promise",location);
                console.log("getDealHandler attributes ", this.attributes);
                searchDealHandler(this, location, Helpers.getTreatmetSlot(evt.request));
                
                
            }catch(e){
               this.emit(":tell", Messages.NO_DEAL, Messages.NO_DEAL);
            }
        },
        (failure) => {
            var ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
            var PERMISSIONS = [ALL_ADDRESS_PERMISSION];
            this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
        });
};

var delegateSlotCollection = function(){
  console.log("in delegateSlotCollection");
    console.log("current dialogState: "+ JSON.stringify(this.event.request.dialogState));
    if (this.event.request.dialogState === "STARTED") {
      console.log("in Beginning");
      var updatedIntent=this.event.request.intent;
       console.log(" STARTED updatedIntent: "+ JSON.stringify(updatedIntent));
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
      console.log("in not COMPLETED");
      // return a Dialog.Delegate directive with no updatedIntent property.
      this.emit(":delegate");
    } else {
      console.log("in completed");
      console.log("returning: "+ JSON.stringify(this.event.request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return this.event.request.intent;
    }
};

var unhandledRequestHandler = function() {
    console.log("START MODE Starting unhandledRequestHandler()");
    this.emit(":tell", Messages.UNHANDLED);
    console.log("START MODE Ending unhandledRequestHandler()");
};

var sessionEndedRequestHandler = function() {
    console.info("START MODE Starting sessionEndedRequestHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("START MODE Ending sessionEndedRequestHandler()");
};

var amazonHelpHandler = function() {
    console.info("START MODE Starting amazonHelpHandler()");
    this.emit(":ask", Messages.HELP, Messages.HELP);
    console.info("START MODE Ending amazonHelpHandler()");
};

var amazonCancelHandler = function() {
    console.info("START MODE Starting amazonCancelHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("START MODE Ending amazonCancelHandler()");
};

var amazonStopHandler = function() {
    console.info("START MODE Starting amazonStopHandler()");
    this.emit(":ask", Messages.STOP, Messages.STOP);
    console.info("START MODE Ending amazonStopHandler()");
};

var amazonNextHandler = function() {
	console.log("START MODE Starting amazonNextHandler()");
	console.log("attributes ", this.attributes);
    var activeDeal = this.attributes['activeDeal'];
    activeDeal += 1;
    console.log("Deal List activeDeal", activeDeal);
    var dl = this.attributes['dealList'];
    console.log("Deal List ", dl);
    console.log("Deal List count", dl.length);
    if(activeDeal <= dl.length){
        deliverDeal(this, dl[activeDeal]);
    }else{
        this.emit(":tell", Messages.ALL_DEALS_DELIVERED);
    }
    console.log("START MODE Ending amazonNextHandler()");
};


var searchDealHandler = function(obj, location, treatment){
	console.log("START MODE Starting searchDealHandler()");
    var dealService = new DealService();
    var dealRequest = dealService.searchDeal(location, treatment);
    if( dealRequest ) {
        dealRequest.then((response) => {
            //console.log(response);
            //console.log("attributes ", obj.attributes);
            //obj.attributes['dealList'] = response.deal;
            switch(response.statusCode) {
                case 200:
                    console.log('response 200');
                    var deal = response.deal[0];
                   // deliverDeal(obj,deal);
                    var expirationDate = Helpers.convertDate(deal['deal_expiration_date']);
    var DEAL_MESSAGE =  `${deal['salon_title']}` + Messages.SALON_OFFER +
        `${unescape(deal['deal_description'])}` + Messages.DEAL_EXPIRES + 
        expirationDate;
    var i = deal['deal_image_url'];

    var imageObj = {
                smallImageUrl: 'https://s3.amazonaws.com/mystylin-alexa-skill-assets/mystylin_512.png',
                largeImageUrl: 'https://s3.amazonaws.com/mystylin-alexa-skill-assets/mystylin_512.png'
            };
    //obj.emit(':tellWithCard', DEAL_MESSAGE, "Promotion", DEAL_MESSAGE, imageObj);
            obj.response.speak(DEAL_MESSAGE);
            obj.emit(":responseReady");
    return DEAL_MESSAGE;
                    break;
                case 404:
                    //var message = response.message;
                    //obj.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
                    return Messages.LOCATION_FAILURE;
                    break;
                case 204:
                    //obj.emit(":tell", Messages.NO_DEAL);

                    return Message.NO_DEAL;
                    break;
                default:
                    return Messages.ERROR;
                    //obj.emit(":tell", Messages.ERROR, Messages.ERROR);
            }
        });
    }else{
         //obj.emit(":tell", Messages.NO_DEAL);
         return Message.NO_DEAL;
    }
    //console.log("START MODE Ending searchDealHandler()");
};

var deliverDeal = function(obj,deal){
    console.log('deliverDeal');
    var expirationDate = Helpers.convertDate(deal['deal_expiration_date']);
    var DEAL_MESSAGE =  `${deal['salon_title']}` + Messages.SALON_OFFER +
        `${unescape(deal['deal_description'])}` + Messages.DEAL_EXPIRES + 
        expirationDate;
    //var i = deal['deal_image_url'];
    console.log(DEAL_MESSAGE);
    var imageObj = {
                smallImageUrl: 'https://s3.amazonaws.com/mystylin-alexa-skill-assets/mystylin_512.png',
                largeImageUrl: 'https://s3.amazonaws.com/mystylin-alexa-skill-assets/mystylin_512.png'
            };
    obj.emit(':tellWithCard', DEAL_MESSAGE, "Promotion", DEAL_MESSAGE, imageObj);
  
};



module.exports = {
    //"newSessionRequestHandler": newSessionRequestHandler,
	"getDealHandler": getDealHandler,
	"unhandledRequestHandler": unhandledRequestHandler,
	"amazonNextHandler": amazonNextHandler,
	"amazonStopHandler": amazonStopHandler,
	"amazonCancelHandler": amazonCancelHandler,
	"amazonHelpHandler": amazonHelpHandler,
	"sessionEndedRequestHandler":sessionEndedRequestHandler
};