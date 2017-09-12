
/**
 * My Stylin Alexa Skills
 *
 *
 * Author: Luciana Bruscino
 * Copywrite 2016 MyStylin.com
 *
 * Example:
 * One-shot model:
 *  User:  "Alexa, ask MyStylin for deals near me"
 *  Alexa: "Salon K offers you 50% off haircut from Shawn K's spa. This is good until today!"
 *  User:  "Alexa, ask MyStylin for hair deals near me"
 *  Alexa: "Salon K offers you 50% off haircut from Shawn K's spa. This is good until today!"
 *  User: Alexa, ask MyStylin for hair deals near me
 *  Alexa: I can't identify your location. Please enable it from the Alexa App. 
 
 * Dialog model:
 * User: Alexa, open MyStylin
 * Alexa: Welcome to MyStylin. You can get health and beauty deals. Do you want learn about a deal?
 * User: Yes
 * Alexa: Get 10 percent off hair products from salon K.
 */
var Alexa = require('alexa-sdk'),
    config = require('./config'),
    Handlers = require('./handlers');


exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.appId = config.app_id;
    alexa.registerHandlers(Handlers.newSessionHandlers, Handlers.startModeHandlers );
    alexa.execute();
};