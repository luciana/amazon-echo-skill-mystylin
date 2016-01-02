/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 * - Web service: communicate with an external web service to get tide data from NOAA CO-OPS API (http://tidesandcurrents.noaa.gov/api/)
 * - Multiple optional slots: has 2 slots (city and date), where the user can provide 0, 1, or 2 values, and assumes defaults for the unprovided values
 * - DATE slot: demonstrates date handling and formatted date responses appropriate for speech
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 *   If the user provides an incorrect slot in a one-shot model, it will direct to the dialog model. See the
 *   examples section for sample interactions of these models.
 * - Pre-recorded audio: Uses the SSML 'audio' tag to include an ocean wave sound in the welcome response.
 *
 * Examples:
 * One-shot model:
 *  User:  "Alexa, start a pilates class"
 *  Alexa: "Welcome to A Lot Of Pilates! Ready to feel great? say start class ...""
 * Dialog model:
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
var APP_ID = 'amzn1.echo-sdk-ams.app.ef7b5d42-f176-4806-9ea3-6ef6d041c2aa';

var http = require('http'),
    alexaDateUtil = require('./alexaDateUtil');


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
    AlexaSkill.call(this, APP_ID);
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
    "OneshotTideIntent": function (intent, session, response) {
        handleOneshotTideRequest(intent, session, response);
    },

    "DialogTideIntent": function (intent, session, response) {
        // Determine if this turn is for duration, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        var durationSlot = intent.slots.Duration;
        var dateSlot = intent.slots.Date;
        if (durationSlot && durationSlot.value) {
            handleCityDialogRequest(intent, session, response);
        } else if (dateSlot && dateSlot.value) {
            handleDateDialogRequest(intent, session, response);
        } else {
            handleNoSlotDialogRequest(intent, session, response);
        }
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

// example city to NOAA station mapping. Can be found on: http://tidesandcurrents.noaa.gov/map/
var DURATIONS = {
    '10 minutes': 1,
    '30 minutes': 2,
    '50 minutes': 3
};

function handleWelcomeRequest(response) {
   
        var speechOutput = {
            speech: "<speak>Welcome to A Lot Of Pilates - Ready to feel great?. " + "<audio src='https://s3.amazonaws.com/ask-storage/tidePooler/OceanWaves.mp3'/>" + 
            "When ready say start class" + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "Ready to feel great? " + "I can lead you through a pilates sequence. Just say start class when ready.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleEndClassRequest(response) {
    var speechOutput = {
            speech: "Good job. You are all done. Hope you feel as great as me!",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.tell(speechOutput);
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
 * Handles the dialog step where the user provides a city
 */
function handleCityDialogRequest(intent, session, response) {

    var cityStation = getDurationFromIntent(intent, false),
        repromptText,
        speechOutput;
    if (cityStation.error) {
        repromptText = "Currently, You can take class that lasts   " + getAllDurationText() + "What is your prefered class duration?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = cityStation.city ? "I'm sorry, I don't have any data for " + cityStation.city + ". " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a date yet, go to date. If we have a date, we perform the final request
    if (session.attributes.date) {
        //getPilatesSequenceResponse(cityStation, session.attributes.date, response);
    } else {
        // set city in session and prompt for date
        session.attributes.city = cityStation;
        speechOutput = "For which date?";
        repromptText = "For which date would you like tide information for " + cityStation.city + "?";

        response.ask(speechOutput, repromptText);
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
        session.attributes.date = date;
        speechOutput = "For which duration would you like  " + date.displayDate + "?";
        repromptText = "For which duration?";

        response.ask(speechOutput, repromptText);
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
        var repromptText = "Please try again saying a day of the week, for example, Saturday. ";
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
function handleOneshotTideRequest(intent, session, response) {

    // Determine city, using default if none provided
    var cityStation = getDurationFromIntent(intent, true),
        repromptText,
        speechOutput;
    if (cityStation.error) {
        // invalid city. move to the dialog
        repromptText = "Currently, You can take class that lasts   " + getAllDurationText() + "What is your prefered class duration?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = cityStation.city ? "I'm sorry, I don't have any data for " + cityStation.city + ". " + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // Determine custom date
    var date = getDateFromIntent(intent);
    if (!date) {
        // Invalid date. set city in session and prompt for date
        //session.attributes.duration = cityStation;
        //repromptText = "Please try again saying a day of the week, for example, Saturday. " + "For which date would you like tide information?";
        //speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        //response.ask(speechOutput, repromptText);
        //return;
    }

    // all slots filled, either from the user or by default values. Move to final request
    getPilatesSequenceResponse(cityStation, date, response);
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
                speech:"Sorry, the A Lot Of Pilates service is experiencing a problem. Please try again later",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };     
            response.tell(speechOutput);
        } else {            

            if(alopAPIResponse.poses.length > 0){ 
                console.log("SUCESSFUL Get on Pilates Sequence");                              
                teachClass(alopAPIResponse, response);   
                speechOutput = {
                    speech:"Good job, you completed the class.. hope you feel great!",
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };     
                response.tell(speechOutput);          
            }else{
                speechOutput = {
                    speech:"Sorry, the A Lot Of Pilates service is experiencing a problem. Please try again later",
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
     console.log("This workout has " + alopAPIResponse.poses.length + " exercises");
    for(var i = 0; i < alopAPIResponse.poses.length; i++){    
        var pose = alopAPIResponse.poses[i];                          
        if( i === 0 ){
            speechPoseOutput += "Get ready on your mat for the " + pose.name;       
        }else{
            speechPoseOutput += "Next exercise is " + pose.name;
        }
        
        speechPoseOutput += ". <break time=\"0.2s\" />. " + pose.repetition;  
        speechPoseOutput += ". <break time=\"3s\" />. ";
        speechPoseOutput += handleExerciseTimings(pose);
    }
    console.log(speechPoseOutput);
    var speechText ="<speak>" + speechPoseOutput + "</speak>";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.SSML
        };

    
    response.tell(speechOutput);

    handleEndClassRequest(response);
}

function handleExerciseTimings(pose){
    var speechExerciseOutput ="";
    var sideLegSeriesPoseIdArray = [431,432,434,435,326];

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
            speechExerciseOutput += "Get in position for the " + pose.name;
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Start";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += "Switch sides";
            speechExerciseOutput += ".<break time=\"s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
        }else if (pose.id === 327){ //Inhale, Exhale 3-5 times"
            speechExerciseOutput += "<break time=\"2s\" />. ";
            speechExerciseOutput += "Relax in " + pose.name;
            speechExerciseOutput += "Inhale";
            speechExerciseOutput += ".<break time=\"4s\" />. ";
            speechExerciseOutput += "Exhale";
            speechExerciseOutput += ".<break time=\"16s\" />. ";
        }else if (pose.id === 266){ //Pulse your arms 100 times            
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Inhale 5 times";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Exhale 5 times";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Inhale 5 times";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Exhale 5 times";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Repeat 8 more times";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += "Keep going 5 more times";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />";
            speechExerciseOutput += ".<break time=\"10s\" />";
            speechExerciseOutput += ".<break time=\"10s\" />";
            speechExerciseOutput += "Almost there..90";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Good job.";
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
            console.log("Exercise duration " + pose.duration + " formatted " + getFormattedDuration(pose.duration));

            speechExerciseOutput += ". Go. ";
            //var duration = Math.floor(40 / 10);
            //for(i = 0; i < 4; i++){
                speechExerciseOutput += "<break time=\"1s\" />. ";
            //}
        }
    //console.log("Exercise output " + speechExerciseOutput);
    return speechExerciseOutput;
}
/**
 * Uses ALOP API, triggered by POST on /studios API with category and duration inputs.
 * DEV version: curl -H 'Content-Type: application/json' -H 'Accept: application/json' -X POST http://alop.herokuapp.com/api/v1/studios/random -d '{"category": 2}' -H "X-3scale-Proxy-Secret-Token:MPP-Allow-API-Call"
 */
function makeALOPRequest(station, date, alopResponseCallback) {
       
     // An object of options to indicate where to post to    
    var post_options = {
      hostname: 'alop.herokuapp.com',
      port: 80,
      path: '/api/v1/workouts/479', //680
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-3scale-Proxy-Secret-Token': 'MPP-Allow-API-Call'
      }
    };
    var req = http.request(post_options, function(res) {
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
 * Uses NOAA.gov API, documented: http://tidesandcurrents.noaa.gov/api/
 * Results can be verified at: http://tidesandcurrents.noaa.gov/noaatidepredictions/NOAATidesFacade.jsp?Stationid=[id]
 */
function makeTideRequest(station, date, tideResponseCallback) {

    var datum = "MLLW";
    var endpoint = 'http://tidesandcurrents.noaa.gov/api/datagetter';
    var queryString = '?' + date.requestDateParam;
    queryString += '&station=9447130';
    queryString += '&product=predictions&datum=' + datum + '&units=english&time_zone=lst_ldt&format=json';

    http.get(endpoint + queryString, function (res) {
        
        console.log('Status Code: ' + res.statusCode);

    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        tideResponseCallback(new Error(e.message));
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
                city: '30',
                station: 2
            };
        }
    } else {
        // lookup the duration. 
        var durationFrame = durationSlot.value;
        if (DURATIONS[durationFrame.toLowerCase()]) {
            return {
                city: durationFrame,
                station: DURATIONS[durationFrame.toLowerCase()]
            };
        } else {
            return {
                error: true,
                city: durationFrame
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
