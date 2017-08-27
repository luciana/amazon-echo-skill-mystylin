/**
 * This file contains a map of messages used by the skill to speak to the user.
 */

const WELCOME = "Welcome to MyStylin Deals Skill!";

const DO_YOU_WANT_DEALS = "Do you want to ask about health and beauty deals around you?";

const NOTIFY_MISSING_PERMISSIONS = "Please enable Location permissions in the Amazon Alexa app.";

const NO_ADDRESS = "It looks like you don't have an address set. You can set your address from the companion app.";

const DEAL_AVAILABLE = "Here is a deal for you ";

const NO_DEAL = "We haven't found any deals for you. Check out the MyStylin mobile app";

const ERROR = "Uh Oh. Looks like something went wrong.";

const LOCATION_FAILURE = "There was an error with the Deals API. Please try again.";

const GOODBYE = "Bye! Thanks for using the Sample Device Address API Skill!";

const UNHANDLED = "We could not understand you, but I will give you a deal near you.";

const HELP = "We can find you deals for Health and Beauty products. Do you want me to tell you about a deal?";

const STOP = "There is nothing to stop. Did you mean to ask something else?";

module.exports = {
    "WELCOME": WELCOME,
    "DO_YOU_WANT_DEALS": DO_YOU_WANT_DEALS,
    "NOTIFY_MISSING_PERMISSIONS": NOTIFY_MISSING_PERMISSIONS,
    "NO_ADDRESS": NO_ADDRESS,
    "DEAL_AVAILABLE": DEAL_AVAILABLE,
    "NO_DEAL": NO_DEAL,
    "ERROR": ERROR,
    "LOCATION_FAILURE": LOCATION_FAILURE,
    "GOODBYE": GOODBYE,
    "UNHANDLED": UNHANDLED,
    "HELP": HELP,
    "STOP": STOP
};