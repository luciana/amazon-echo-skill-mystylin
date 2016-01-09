
/**
 * A Lot Of Pilates Alexa Skills
 *
 * Start a pilates class from Amazon Echo. This code communicates with A Lot Of Pilates(ALOP) API to start a pilates class. One slot is available where you can specify the duration of the class. Get fit with Amazon Alexa!
 *
 * Author: Luciana Bruscino
 * Copywrite 2016 ALotOfPilates.com
 *
 * Example:
 * One-shot model:
 *  User:  "Alexa, start a pilates class"
 *  Alexa: "Welcome to A Lot Of Pilates! Ready to feel great? say start class ...""
 * Dialog model: (Not yet implemented)
 *  User:  "Alexa, start a pilates class"
 *  Alexa: "Welcome to A Lot Of Pilates! How long do you prefer your class to be?"
 *  User:  "30 minutes"
 *  Alexa: "Let's get started. When ready say start class"
 *  User:  "start class"
 */

/**
 * App ID for the skill
 * Find it at : https://console.aws.amazon.com/lambda/home
 */
var APP_ID = ''; //get an APP ID - i.e amzn1.echo-sdk-ams.app.xxxxxx

/**
 * Get an API_KEY from A Lot Of Pilates Developer site 
 * This will allow to retrieve Pilates classes
 * curl "https://api-2445581417326.apicast.io:443/api/v1/workouts/680" -H'api_key: <your alop_api_key>'
 **/
 var API_KEY =''; //get an api key from https://a-lot-of-pilates.3scale.net/docs and store in a config.js file


var https = require('https'),
    alexaDateUtil = require('./alexaDateUtil'),
    config = require('./config');


/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * ALotOfPilates is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var ALotOfPilates = function () {
    AlexaSkill.call(this, config.app_id); //I store the APP_ID in a config file instead of global variable (APP_ID)
};

// Extend AlexaSkill
ALotOfPilates.prototype = Object.create(AlexaSkill.prototype);
ALotOfPilates.prototype.constructor = ALotOfPilates;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

ALotOfPilates.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

ALotOfPilates.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

ALotOfPilates.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
  
};

/**
 * override intentHandlers to map intent handling functions.
 */
ALotOfPilates.prototype.intentHandlers = {
    "OneshotStartPilatesClassIntent": function (intent, session, response) {       
        handleOneshotStartPilatesClassRequest(intent, session, response);
    },

    "DialogStartPilatesClassIntent": function (intent, session, response) {
        // Determine if this turn is for duration, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        // var durationSlot = intent.slots.Duration;
        // var dateSlot = intent.slots.Date;
        // if (durationSlot && durationSlot.value) {
        //     handleDurationDialogRequest(intent, session, response);
        // } else if (dateSlot && dateSlot.value) {
        //     handleDateDialogRequest(intent, session, response);
        // } else {
        //     handleNoSlotDialogRequest(intent, session, response);
        // }
         handleOneshotStartPilatesClassRequest(intent, session, response);
    },

    "SupportedDurationsIntent": function (intent, session, response) {
        handleSupportedDurationsRequest(intent, session, response);
    },

    "GetNextExerciseIntent": function (intent, session, response) {
        handleGetNextExerciseIntentRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StartOverIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- ALotOfPilates Domain Specific Business Logic --------------------------

// Duration options for a Dialog model - one slot model
var DURATIONS = {
    '10 minutes': 1,
    '30 minutes': 2,
    '50 minutes': 3
};

function handleWelcomeRequest(response) {
   
        var speechOutput = {
            speech: "<speak>Welcome to A Lot Of Pilates - Ready to feel great?. " + "<audio src='https://s3.amazonaws.com/ask-storage/tidePooler/OceanWaves.mp3'/>" + 
            "When ready say start class" + "</speak>",
            //speech: "<speak>Welcome to A Lot Of Pilates - Ready to feel great ? " +
            //".<break time=\"1s\" />. " + "When ready say start class" + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "Ready to feel great? " + "I can lead you through a pilates sequence. Just say start class when ready.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleEndClassRequest(){
    return "Good job. You are all done. Hope you feel as great as me! Visit ALotOfPilates.com for video classes.";
}

function handleHelpRequest(response) {
    var repromptText = "How long do you want your class to be?";
    var speechOutput = "I can lead you through a pilates sequence " + "Or you can say exit. " + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the case where the user asked or for, or is otherwise being with supported cities
 */
function handleSupportedDurationsRequest(intent, session, response) {
    // get city re-prompt
    var repromptText = "What is your prefered class duration?";
    var speechOutput = "Currently, You can take class that lasts  " + getAllDurationText() + " minutes" + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the dialog step where the user provides a duration for the pilates class
 */
function handleDurationDialogRequest(intent, session, response) {

    var durationStation = getDurationFromIntent(intent, false),
        repromptText,
        speechOutput;
    if (durationStation.error) {
        repromptText = "Currently, You can take class that lasts   " + getAllDurationText() + "What is your prefered class duration?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = durationStation.duration ? "I'm sorry, I don't have any data for " + durationStation.duration + ". " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a date yet, go to date. If we have a date, we perform the final request
    if (session.attributes.date) {
        //getPilatesSequenceResponse(durationStation, session.attributes.date, response);
    } else {
        // set duration in session and prompt for date
        //session.attributes.duration = durationStation;
        //speechOutput = "For which date?";
        //repromptText = "How long would you like your class to last " + durationStation.duration + "?";

        //response.ask(speechOutput, repromptText);
    }
}

/**
 * Handles the dialog step where the user provides a date
 */
function handleDateDialogRequest(intent, session, response) {

    var date = getDateFromIntent(intent),
        repromptText,
        speechOutput;
    if (!date) {
        repromptText = "Please try again saying a day of the week, for example, Saturday. " + "For which date would you like tide information?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a city yet, go to city. If we have a city, we perform the final request
    if (session.attributes.duration) {
       // getPilatesSequenceResponse(session.attributes.duration, date, response);
    } else {
        // The user provided a date out of turn. Set date in session and prompt for city
        //session.attributes.date = date;
        //speechOutput = "For which duration would you like  " + date.displayDate + "?";
        //repromptText = "For which duration?";

        //response.ask(speechOutput, repromptText);
    }
}

/**
 * Handle no slots, or slot(s) with no values.
 * In the case of a dialog based skill with multiple slots,
 * when passed a slot with no value, we cannot have confidence
 * it is the correct slot type so we rely on session state to
 * determine the next turn in the dialog, and reprompt.
 */
function handleNoSlotDialogRequest(intent, session, response) {
    if (session.attributes.duration) {
        // get date re-prompt
        var repromptText = "Please try again saying how long you want the class to be, for example, 30 minutes. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    } else {
        // get duration re-prompt
        handleSupportedDurationsRequest(intent, session, response);
    }
}

function handleGetNextExerciseIntentRequest(intent, session, response){

    console.log("session", session);
    console.log("response", response);
}

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, start a Pilates class'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotStartPilatesClassRequest(intent, session, response) {

    console.log("START OneshotStartPilatesClassIntent");
    // Determine duration, using default if none provided
    var durationStation = getDurationFromIntent(intent, true),
        repromptText,
        speechOutput;
    if (durationStation.error) {
        // invalid duration. move to the dialog
        repromptText = "Currently, You can take class that lasts   " + getAllDurationText() + "What is your prefered class duration?";
        // if we received a value for the incorrect duration, repeat it to the user, otherwise we received an empty slot and assume default
        speechOutput = durationStation.duration ? "I'm sorry, I don't have any data for " + durationStation.duration + ". " + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }
    console.log("Duration Station " + durationStation.duration + " id " + durationStation.duration_id);
    var type = 2;
    // Determine custom date
    //var date = getDateFromIntent(intent);
    //if (!date) {
        // Invalid date. set city in session and prompt for date
        //session.attributes.duration = durationStation;
        //repromptText = "Please try again saying a day of the week, for example, Saturday. " + "For which date would you like tide information?";
        //speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        //response.ask(speechOutput, repromptText);
        //return;
    //}

    // all slots filled, either from the user or by default values. Move to final request
    getPilatesSequenceResponse(durationStation, type, response);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getPilatesSequenceResponse(duration, type, response) {

    console.log("GET Pilates Sequence");
    // Issue the request, and respond to the user
    makeALOPRequest(duration, type, function alopResponseCallback(err, alopAPIResponse) {
        var speechOutput;
        
        if (err) {
            speechOutput = {
                speech:"Sorry, the A Lot Of Pilates service is experiencing a problem. Please access ALotOfPilates.com to take video classes now.",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };     
            response.tell(speechOutput);
        } else {            

            if(alopAPIResponse.poses.length > 0){ 
                console.log("SUCESSFUL Get on Pilates Sequence");                              
                teachClass(alopAPIResponse, response);                   
            }else{
                speechOutput = {
                    speech:"Sorry, the A Lot Of Pilates service is experiencing a problem. Please access ALotOfPilates.com to take video classes now.",
                     type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                response.tell(speechOutput);
           }    
        }
    });
}

function teachClass(alopAPIResponse, response){  
    console.log("START Teaching Pilates Class"); 
    var speechPoseOutput ="";
    for(var i = 0; i < alopAPIResponse.poses.length; i++){
        var pose = alopAPIResponse.poses[i];                          
        if( i === 0 ){
            speechPoseOutput += "Get ready on your mat for the " + pose.name;       
        }else{
            speechPoseOutput += "Next exercise is " + pose.name;
        }
        
        speechPoseOutput += ". <break time=\"0.2s\" />. " + pose.repetition;  
        speechPoseOutput += ". <break time=\"1s\" />. ";
        speechPoseOutput += handleExerciseTimings(pose);
    }
    speechPoseOutput += handleEndClassRequest();
    //console.log(speechPoseOutput);
    var speechText ="<speak>" + speechPoseOutput + "</speak>";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.SSML
        };

    
    response.tell(speechOutput);
   // response.shouldEndSession (false);
    
}

function handleExerciseTimings(pose){
    var speechExerciseOutput ="";
    var sideLegSeriesPoseIdArray = [431,432,434,435,326];
    //var sideLegSeriesPoseIdArray = [];

        if(pose.id === 133){ //Hold it for 20 to 30 seconds
            speechExerciseOutput += "Start holding the " + pose.name;
            speechExerciseOutput += "<break time=\"10s\" />. ";
            speechExerciseOutput += "10 seconds";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Almost done";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "done. ";
        }else if (sideLegSeriesPoseIdArray.indexOf(pose.id) > -1){//Side Leg Series
            speechExerciseOutput += "Lie on one side with bottom arm bent for head to lay on.";
            speechExerciseOutput += ".<break time=\"2s\" />";
            speechExerciseOutput += "Position the legs about 45 degrees in front of the body";  
            speechExerciseOutput += ".<break time=\"2s\" />";          
            speechExerciseOutput += "Start";
            speechExerciseOutput += ".<break time=\"10s\" />";
            speechExerciseOutput += "<break time=\"10s\" /> ";
            speechExerciseOutput += "<break time=\"10s\" />. ";
            speechExerciseOutput += "<break time=\"10s\" />. ";
            speechExerciseOutput += "<break time=\"10s\" />. ";
            speechExerciseOutput += "Switch sides";
            speechExerciseOutput += ".<break time=\"5s\" /> ";
            speechExerciseOutput += "Start";
            speechExerciseOutput += ".<break time=\"10s\" /> ";
            speechExerciseOutput += ".<break time=\"10s\" /> ";
            speechExerciseOutput += ".<break time=\"10s\" /> ";
            speechExerciseOutput += ".<break time=\"10s\" /> ";
            speechExerciseOutput += ".<break time=\"10s\" /> ";
        }else if (pose.id === 327){ //Inhale, Exhale 3-5 times"
            speechExerciseOutput += "<break time=\"2s\" />. ";
            speechExerciseOutput += "Relax in " + pose.name;
            speechExerciseOutput += "Inhale";
            speechExerciseOutput += ".<break time=\"4s\" />. ";
            speechExerciseOutput += "Exhale";
            speechExerciseOutput += ".<break time=\"6s\" />. ";
        }else if (pose.id === 266){ //Pulse your arms 100 times            
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Inhale through the nose for 5 counts";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Exhale through the mouth for 5 counts.";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Inhale 5 times";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Exhale 5 times";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Repeat 8 more times";
            speechExerciseOutput += ".<break time=\"6s\" /> ";
            speechExerciseOutput += "<break time=\"6s\" />. ";
            speechExerciseOutput += "<break time=\"6s\" />. ";
            speechExerciseOutput += "<break time=\"6s\" />. ";
            speechExerciseOutput += "Keep going 5 more times.";
            speechExerciseOutput += "<break time=\"6s\" /> ";
            speechExerciseOutput += "<break time=\"6s\" />";
            speechExerciseOutput += "<break time=\"6s\" />";
            speechExerciseOutput += "<break time=\"6s\" />";
            speechExerciseOutput += "Almost there! 90";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Good job! Relax.";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
        }else if (pose.id === 541){ //Repeat 3-5 times (standing roll down)
            speechExerciseOutput += "Let's start standing for the " + pose.name;
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Inhale to lower the chin towards the chest, letting the head by heavy";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Exhale";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Inhale and pause at the bottom";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Exhale and come up. Head comes up last.";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += "Repeat 2 more times";
            speechExerciseOutput += ".<break time=\"10s\" />";
            speechExerciseOutput += ".<break time=\"10s\" />";
            speechExerciseOutput += ".<break time=\"10s\" />";
        }else{  //Generic timining   
            //console.log("Exercise duration " + pose.duration + " formatted " + getFormattedDuration(pose.duration));

            speechExerciseOutput += ". Go. ";
            var duration = getFormattedDuration(pose.duration);
            for(var i = 0; i < 4; i++){
                speechExerciseOutput += "<break time=\"10s\" />. ";
            }
        }
    //console.log("Exercise output " + speechExerciseOutput);
    return speechExerciseOutput;
}
/**
 * Uses ALOP API, triggered by GET on /workouts API with category and duration querystrings.
 * https://api-2445581417326.apicast.io:443/api/
 */
function makeALOPRequest(duration, type, alopResponseCallback) {
       
    
     // An object of options to indicate where to post to    
    var post_options = {
      hostname: 'api-2445581417326.apicast.io',
      port: 443,
      path: '/api/v1/workouts/649', //680, 649
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api_key': config.api_key ///I store the APP_ID in a config file instead of global variable (API_KEY)
      }
    };

    console.log("makeALOPRequest");
    var req = https.request(post_options, function(res) {
        console.log('STATUS: ' + res.statusCode);       
        res.setEncoding('utf8');
        var alopResponseString = '';

        if (res.statusCode != 200) {
            alopResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            alopResponseString += data;
        });

        res.on('end', function () {
            var alopResponseObject = JSON.parse(alopResponseString);

            if (alopResponseObject.error) {
                alopResponseCallback(new Error(alopResponseObject.error.message));
            } else {
                console.log('Workout name: ' + alopResponseObject.title);
                alopResponseCallback(null, alopResponseObject);
            }
        });

    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        alopResponseCallback(new Error(e.message));
    });

req.end();
    
}

/**
 * Uses ALOP API, triggered by GET on /workouts API with category and duration querystrings.
 * Results can be verified at: http://tidesandcurrents.noaa.gov/noaatidepredictions/NOAATidesFacade.jsp?Stationid=[id]
 */
function makeALOPGETRequest(duration, type, alopResponseCallback) {

    var datum = "MLLW";
    var endpoint = 'http://alop.herokuapp.com/api/v1/workouts/680';
    var queryString = '?duration=' + duration;
    queryString += '&type=' + type + '&units=english&time_zone=lst_ldt&format=json';

    http.get(endpoint + queryString, function (res) {
        
        console.log('Status Code: ' + res.statusCode);

    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        alopResponseCallback(new Error(e.message));
    });
}

/**
 * Formats the duration, rounding to the heighest value divided by 10. e.g.
 * 89 -> 9.
 */
function getFormattedDuration(duration) {
    return Math.ceil(duration / 10);
}

/**
 * Gets class duration from intent, or returns an error
 */
function getDurationFromIntent(intent, assignDefault) {
    console.log("GET Duration From Intent");
    var durationSlot = intent.slots.Duration;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!durationSlot || !durationSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            };
        } else {
            // For sample skill, default to 30 minutes class.
            return {
                duration: '30',
                duration_id: 2
            };
        }
    } else {
        // lookup the duration. 
        var durationFrame = durationSlot.value;
        if (DURATIONS[durationFrame.toLowerCase()]) {
            return {
                duration: durationFrame,
                duration_id: DURATIONS[durationFrame.toLowerCase()]
            };
        } else {
            return {
                error: true,
                duration: durationFrame
            };
        }
    }
}

/**
 * Gets the date from the intent, defaulting to today if none provided,
 * or returns an error
 */
function getDateFromIntent(intent) {

    var dateSlot = intent.slots.Date;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!dateSlot || !dateSlot.value) {
        // default to today
        return {
            displayDate: "Today",
            requestDateParam: "date=today"
        };
    } else {

        var date = new Date(dateSlot.value);

        // format the request date like YYYYMMDD
        var month = (date.getMonth() + 1);
        month = month < 10 ? '0' + month : month;
        var dayOfMonth = date.getDate();
        dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;
        var requestDay = "begin_date=" + date.getFullYear() + month + dayOfMonth + "&range=24";
        return {
            displayDate: alexaDateUtil.getFormattedDate(date),
            requestDateParam: requestDay
        };
    }
}

function getAllDurationText() {
    var durationList = '';
    for (var duration in DURATIONS) {
        durationList += duration + ", ";
    }
    return durationList;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var alop = new ALotOfPilates();
    alop.execute(event, context);
};
