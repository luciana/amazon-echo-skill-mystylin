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
 *  User:  "Alexa, ask Tide Pooler when is the high tide in Seattle on Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 * Dialog model:
 *  User:  "Alexa, open Tide Pooler"
 *  Alexa: "Welcome to Tide Pooler. Which city would you like tide information for?"
 *  User:  "Seattle"
 *  Alexa: "For which date?"
 *  User:  "this Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
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
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

ALotOfPilates.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

ALotOfPilates.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
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

    "SupportedCitiesIntent": function (intent, session, response) {
        handleSupportedCitiesRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
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
    var whichDurationPrompt = "How long do you want your class to be?",
        speechOutput = {
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

function handleHelpRequest(response) {
    var repromptText = "How long do you want your class to be?";
    var speechOutput = "I can lead you through a pilates sequence " + "Or you can say exit. " + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the case where the user asked or for, or is otherwise being with supported cities
 */
function handleSupportedCitiesRequest(intent, session, response) {
    // get city re-prompt
    var repromptText = "What is your prefered class duration?";
    var speechOutput = "Currently, You can take class that lasts  " + getAllStationsText() + " minutes" + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the dialog step where the user provides a city
 */
function handleCityDialogRequest(intent, session, response) {

    var cityStation = getCityStationFromIntent(intent, false),
        repromptText,
        speechOutput;
    if (cityStation.error) {
        repromptText = "Currently, You can take class that lasts   " + getAllStationsText() + "What is your prefered class duration?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = cityStation.city ? "I'm sorry, I don't have any data for " + cityStation.city + ". " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a date yet, go to date. If we have a date, we perform the final request
    if (session.attributes.date) {
        getPilatesSequenceResponse(cityStation, session.attributes.date, response);
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
        getPilatesSequenceResponse(session.attributes.duration, date, response);
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
        handleSupportedCitiesRequest(intent, session, response);
    }
}

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Tide Pooler and get tide information for Seattle on Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotTideRequest(intent, session, response) {

    // Determine city, using default if none provided
    var cityStation = getCityStationFromIntent(intent, true),
        repromptText,
        speechOutput;
    if (cityStation.error) {
        // invalid city. move to the dialog
        repromptText = "Currently, You can take class that lasts   " + getAllStationsText() + "What is your prefered class duration?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = cityStation.city ? "I'm sorry, I don't have any data for " + cityStation.city + ". " + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // Determine custom date
    var date = getDateFromIntent(intent);
    if (!date) {
        // Invalid date. set city in session and prompt for date
        session.attributes.duration = cityStation;
        repromptText = "Please try again saying a day of the week, for example, Saturday. "
            + "For which date would you like tide information?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // all slots filled, either from the user or by default values. Move to final request
    getPilatesSequenceResponse(cityStation, date, response);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getPilatesSequenceResponse(cityStation, date, response) {

    // Issue the request, and respond to the user
    makeALOPRequest(cityStation.station, date, function alopResponseCallback(err, alopAPIResponse) {
        var speechOutput;
        

        if (err) {
            speechOutput = {
                speech:"Sorry, the A Lot Of Pilates service is experiencing a problem. Please try again later",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };    
        } else {            
            if(alopAPIResponse.poses.length > 0){
                var speechOutputStart = "Let's start. I like to call this class " + alopAPIResponse.title + " <break time=\"0.2s\" /> ";
                for(var i = 0; i < alopAPIResponse.poses.length; i++){
                    var pose = alopAPIResponse.poses[i];
                    var speechPoseOutput;                
                    if( i === 0 ){
                        speechPoseOutput = ". Get ready on your mat for the " + pose.name;
                    }else{
                        speechPoseOutput = ". Next exercise is " + pose.name;
                    }
                    
                    speechPoseOutput += ". <break time=\"0.2s\" /> We are going to " + pose.repetition + ". Go.";                 
                } 
                var speechText ="<speak>"  + speechOutputStart + speechPoseOutput + "</speak>";      
                speechOutput = {
                    speech: speechText,
                    type: AlexaSkill.speechOutputType.SSML
                };
            }else{
                speechOutput = {
                    speech:"Sorry, the A Lot Of Pilates service is experiencing a problem. Please try again later",
                     type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
           }
            
        }
        console.log("speechOutput", speechOutput);
        //response.tellWithCard(speechOutput, "ALotOfPilates", speechOutput);
        response.tell(speechOutput);
    });
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalTideResponse(cityStation, date, response) {

    // Issue the request, and respond to the user
    makeTideRequest(cityStation.station, date, function tideResponseCallback(err, highTideResponse) {
        var speechOutput;

        if (err) {
            console.log("ERROR : " + err);
            speechOutput = "Sorry, the A Lot Of Pilates service is experiencing a problem. Please try again later";
        } else {
            speechOutput = date.displayDate + " in " + cityStation.city + ", let's start with "
                + highTideResponse.firstHighTideTime + ", and will peak at about " + highTideResponse.firstHighTideHeight
                + ", followed by a low tide at around " + highTideResponse.lowTideTime
                + " that will be about " + highTideResponse.lowTideHeight
                + ". The second high tide will be around " + highTideResponse.secondHighTideTime
                + ", and will peak at about " + highTideResponse.secondHighTideHeight + ".";
        }

        response.tellWithCard(speechOutput, "ALotOfPilates", speechOutput);
    });
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
      path: '/api/v1/workouts/524',
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
        var noaaResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            tideResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            noaaResponseString += data;
        });

        res.on('end', function () {
            var noaaResponseObject = JSON.parse(noaaResponseString);

            if (noaaResponseObject.error) {
                console.log("NOAA error: " + noaaResponseObj.error.message);
                tideResponseCallback(new Error(noaaResponseObj.error.message));
            } else {
                var highTide = findHighTide(noaaResponseObject);
                tideResponseCallback(null, highTide);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        tideResponseCallback(new Error(e.message));
    });
}

/**
 * Algorithm to find the 2 high tides for the day, the first of which is smaller and occurs
 * mid-day, the second of which is larger and typically in the evening
 */
function findHighTide(noaaResponseObj) {
    var predictions = noaaResponseObj.predictions;
    var lastPrediction;
    var firstHighTide, secondHighTide, lowTide;
    var firstTideDone = false;

    for (var i = 0; i < predictions.length; i++) {
        var prediction = predictions[i];

        if (!lastPrediction) {
            lastPrediction = prediction;
            continue;
        }

        if (isTideIncreasing(lastPrediction, prediction)) {
            if (!firstTideDone) {
                firstHighTide = prediction;
            } else {
                secondHighTide = prediction;
            }

        } else { // we're decreasing

            if (!firstTideDone && firstHighTide) {
                firstTideDone = true;
            } else if (secondHighTide) {
                break; // we're decreasing after have found 2nd tide. We're done.
            }

            if (firstTideDone) {
                lowTide = prediction;
            }
        }

        lastPrediction = prediction;
    }

    return {
        firstHighTideTime: alexaDateUtil.getFormattedTime(new Date(firstHighTide.t)),
        firstHighTideHeight: getFormattedHeight(firstHighTide.v),
        lowTideTime: alexaDateUtil.getFormattedTime(new Date(lowTide.t)),
        lowTideHeight: getFormattedHeight(lowTide.v),
        secondHighTideTime: alexaDateUtil.getFormattedTime(new Date(secondHighTide.t)),
        secondHighTideHeight: getFormattedHeight(secondHighTide.v)
    };
}

function isTideIncreasing(lastPrediction, currentPrediction) {
    return parseFloat(lastPrediction.v) < parseFloat(currentPrediction.v);
}

/**
 * Formats the height, rounding to the nearest 1/2 foot. e.g.
 * 4.354 -> "four and a half feet".
 */
function getFormattedHeight(height) {
    var isNegative = false;
    if (height < 0) {
        height = Math.abs(height);
        isNegative = true;
    }

    var remainder = height % 1;
    var feet, remainderText;

    if (remainder < 0.25) {
        remainderText = '';
        feet = Math.floor(height);
    } else if (remainder < 0.75) {
        remainderText = " and a half";
        feet = Math.floor(height);
    } else {
        remainderText = '';
        feet = Math.ceil(height);
    }

    if (isNegative) {
        feet *= -1;
    }

    var formattedHeight = feet + remainderText + " feet";
    return formattedHeight;
}

/**
 * Gets the city from the intent, or returns an error
 */
function getCityStationFromIntent(intent, assignDefault) {

    var durationSlot = intent.slots.Duration;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!durationSlot || !durationSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            };
        } else {
            // For sample skill, default to Seattle.
            return {
                city: '30',
                station: 2
            };
        }
    } else {
        // lookup the city. Sample skill uses well known mapping of a few known cities to station id.
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

function getAllStationsText() {
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
