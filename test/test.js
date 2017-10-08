var assert  = require('assert');
var config = require('./../src/config');
var MyLambdaFunction = require('./../src/index.js'); // Your Lambda source with exports.handler


// beforeEach(function(){
// 	var waitTill = new Date(new Date().getTime() + 2.1 * 1000);
//     while(waitTill > new Date()){}
// });

describe('HelpIntent', function() {
	it('should handle Help Intent', function(done) {
		var request = { "type": 'IntentRequest',
						"locale": 'en-US',
						"intent": { "name": 'AMAZON.HelpIntent', "confirmationStatus": 'NONE' },
						"dialogState": 'STARTED' }
		var eventJSON = prepareTestRequest({}, true, request);
		MyLambdaFunction['handler'] (eventJSON, context, function(err, data){
			if (err) return done(err);					
			assert.equal(" Welcou looking for deals? ", outputText(data));
			done();			
		});
	});
});

describe('LaunchRequest', function() {
	it('should handle LaunchRequest Intent', function(done) {
		var request =  {
			"type": 'LaunchRequest',
			"locale": 'en-US'
		};
		var eventJSON = prepareTestRequest({}, true, request);
		MyLambdaFunction['handler'] (eventJSON, context, function(err, data){
			if (err) return done(err);					
			assert.equal(" Welcome to MyStylin!In what city are you looking for deals? ", outputText(data));
			done();
		});
	});
});

describe('GetDealsNearMeIntent', function() {
	it('should handle GetDealsNearMeIntent Intent', function(done) {
		var request =  { "type": 'IntentRequest',
						"locale": 'en-US',
						"intent": { "name": 'GetDealsNearMeIntent',
									"confirmationStatus": 'NONE',
									"slots": {
										"treatment": { "name": 'treatment', "confirmationStatus": 'NONE' }
									}},
						"dialogState": 'STARTED' };

		var eventJSON = prepareTestRequest({}, true, request);
		MyLambdaFunction['handler'] (eventJSON, context, function(err, data){
			if (err) return done(err);					
			assert.equal(" Please enable Location permissions in the Amazon Alexa app. Or ask MyStylin for deals in your city. ", outputText(data));
			assert.equal("_DEALNEARMODE", data.sessionAttributes.STATE);
			done();	
		});
	});

	it('should handle GetDealsNearMeIntent Intent with treatment slot', function(done) {
		var request =  { "type": 'IntentRequest',
						"locale": 'en-US',
						"intent": { "name": 'GetDealsNearMeIntent',
									"confirmationStatus": 'NONE',
									"slots": {
										"treatment": { "name": 'treatment', "value": 'products' }
									}},
						"dialogState": 'STARTED' };

		var eventJSON = prepareTestRequest({}, true, request);
		MyLambdaFunction['handler'] (eventJSON, context, function(err, data){
			if (err) return done(err);					
			assert.equal(" Please enable Location permissions in the Amazon Alexa app. Or ask MyStylin for deals in your city. ", outputText(data));
			assert.equal("_DEALNEARMODE", data.sessionAttributes.STATE);
			done();	
		});
	});
});


describe('OneshotGetDealsIntent', function() {
	it('should handle OneshotGetDeals Intent with valid treatment and city', function(done) {
		var request = {
						"type": "IntentRequest",					 
						"locale": "en-US",
						"intent": {
						"name": "OneshotGetDealsIntent",
						"confirmationStatus": "NONE",
						"slots": {
							"city": {
								"name": "city",
								"value": "mentor, ohio"
							},
							"treatment": {
								"name": "treatment",
								"value": "nails"
							}
						}
						},
						"dialogState": "COMPLETED"
						};
		var eventJSON = prepareTestRequest({}, true, request);

		MyLambdaFunction['handler'] (eventJSON, context, function(err, data){
			if (err) return done(err);
			assert.equal(" Tutto by Jill Nelson Salon Loft 19 Mayfield  has a good deal.The SHELLAC Brand system works together like no other to deliver two weeks of high-performance wear with nail damage free removal and is safely cured under an LED Lamp.\r\nRegular price is $37 + tax.\r\n*can only be redeemed once per client\r\n*cannot be combined with other offers. This offer expires on Saturday,October 21 2017 "
				, outputText(data));
			assert.equal("_STARTMODE", data.sessionAttributes.STATE);
			done();
		});
	});
// });

// describe('OneshotGetDealsIntent', function() {
	it('should handle OneshotGetDeals Intent with invalid city', function(done) {
		var request = {
						"type": "IntentRequest",					 
						"locale": "en-US",
						"intent": {
						"name": "OneshotGetDealsIntent",
						"confirmationStatus": "NONE",
						"slots": {
							"city": {
								"name": "city",
								"value": "nonexistingcity, nonexistingstate"
							},
							"treatment": {
								"name": "treatment",
								"value": "nails"
							}
						}
						},
						"dialogState": "COMPLETED"
						};
		var eventJSON = prepareTestRequest({}, true, request);

		MyLambdaFunction['handler'] (eventJSON, context, function(err, data){
			if (err) return done(err);					
			assert.equal(" We were unable to locate a deal near you. How about if you ask MyStylin for deals in your city? You can say Cleveland, OH. ", 
				outputText(data));			
			done();
		});
	});

	it('should handle OneshotGetDeals Intent without city slot', function(done) {
		var request = {
						"type": "IntentRequest",					 
						"locale": "en-US",
						"intent": {
						"name": "OneshotGetDealsIntent",
						"confirmationStatus": "NONE",
						"slots": {
								"treatment": { "name": 'treatment', "confirmationStatus": 'NONE' },
								"city": { "name": 'city', "confirmationStatus": 'NONE' }			
							}
						},
						"dialogState": "COMPLETED"};
		var eventJSON = prepareTestRequest({}, true, request);

		MyLambdaFunction['handler'] (eventJSON, context, function(err, data){
			if (err) return done(err);					
			assert.equal(" We were unable to locate a deal near you. How about if you ask MyStylin for deals in your city? You can say Cleveland, OH. ", 
				outputText(data));			
			done();
		});
	});
});


function outputText(data){
	console.log("DATA",data);
	var textToSay = data.response.outputSpeech.ssml;
	textToSay = textToSay.replace('<speak>', '');
	textToSay = textToSay.replace('</speak>', '');
	return textToSay;
}


function prepareTestRequest(sa, newSession, request){
	var eventJSON = {
	        "session": {
	            "sessionId": "'SessionId.e189e1e8-7491-4c5d-a09d-2eab59c97649",
	            "application": {
	                "applicationId": config.app_id
	            },
	            "attributes": sa,
	            "user": {
	                "userId": "amzn1.ask.account.AFOELVXW56EYPRUZHDLK4CNDOGGRT2OT5UDAJJBFSA7WERCDULS63FIHNIKROZAQOXLZJKW2HRLXWVHLDEMUJDUYFFV7SDSYXCVRIRIU4IAYEXJJ3HUFY7XULLEWN6FO2VJNSZE232L6SU7XDLY47ZFVGKD6GGJINGNKS3DEADEXUNXGT55HVEYVPTKBKS4JCZWMWNTI3ZA2YGY",
	                accessToken: null
	            },
	            "new": newSession
	        },
	        request,
	        "version": "1.0"
	    };
	return eventJSON;
}