var Helpers = require('./helpers'),
    Events = require('./events'),
	Messages = require('./speech');

var getDealHandler = function() {
   console.log(" in delegateSlotCollection current dialogState: "+ JSON.stringify(this.event.request.dialogState));
    if (this.event.request.dialogState === "STARTED") {
     console.log("STARTED");
      var updatedIntent=this.event.request.intent;
      console.log("updated intent", this.event.request.intent);
      this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
        console.log("NOT COMPLETED");
        this.emit(":delegate");
    } else {
      var city = Helpers.getCitySlot(this.event.request);
      console.log("COMPLETED");
      Helpers.getAddressFor(city).then(
        (location) => {
            try{
                console.log("address returned from getaddress promise",location);
                Helpers.searchDealHandler(this, location, Helpers.getTreatmetSlot(this.event.request));
            }catch(e){     
               this.emit(":tell", Messages.ERROR, Messages.ERROR);
            }
        },
        (failure) => {
             this.emit(":tell", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
        });
    }
};

// var newSessionRequestHandler = function() {
//     console.log("START MODE Starting newSessionRequestHandler()");
//     this.handler.state = '';
//     this.emitWithState(Events.NEW_SESSION); // Equivalent to the Start Mode NewSession handler
//     console.log("START MODE Ending newSessionRequestHandler()");
// };

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

// var amazonHelpHandler = function() {
//     console.info("START MODE Starting amazonHelpHandler()");
//     this.emit(":ask", Messages.HELP, Messages.HELP);
//     console.info("START MODE Ending amazonHelpHandler()");
// };

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
        Helpers.deliverDeal(this, dl[activeDeal]);
    }else{
        this.emit(":tell", Messages.ALL_DEALS_DELIVERED);
    }
    console.log("START MODE Ending amazonNextHandler()");
};

module.exports = {
    //"newSessionRequestHandler": newSessionRequestHandler,
	"getDealHandler": getDealHandler,
	"unhandledRequestHandler": unhandledRequestHandler,
	"amazonNextHandler": amazonNextHandler,
	"amazonStopHandler": amazonStopHandler,
	"amazonCancelHandler": amazonCancelHandler,
//	"amazonHelpHandler": amazonHelpHandler,
	"sessionEndedRequestHandler":sessionEndedRequestHandler
};