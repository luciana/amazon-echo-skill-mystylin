
var Speech = function (){};

/**
 * This function returns the welcome text:
 * 'Alexa, start pilates class'.
 */

Speech.prototype.accountSetupError = function (response){
    var speechOutput = "You must have an ALotOfPilates.com free account to use this skill. Please use the Alexa app to link your Amazon account with your ALotOfPilates Account.";
    response.emit(':tell', speechOutput);
};




module.exports = new Speech();