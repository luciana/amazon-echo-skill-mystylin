
/**
 * My Stylin Alexa Skills
 *
 *
 * Author: Luciana Bruscino
 * Copywrite 2016 MyStylin.com
 *
 * Example:
 * One-shot model:
 *  User:  "Alexa, ask MyStylin for Hair deals in Cleveland Ohio"
 *  Alexa: "You can have 50% off haircut from Shawn K's spa. This is good until today!"

 * Dialog model:
 *  User:  "Alexa, ask MyStylin for deals"
 *  Alexa: "Welcome to MyStylin. Which zip code would you like to retrieve deals?"
 *  User:  "44124"
 *  Alexa: "What type of service treatment are you looking for? You can say spa, hair, nails"
 *  User:  "Hair"
 *  Alexa: "You can have 50% off haircut from Shawn K's spa. This is good until today!"
 */


var https = require('https'),
    http = require('http'),
    config = require('./config');


/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * MyStylin is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var MyStylin = function () {
    AlexaSkill.call(this, config.app_id); //I store the APP_ID in a config file instead of global variable (APP_ID)
};

// Extend AlexaSkill
MyStylin.prototype = Object.create(AlexaSkill.prototype);
MyStylin.prototype.constructor = MyStylin;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

MyStylin.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

MyStylin.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    session.attributes.stage = 0;
    handleWelcomeRequest(response);
};

MyStylin.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
  
};

/**
 * override intentHandlers to map intent handling functions.
 */
MyStylin.prototype.intentHandlers = {
    "OneshotGetDealsIntent": function (intent, session, response) {
        handleOneshotGetDealsRequest(intent, session, response);
    },

    "DialogDealsIntent": function (intent, session, response) {
        // Determine if this turn is for city, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        var zipSlot = intent.slots.Zip;
        var treatmentSlot = intent.slots.Treatment;
        if (zipSlot && zipSlot.value) {
            handleZipSlotDialogRequest(intent, session, response);
        } else if (treatmentSlot && treatmentSlot.value) {
            handleTreatmentSlotDialogRequest(intent, session, response);
        } else {
            handleNoSlotDialogRequest(intent, session, response);
        }
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(intent, session, response);
    },
    
    
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- MyStylin Domain Specific Business Logic --------------------------


function handleWelcomeRequest(response) {
   
        var speechOutput = {            
            speech: "<speak>Welcome to MyStylin Deals." +
            ".<break time=\"0.7s\" /> " + 
            "Which zip code would you like to retrieve deals?" + 
            "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech:  "<speak> I can provide you with MyStylin deals " +
            "<break time=\"0.2s\" /> " +
            " You can also "+
            " visit MyStylin app for iOS or Android to get more deals. " +
            ".<break time=\"0.7s\" /> " +           
            " Which zip code would you like to retrieve deals?" + 
            "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        };

    response.ask(speechOutput, repromptOutput);
}

function handleEndClassRequest(){
    return "That is it. Check back for more deals or visit MyStylin app.";
}


/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, start a Pilates class'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotGetDealsRequest(intent, session, response) {
     // Look up AWS DynamoDB for user location
     var locationStation = getLocationFromIntent(intent, true),
        repromptText,
        speechOutput;

     var treatmentStation = getTreatmentFromIntent(intent),
        repromptText,
        speechOutput;

    getFinalDealsResponse(locationStation.zip, treatmentStation.treatment, response, session);
}

/**
 * Handles the dialog step where the user provides a zip code
 * Gets Location information
 */
function handleZipSlotDialogRequest(intent, session, response) {

    var locationStation = getLocationFromIntent(intent, false),
        repromptText,
        speechOutput;

    if (zipStation.error) {
        repromptText = "Check back another time ";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = locationStation.zip ? "I'm sorry, I don't have any deals for " + locationStation.zip + ". " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a treatment yet, go to treatment. If we have a treatment, we perform the final request
    if (session.attributes.treatment) {
        getFinalDealsResponse(locationStation, session.attributes.treatment, response);
    } else {
        // set city in session and prompt for date
        session.attributes.zip = locationStation;
        speechOutput = "For which treatment?";
        repromptText = "For which treatment would you like deals information for " + locationStation.zip + "?";

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
    if (session.attributes.city) {
        // get date re-prompt
        var repromptText = "Please try again saying a treatment type, for example, Nails. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    } else {
        // get city re-prompt
        handleSupportedCitiesRequest(intent, session, response);
    }
}

/**
 * Handles the dialog step where the user provides a treatment service type
 */
function handleTreatmentSlotDialogRequest(intent, session, response) {

    var treatmentStation = getTreatmentFromIntent(intent),
        repromptText,
        speechOutput;

    if (!treatmentStation) {
        repromptText = "Please try again saying a treatment type such as . " + getAllTreatmentText()
            + "For which treatment would you like deals?";
        speechOutput = "I'm sorry, I didn't understand that treatment type. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a zip yet, go to zip. If we have a zip, we perform the final request
    if (session.attributes.zip) {
        getFinalTideResponse(session.attributes.zip, treatmentStation.treatment, response);
    } else {
        // The user provided a date out of turn. Set date in session and prompt for zip
        session.attributes.treatment = treatmentStation.treatment;
        speechOutput = "For which zip would you like tide information for " + treatmentStation.treatment + "?";
        repromptText = "For which zip?";

        response.ask(speechOutput, repromptText);
    }
}

/* Call API to return treatment types *
 * Save treatment list to session */

function getAllTreatmentText() {
    var TREATMENTS = ['hair','spa','nails','massage'];
    var lists = '';
    for (var list in TREATMENTS) {
        lists += station + ", ";
    }
    session.attributes.list = lists;
    return lists;
}

/**
 * Gets the date from the intent, defaulting to today if none provided,
 * or returns an error
 */
function getTreatmentFromIntent(intent) {

    var treatmentSlot = intent.slots.treatment;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!treatmentSlot || !treatmentSlot.value) {
        // default to today
        return {
            treatment: "Hair"
        };
    } else {
        var treat = treatmentSlot.value;       
        return {
            treatment: treat
        }
    }
}

/**
 * Gets the zip from the intent, or returns an error
 * Get lat and long for zip
 * 
 */
function getLocationFromIntent(intent, assignDefault) {

    var zipSlot = intent.slots.zip;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!zipSlot || !zipSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            };
        } else {
            // Look up AWS DynamoDB for user location
            return {
                zip: '44124',
                lat: 42.8888,
                log: 83.333
            }
        }
    } else {
        // lookup the city. Sample skill uses well known mapping of a few known cities to station id.
        // Look up AWS DynamoDB for user location
        var zip = zipSlot.value;
        var userId = session.userId;
        //Query DynamoDB table by userId
        if (true) {
            return {
                zip: zip,
                lat: 42.8888,
                log: 83.333
            }
        } else {
            return {
                error: true,
                zip: zip
            }
        }
    }
}


/**
 * This handles the Help intent:
 * 'Alexa, help me'.
 */
function handleHelpRequest(intent, session, response) {
   var speechText = "";       
   console.log("User asked for help at stage " + session.attributes.stage);
        switch (session.attributes.stage) {
            case 0: //haven't retrieve the class yet
                speechText = "Pilates classes are great way to feel wonderful. " +
                    "If you are not familiar with the exercises visit a lot pilates dot com. " +
                    "If you are ready to start say go or you can say exit.";
                break;
          
            default:
                speechText = "If you are not familiar with this exercise, " +                            
                            " visit MyStylin.com and take a video instructed class. " +
                            "To start a new class, just say go, or you can say exit.";
        }

        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        // For the repromptText, play the speechOutput again
        response.ask(speechOutput, repromptOutput);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalDealsResponse(location, treatment, response, session) {
    //console.log("GET Pilates Sequence");
    // Issue the request, and respond to the user
    makeMyStylinRequest("44077", "hair", function alopResponseCallback(err, myStylinAPIResponse) {
        var speechOutput;
        
        if (err) {
            speechOutput = {
                speech:"Sorry, the MyStylin service is experiencing a problem. Please access MyStylin app to lookup deals",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.tell(speechOutput);
        } else {
            console.log("myStylinAPIResponse",myStylinAPIResponse);
            if(myStylinAPIResponse.results.length > 0){  
                 //The stage variable tracks the phase of the dialogue.    
                session.attributes.stage = 1;                
                advertiseDeals(myStylinAPIResponse, response, session);        
            }else{
                speechOutput = {
                    speech:"Sorry, the MyStylin service is experiencing a problem. Please access MyStylin.com to lookup deals.",
                     type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                response.tell(speechOutput);
           }
        }
    });
}

/**
 * Call for workout was successfull, so this function responsability is to loop thru the 
 * exercises the output the exercise information. It calls handleExerciseTimings for descriptions.
 * At this point, the user is at stage 1 of the session.
 */

function advertiseDeals(myStylinAPIResponse, response, session){      
    var speechPoseOutput ="";
    speechPoseOutput += "There are a few deals available around you. ";       
    speechPoseOutput += "See if you like these.";

    for(var i = 0; i < myStylinAPIResponse.results.length; i++){
        var deal = myStylinAPIResponse.results[i];              
        speechPoseOutput += " <break time=\"0.2s\" />. " + deal.deal_description;  
        speechPoseOutput += " <break time=\"0.1s\" /> in " + deal.salon_city;       
    }
    speechPoseOutput += handleEndClassRequest();
    //console.log(speechPoseOutput);
    var speechText ="<speak>" + speechPoseOutput + "</speak>";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.SSML
        };

    
    response.tell(speechOutput);
}




/**
 * Uses MyStylin API, triggered by GET on /deals/search API with category and duration querystrings.
 * curl -v -X GET "http://developer.mystylin.com/v1/deals/search?treatment=hair&distance=50&zip=44077"
 */
function makeMyStylinRequest(zip, treatment, myStylinResponseCallback) {
       
    
     // An object of options to indicate where to post to    
    var post_options = {
      hostname: 'api-2445581417326.apicast.io',
      port: 443,
      path: '/v1/deals/search',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
       
      }
    };

    var endpoint = 'http://developer.mystylin.com/v1/deals/search';
    var queryString = '?' 
    queryString += 'treatment=' + treatment;
    queryString += '&zip=' + zip + '&units=english&time_zone=lst_ldt&format=json';

    var req = http.get(endpoint + queryString, function (res) {    
        console.log('STATUS: ' + res.statusCode);       
        res.setEncoding('utf8');
        var myStylinResponseString = '';

        if (res.statusCode != 200) {
            myStylinResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            myStylinResponseString += data;
        });

        res.on('end', function () {
            var myStylinResponseObject = JSON.parse(myStylinResponseString);

            if (myStylinResponseObject.error) {
                myStylinResponseCallback(new Error(myStylinResponseObject.error.message));
            } else {
                //console.log('Workout name: ' + myStylinResponseObject.title);
                myStylinResponseCallback(null, myStylinResponseObject);
            }
        });

    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        myStylinResponseCallback(new Error(e.message));
    });

req.end();
    
}


// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var mystylin = new MyStylin();
    mystylin.execute(event, context);
};
