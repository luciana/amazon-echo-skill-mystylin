var Helpers = require('./helpers'),
	DealService = require('./DealService'),
	Messages = require('./speech');

var getDealHandler = function() {
    var evt = this.event;
    Helpers.getAddress(evt).then(
        (location) => {
            try{
                console.log("address returned from getaddress promise",location);
                console.log("attributes ", this.attributes);
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
    var activeDeal = 1;
    console.log("START MODE Starting amazonNextHandler()");
    // var dl = this.attributes['dealList'];
    // console.log("Deal List ", dl);
    // console.log("Deal List count", dl.length);
    // if(activeDeal <= dl.length){
    //     deliverDeal(this, dl[activeDeal]);
    // }else{
    //     this.emit(":tell", Messages.ALL_DEALS_DELIVERED);
    // }    
    console.log("START MODE Ending amazonNextHandler()");
};


var searchDealHandler = function(obj, location, treatment){
	console.log("START MODE Starting searchDealHandler()");
    var dealService = new DealService();
    var dealRequest = dealService.searchDeal(location, treatment);
    if( dealRequest ) {
        dealRequest.then((response) => {
            console.log(response);
            //this.attributes['dealList'] = response;
            switch(response.statusCode) {
                case 200:
                    var deal = response.deal[0];
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
    console.log("START MODE Ending searchDealHandler()");
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


module.exports = {
	"getDealHandler": getDealHandler,
	"unhandledRequestHandler": unhandledRequestHandler,
	"amazonNextHandler": amazonNextHandler,
	"amazonStopHandler": amazonStopHandler,
	"amazonCancelHandler": amazonCancelHandler,
	"amazonHelpHandler": amazonHelpHandler,
	"sessionEndedRequestHandler":sessionEndedRequestHandler
};