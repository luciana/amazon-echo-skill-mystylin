
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
    config = require('./config'),
    data = require('./storage');


/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

//var data = new dataHelper();

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
       
        //identifies slots for location and treatment
        var zipSlot = intent.slots.zip;
        var treatmentSlot = intent.slots.treatment;

        // if no zip slot value provided check data store
        // pass session user id to retrieve data
        if (!zipSlot || !zipSlot.value){
            handleNoZipSlotDialogRequest(intent, session, response);
        }else if (zipSlot && zipSlot.value) {
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

function handleEndRequest(){
    return "That is it. Check back for more deals or visit MyStylin app.";
}


/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, start a Pilates class'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotGetDealsRequest(intent, session, response) {
     // Look up AWS DynamoDB for user location
     var locationStation = getLocationFromIntent(intent, true, session),
        repromptText,
        speechOutput;

        console.log("location from handleOneshotGetDealsRequest " + locationStation.zip);
        var dataObject ={location: {zip: locationStation.zip}};
        data.newStorage(session, dataObject).save(function () {
            //response.ask('New game started without players, who do you want to add first?', 'Who do you want to add first?');
            console.log("save");
        });
       // data.storeMyStylinData(session.user, dataObject);

     var treatmentStation = getTreatmentFromIntent(intent, session),
        repromptText,
        speechOutput;

         console.log("treatment" + treatmentStation.treatment);

    getFinalDealsResponse(locationStation.zip, treatmentStation.treatment, response, session);
}


/**
 * Handles the dialog step where the user does not provides a zip code
 * Zip is read from nosql table
 */
function handleNoZipSlotDialogRequest (intent, session, response){
    var userId = session.user.userId;
    console.log("handleNoZipSlotDialogRequest for " + userId);
   
     var info =   data.read(session,function (session) {
            //response.ask('New game started without players, who do you want to add first?', 'Who do you want to add first?');
            console.log("read");
        });
     console.log("info" +info);
    if (info){
        // if we don't have a treatment yet, go to treatment. If we have a treatment, we perform the final request
        if (session.attributes.treatment) {
            getFinalDealsResponse(info.location.zip, session.attributes.treatment, response);
        } else {
            // set zip in session and prompt for treatment
            session.attributes.zip = info.location.zip;
            speechOutput = "For which treatment?";
            repromptText = "For which treatment would you like deals information for " + locationStation.zip + "?";
            response.ask(speechOutput, repromptText);
        }
    } else{
        handleZipSlotDialogRequest(intent, session, response);
    }
}

/**
 * Handles the dialog step where the user provides a zip code
 * Gets Location information
 */
function handleZipSlotDialogRequest(intent, session, response) {

    var locationStation = getLocationFromIntent(intent, true, session),
        repromptText,
        speechOutput;

        console.log("location " + locationStation.zip);

    if (locationStation.error) {
        repromptText = "Check back another time ";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = locationStation.zip ? "I'm sorry, I don't have any deals for " + locationStation.zip + ". " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    var dataObject ={location: {zip: locationStation.zip}};
    //data.storeMyStylinData(session.user.userId, dataObject);

    // if we don't have a treatment yet, go to treatment. If we have a treatment, we perform the final request
    if (session.attributes.treatment) {
        getFinalDealsResponse(locationStation.zip, session.attributes.treatment, response);
    } else {
        // set zip in session and prompt for treatment
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
    if (session.attributes.treatment) {
        // get date re-prompt
        var repromptText = "Please try again saying a treatment type, for example, Nails. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    } else {
        // get city re-prompt
        handleSupportedTreatmentRequest(intent, session, response);
    }
}

/**
 * Handles the dialog step where the user provides a treatment service type
 */
function handleTreatmentSlotDialogRequest(intent, session, response) {

    var treatmentStation = getTreatmentFromIntent(intent, session),
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
        getFinalDealsResponse(session.attributes.zip, treatmentStation.treatment, response);
    } else {
        // The user provided a date out of turn. Set date in session and prompt for zip
        session.attributes.treatment = treatmentStation.treatment;
        speechOutput = "For which zip would you like " + treatmentStation.treatment + " deals?";
        repromptText = "For which zip?";

        response.ask(speechOutput, repromptText);
    }
}

/**
 * Handles the case where the user asked or for, or is otherwise being with supported cities
 */
function handleSupportedTreatmentRequest(intent, session, response) {
    // get city re-prompt
    var repromptText = "Which treatment type would you like deals for?";
    var speechOutput = "Currently, I know deals for these treatment types: " + getAllTreatmentText()
        + repromptText;

    response.ask(speechOutput, repromptText);
}

/* Call API to return treatment types *
 * Save treatment list to session */

function getAllTreatmentText() {
    var TREATMENTS = ['Hair','Massage','Spa','Nails','Products','Tanning'];
    var lists = '';
    for(var i = 0; i < TREATMENTS.length ; i++) {
        lists += TREATMENTS[i] + ", ";
    }   
    console.log("Treatment list " + lists);
    return lists;
}

/**
 * Gets the date from the intent, defaulting to today if none provided,
 * or returns an error
 */
function getTreatmentFromIntent(intent, session) {

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
         session.attributes.treatment = treat;      
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
function getLocationFromIntent(intent, assignDefault, session) {

    var zipSlot = intent.slots.zip;

    console.log("what is zip slot when not given " + zipSlot);
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!zipSlot || !zipSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            };
        } else {
            // Look up AWS DynamoDB for user location
              console.log("getLocationFromIntent 2 " );
            return {
                zip: '44123',
                lat: 42.8888,
                log: 83.333
            }
        }
    } else {
        // Look up AWS DynamoDB for user location
        var zip = zipSlot.value;
         console.log("getLocationFromIntent 3 " );
        var userId = session.user.userId;
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
                speechText = "help text";
                break;
          
            default:
                speechText = "help text.";
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
       
    // Issue the request, and respond to the user
    makeMyStylinRequest(location, treatment, function alopResponseCallback(err, myStylinAPIResponse) {
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
    var speechDealOutput ="";
    speechDealOutput += "There are a few deals available around you. ";       
    speechDealOutput += "See if you like these.";

    for(var i = 0; i < myStylinAPIResponse.results.length; i++){
        var deal = myStylinAPIResponse.results[i];              
        speechDealOutput += " <break time=\"0.2s\" />. " + deal.deal_description;  
        speechDealOutput += " <break time=\"0.1s\" /> in the city of " + deal.salon_city;     
        speechDealOutput += " <break time=\"1s\" />";
    }
    speechDealOutput += handleEndRequest();
    var speechText ="<speak>" + speechDealOutput + "</speak>";
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
       

    var endpoint = 'http://developer.mystylin.com/v1/deals/search';
    var queryString = '?' 
    queryString += 'treatment=' + treatment;
    queryString += '&zip=' + zip + '&distance=50';

    console.log("Request API data for treatment type " + treatment + " and zip " + zip);

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
