/**
 * This file contains a map of messages used by the skill to speak to the user.
 */


/**
 * These messages are delivered when the user says Open MyStylin.
 */
const WELCOME = "Welcome to MyStylin Skill!";

const DO_YOU_WANT_DEALS = "Do you want to ask about health and beauty deals near you?";

/**
 * These messages are delivered when user has not given permission to access location of the Alexa device.
 */
const NOTIFY_MISSING_PERMISSIONS = "Please enable Location permissions in the Amazon Alexa app. Or ask MyStylin for deals in your city.";

const NO_ADDRESS = "It looks like you don't have an address set. You can set your address from the companion app.";

/**
 * These messages are delivered when a deal is available from the API based on the treatment and zip code
 */
const SALON_OFFER = " has a good deal.";

const DEAL_EXPIRES =". This offer expires ";


/** 
* This message is delivered when the user says he/she doesn't want to search for deals anymore
*/
const DO_NOT_GET_DEAL = "No problem. You can also search for deals with MyStylin Mobile app.";

/**
 * These messages are delivered when no deal was found
 */
const NO_DEAL = "We haven't found any deals for you. Check out the MyStylin mobile app";

const LOCATION_FAILURE = "We were unable to locate a deal near you. How about if you ask MyStylin for deals in your city? You can say Cleveland, OH.";

/**
 * These messages are delivered on standard situations for the Stop, Cancel, Unhandled intents or API errors. 
 */
const ERROR = "Uh Oh. Looks like something went wrong.  Check out the MyStylin mobile app instead.";

const GOODBYE = "Bye!";

const UNHANDLED = "We could not understand you, but I will give you a deal near you.";

const HELP = "We can find you deals for Health and Beauty products. Do you want me to tell you about a deal near you?";

const STOP = "Ok. Hope you come back. Goodbye!";

module.exports = {
    "WELCOME": WELCOME,
    "DO_YOU_WANT_DEALS": DO_YOU_WANT_DEALS,
    "NOTIFY_MISSING_PERMISSIONS": NOTIFY_MISSING_PERMISSIONS,
    "NO_ADDRESS": NO_ADDRESS,
    "DO_NOT_GET_DEAL": DO_NOT_GET_DEAL,
    "DEAL_EXPIRES": DEAL_EXPIRES,
    "SALON_OFFER": SALON_OFFER,
    "NO_DEAL": NO_DEAL,
    "ERROR": ERROR,
    "LOCATION_FAILURE": LOCATION_FAILURE,
    "GOODBYE": GOODBYE,
    "UNHANDLED": UNHANDLED,    
    "HELP": HELP,
    "STOP": STOP
};