/**
 * This file contains constant definitions of intents that we're
 * interested in for our skill.
 *
 */

/**
 * This is a custom intent for our skill. It supports dialog mode
 * for identifying the location in which the user wants to learn about
 * a business deal.
 */
var GET_DEAL = "OneshotGetDealsIntent";


/**
 * This is a custom intent to search for a business deal
 * near by where the Alexa device is located. It is not 
 * a dialog model intent.
 */
var GET_DEAL_NEAR_ME = "GetDealsNearMeIntent";

/**
 * This is an Amazon built-in intent.
 */
var AMAZON_HELP = "AMAZON.HelpIntent";

/**
 * This is an Amazon built-in intent.
 */
var AMAZON_CANCEL = "AMAZON.CancelIntent";

/**
 * This is an Amazon built-in intent that
 * helps iterate thru the top 5 deals
 */
var AMAZON_NEXT = "AMAZON.NextIntent";

/**
 * This is an Amazon built-in intent.
 */
var AMAZON_STOP = "AMAZON.StopIntent";

module.exports = {
	"GET_DEAL_NEAR_ME":GET_DEAL_NEAR_ME,
    "GET_DEAL": GET_DEAL,
    "AMAZON_HELP": AMAZON_HELP,
    "AMAZON_CANCEL": AMAZON_CANCEL,
    "AMAZON_NEXT": AMAZON_NEXT,
    "AMAZON_STOP": AMAZON_STOP
};