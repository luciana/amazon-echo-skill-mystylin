
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

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StartOverIntent": function (intent, session, response) {
        handleStartOverRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.NoIntent": function (intent, session, response) {
        var speechOutput = "Ok. Hope you find a better time to start the class. Goodbye!";
        response.tell(speechOutput);
    },

    "AMAZON.YesIntent": function (intent, session, response) {
        handleOneshotStartPilatesClassRequest(intent, session, response);
    },
    
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- ALotOfPilates Domain Specific Business Logic --------------------------


function handleWelcomeRequest(response) {
   
        var speechOutput = {            
            speech: "<speak>Welcome to A Lot Of Pilates - Get ready to feel great! " +
            ".<break time=\"0.7s\" /> " + 
            "Get your mat ready on the floor." + 
            ".<break time=\"1s\" /> " +
            "Are you ready to start the class?" + 
            "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech:  "I can lead you through a pilates sequence. Just say start class when ready. Should I start?",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleEndClassRequest(){
    return "Good job! You are all done. Hope you feel as great as me! Visit ALotOfPilates.com for video classes.";
}

function handleStartOverRequest(response) {
    var repromptText = "Do you want to start the class?";
    var speechOutput = "I can lead you through a pilates sequence " + "Or you can say exit. " + repromptText;

    response.ask(speechOutput, repromptText);
}

function handleHelpRequest(response) {
    var speechHelpOutput = "If you are not familiar with Pilates exercises, "+
            " visit ALotOfPilates.com and start by taking the video classes. " +
            ".<break time=\"0.7s\" /> " +
            "You can also read the exercises step by step instructions." +
            ".<break time=\"0.7s\" /> " +
            "Have fun! ";

    var speechText ="<speak>" + speechHelpOutput + "</speak>";
    var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.SSML
    };
    response.tell(speechOutput);
}


/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, start a Pilates class'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotStartPilatesClassRequest(intent, session, response) {
    var duration = 2;
    var type = 2;
    getPilatesSequenceResponse(duration, type, response);
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
}

function handleExerciseTimings(pose){
    var speechExerciseOutput ="";
    var sideLegSeriesPoseIdArray = [431,432,434,435,326];
    var plankPosesIdArray = [133,564];

        if (plankPosesIdArray.indexOf(pose.id) > -1){//Planks - Hold it for 20 to 30 seconds
            speechExerciseOutput += "Get in position for the " + pose.name;
            speechExerciseOutput += "<break time=\"3s\" />. ";
            speechExerciseOutput += "Start holding the plank";
            speechExerciseOutput += "<break time=\"2s\" />. ";
            speechExerciseOutput += "Imagine a straight line from the crown of the head down to the toes.";
            speechExerciseOutput += "<break time=\"7s\" />. ";
            speechExerciseOutput += "10 seconds";
            speechExerciseOutput += "Breath in through the nose, out through the mouth.";
            speechExerciseOutput += ".<break time=\"8s\" />. ";
            speechExerciseOutput += "Engage your legs by squeezing an imaginary ball between them";
            speechExerciseOutput += ".<break time=\"5s\" />. ";
            speechExerciseOutput += "Almost done";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "you are  ";
            speechExerciseOutput += ".<break time=\"0.1s\" />. ";
            speechExerciseOutput += "done. Relax ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
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
            speechExerciseOutput += "Start seated with your knees bent";
            speechExerciseOutput += "<break time=\"0.3s\" />. ";
            speechExerciseOutput += "Lift feet off the floor";       
            speechExerciseOutput += ".<break time=\"0.2s\" />. ";
            speechExerciseOutput += "Place your hands on the backs of your thigh";
            speechExerciseOutput += ".<break time=\"0.2s\" />. ";
            speechExerciseOutput += "Look down at your belly by curling the chin towards the chest";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Exhale";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Breathe deeply into the back ribs and relax";
            speechExerciseOutput += ".<break time=\"4s\" />. ";
            speechExerciseOutput += ".<break time=\"6s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
        }else if (pose.id === 160){ //Rolling like a ball            
            speechExerciseOutput += "Get in position for " + pose.name;
            speechExerciseOutput += "<break time=\"2s\" />. ";
            speechExerciseOutput += "Inhale";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Exhale";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Breathe deeply";
            speechExerciseOutput += ".<break time=\"0.4s\" />. ";
            speechExerciseOutput += "Relax";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
        }else if (pose.id === 310){ //Pelvic Tilt         
            speechExerciseOutput += "Lay on your back with your knees bent for the " + pose.name;
            speechExerciseOutput += ".<break time=\"0.2s\" />. ";
            speechExerciseOutput += "Place your heels under the knees";
            speechExerciseOutput += ".<break time=\"0.2s\" />. ";
            speechExerciseOutput += "and hips width apart";
            speechExerciseOutput += ".<break time=\"0.2s\" />. ";
            speechExerciseOutput += "Inhale, with pelvis in neutral position";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Exhale, tilt the pelvis back";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Repeat 4 more times.";
            speechExerciseOutput += ".<break time=\"4s\" />. ";
            speechExerciseOutput += ".<break time=\"6s\" />. ";
        }else if (pose.id === 511){ //Basic Bridge
            speechExerciseOutput += "Stay on your back with your knees bent";
            speechExerciseOutput += ".<break time=\"0.5s\" />. ";
            speechExerciseOutput += "Place your heels under the knees";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Inhale, with pelvis is neutral position";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Exhale, and press your feet into the mat";
            speechExerciseOutput += ".<break time=\"0.5s\" />. ";
            speechExerciseOutput += "squeeze your butt as you lift your hips up off the mat.";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Inhale. Stay in the position";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Exhale. Roll your spine down onto the mat one vertebrae at a time";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Repeat 6 more times.";
            speechExerciseOutput += ".<break time=\"4s\" />. ";
            speechExerciseOutput += ".<break time=\"6s\" />. ";
            speechExerciseOutput += ".<break time=\"6s\" />. ";
        }else if (pose.id === 266){ //Pulse your arms 100 times    
            speechExerciseOutput += "Get in position for the " + pose.name;  
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Pulse your arms";
            speechExerciseOutput += ".<break time=\"0.1s\" /> ";
            speechExerciseOutput += "Inhale through the nose for 5 counts";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Exhale through the mouth for 5 counts.";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Inhale 5 times";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Exhale 5 times";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Inhale";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Exhale";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Repeat 7 more times";
            speechExerciseOutput += "<break time=\"3s\" />. ";
            speechExerciseOutput += "<break time=\"3s\" />. ";
            speechExerciseOutput += "<break time=\"3s\" />. ";
            speechExerciseOutput += "Keep going 5 more times.";
            speechExerciseOutput += "<break time=\"3s\" /> ";
            speechExerciseOutput += "<break time=\"3s\" />";
            speechExerciseOutput += "<break time=\"3s\" />";
            speechExerciseOutput += "<break time=\"3s\" />";
            speechExerciseOutput += "Almost there! 90";
            speechExerciseOutput += ".<break time=\"3s\" />. ";
            speechExerciseOutput += "Good job! Relax.";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
        }else if (pose.id === 547){ //Reverse Plank
            speechExerciseOutput += "Begin seated with your hands placed on the ground for the " + pose.name;
            speechExerciseOutput += "<break time=\"0.7s\" />. ";
            speechExerciseOutput += "Stand into your palms to engage the backs of the upper arm and to help lift the chest.";
             speechExerciseOutput += "<break time=\"0.2s\" />. ";
            speechExerciseOutput += "Inhale and lift your hips off the floor ";
            speechExerciseOutput += "<break time=\"0.5s\" />. ";
            speechExerciseOutput += "Exhale and carefully control your hips to the floor";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Repeat 2 more times";
            speechExerciseOutput += ".<break time=\"4s\" />. ";     
            speechExerciseOutput += ".<break time=\"6s\" />. ";
        }else if (pose.id === 291){ //Swan Dive
            speechExerciseOutput += "Lay on your back ";
            speechExerciseOutput += "<break time=\"2s\" />. ";
            speechExerciseOutput += "Start";
            speechExerciseOutput += ".<break time=\"10s\" />. ";     
            speechExerciseOutput += ".<break time=\"9s\" />. ";
         }else if (pose.id === 528){ //Toe Taps
            speechExerciseOutput += "Lay on your back with your knees bent";
            speechExerciseOutput += "<break time=\"0.2s\" />. ";
            speechExerciseOutput += "lift your legs to tabletop";
            speechExerciseOutput += "<break time=\"0.7s\" />. ";
            speechExerciseOutput += "Inhale. Lower your right leg";
            speechExerciseOutput += "<break time=\"0.1s\" />. ";
            speechExerciseOutput += "keeping them at 90 degree angle ";
            speechExerciseOutput += "<break time=\"0.2s\" />. ";
            speechExerciseOutput += "Exhale. Lift right leg back up to table top";
            speechExerciseOutput += "<break time=\"1s\" />. ";
            speechExerciseOutput += "Alternate legs";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Repeat the movement at your own pace.";
            speechExerciseOutput += ".<break time=\"2s\" />. ";    
            speechExerciseOutput += ".<break time=\"4s\" />. ";            
            speechExerciseOutput += "<break time=\"9s\" />. ";
        }else if (pose.id === 499){ //Toe Taps
            speechExerciseOutput += "Lift both legs to tabletop";
            speechExerciseOutput += "<break time=\"0.7s\" />. ";
            speechExerciseOutput += "Inhale as you lower both legs ";
            speechExerciseOutput += "<break time=\"0.1s\" />. ";
            speechExerciseOutput += "keeping them at 90 degree angle ";
             speechExerciseOutput += "<break time=\"0.2s\" />. ";
            speechExerciseOutput += "Exhale to lift both legs back up to table top";
            speechExerciseOutput += "<break time=\"0.5s\" />. ";
            speechExerciseOutput += "Repeat movement a few more times";
            speechExerciseOutput += ".<break time=\"4s\" />. ";
            speechExerciseOutput += ".<break time=\"6s\" />. ";
            speechExerciseOutput += "<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
        }else if (pose.id === 529){ //Basic Upper Curl
            speechExerciseOutput += "Lift both legs to tabletop";
            speechExerciseOutput += "<break time=\"0.7s\" />. ";
            speechExerciseOutput += "Place your arms behind your head. ";
             speechExerciseOutput += "<break time=\"1s\" />. ";
            speechExerciseOutput += "Lift and lower the torso";
            speechExerciseOutput += "<break time=\"3s\" />. ";
            speechExerciseOutput += "Repeat movement a few more times";
            speechExerciseOutput += ".<break time=\"4s\" />. ";
            speechExerciseOutput += ".<break time=\"6s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
            speechExerciseOutput += ".<break time=\"10s\" />. ";
        }else if (pose.id === 541){ //Repeat 3-5 times (standing roll down)
            speechExerciseOutput += "Let's stand up for this pose ";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Legs width apart and knees soft";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Inhale to lower the chin towards the chest";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Exhale";
            speechExerciseOutput += ".<break time=\"2s\" />. ";
            speechExerciseOutput += "Inhale and pause at the bottom";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += "Exhale and come up";
            speechExerciseOutput += ".<break time=\"1s\" />. ";
            speechExerciseOutput += " Head comes up last.";
            speechExerciseOutput += "<break time=\"5s\" />. ";
            speechExerciseOutput += "Repeat 2 more times";
            speechExerciseOutput += "<break time=\"5s\" />";
            speechExerciseOutput += "<break time=\"5s\" />";
            speechExerciseOutput += "<break time=\"5s\" />";
        }else{  //Generic timining   
            //console.log("Exercise duration " + pose.duration + " formatted " + getFormattedDuration(pose.duration));
            speechExerciseOutput += ". Go. ";
            //var duration = getFormattedDuration(pose.duration);      
            for(var i = 0; i < 10; i++){
                speechExerciseOutput += "<break time=\"5s\" />. ";
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
      path: '/api/v1/workouts/530', //680, 649, 530, 688
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


// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var alop = new ALotOfPilates();
    alop.execute(event, context);
};
