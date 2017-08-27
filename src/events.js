/**
 * This file contains all the events that we'll be
 * interested in outside of a normal intent.
 */

/**
 * Your skill will receive a NewSession event when a
 * session has been started on your skill. An example of this would be
 * when a user says "open skill blah blah blah".
 */
var NEW_SESSION = "NewSession";

/**
 * Your service receives a LaunchRequest when the user invokes the skill with the
 * invocation name, but does not provide any command mapping to an intent.
*/
var LAUNCH_REQUEST = "LaunchRequest";

/**
 * Your service receives a SessionEndedRequest when a currently open session is closed.
 */
var SESSION_ENDED = "SessionEndedRequest";

/**
 * Your skill will receive an Unhandled event when it receives an intent that
 * it has not registered for.
 */
var UNHANDLED = "Unhandled";

module.exports = {
    "NEW_SESSION": NEW_SESSION,
    "LAUNCH_REQUEST": LAUNCH_REQUEST,
    "SESSION_ENDED": SESSION_ENDED,
    "UNHANDLED": UNHANDLED
};