
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
    config = require('./config'),
    Handlers = require('./handlers');


exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.appId = config.app_id;
    alexa.registerHandlers(Handlers);
    alexa.execute();
};