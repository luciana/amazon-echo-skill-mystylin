
/**
 * My Stylin Alexa Skills
 *
 *
 * Author: Luciana Bruscino
 * Copywrite 2016 MyStylin.com
 *
 * See readme for script examples
 */
var Alexa = require('alexa-sdk'),
    config = require('./config'),
    Handlers = require('./handlers');


exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.appId = config.app_id;
    alexa.registerHandlers(Handlers.newSessionHandlers, Handlers.startModeHandlers, Handlers.dealModeHandlers );
    alexa.execute();
};