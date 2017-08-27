/**
 * This file contains constant definitions of intents that we're
 * interested in for our skill.
 *
 */

/**
 * This is a custom intent for our skill. It will indicate
 * When received, we should retrieve the deals's data from
 * the Address API.
 */
var GET_DEAL = "OneshotGetDealsIntent";

/**
 * This is an Amazon built-in intent.
 */
var AMAZON_HELP = "AMAZON.HelpIntent";

/**
 * This is an Amazon built-in intent.
 */
var AMAZON_CANCEL = "AMAZON.CancelIntent";

/**
 * This is an Amazon built-in intent.
 */
var AMAZON_STOP = "AMAZON.StopIntent";

module.exports = {
    "GET_DEAL": GET_DEAL,
    "AMAZON_HELP": AMAZON_HELP,
    "AMAZON_CANCEL": AMAZON_CANCEL,
    "AMAZON_STOP": AMAZON_STOP
};