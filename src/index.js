
/**
 * My Stylin Alexa Skills
 *
 *
 * Author: Luciana Bruscino
 * Copywrite 2016 MyStylin.com
 *
 * Example:
 * One-shot model:
 *  User:  "Alexa, ask MyStylin for deals in 44124"
 *  Alexa: "You can have 50% off haircut from Shawn K's spa. This is good until today!"
 *  User:  "Alexa, ask MyStylin for hair deals in 44124"
 *  Alexa: "You can have 50% off haircut from Shawn K's spa. This is good until today!"

 * Dialog model:
 *  User:  "Alexa, ask MyStylin for deals"
 *  Alexa: "Welcome to MyStylin. Which zip code would you like to retrieve deals?"
 *  User:  "44124"
 *  Alexa: "What type of service treatment are you looking for? You can say spa, hair, nails"
 *  User:  "Hair"
 *  Alexa: "You can have 50% off haircut from Shawn K's spa. This is good until today!"
 */
var Alexa = require('alexa-sdk'),
    Deal = require('deal'),
    config = require('./config'),
    Speech = require('speech');


var handlers = {
    'LaunchRequest': function () {
        var speechOutput = "Welcome to My Stylin";
        this.emit(speechOutput);
    },
    'OneshotGetDealsIntent': function () {
        var deal = new Deal();
        deal.get()     
            .then((data) => initialize(data))
            .then((deal) => speechDealText(deal))
            .catch((err) => console.error("ERR WITH DEAL",err));
    },
    'AMAZON.HelpIntent': function() {
        var message = 'We can find you deals for Health and Beauty products. Do you want me to tell you about a deal?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function() {
        this.emit('OneshotGetDealsIntent');
    },
    'Unhandled': function () {
        var speechOutput = 'Say yes to continue, or no to end the game.';
        this.emit(':ask', message, message);
    },
    speechDealText: function(deal){
        var speechOutput = "We have great deals for you.";
        speechOutput += "How about ";
        var dealText = "You can have 50% off haircut from Shawn K's spa. This is good until today!";
            speechOutput += dealText;
        var cardTitle = 'MyStylin Deals';
        var cardContent = dealText;
        var imageObj = {
            smallImageUrl: 'https://imgs.xkcd.com/comics/standards.png',
            largeImageUrl: 'https://imgs.xkcd.com/comics/standards.png'
        };
           this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
        }
};

function initialize(data){
    if ((typeof data != "undefined") || (Object.keys(data).length !== 0) ){
        var data1 = data;
        console.log("data",data);
        console.log("data1",data1);

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
    return deal;
}

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.appId = config.app_id;
    alexa.registerHandlers(handlers);
    alexa.execute();
};