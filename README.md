# Node.js Alexa Skills For A Lot Of Pilates

##ALOP Alexa Skills Documentation
Start a pilates class from Amazon Echo. This code communicates with A Lot Of Pilates(ALOP) API to start a pilates class. Two slots are available. One slot is class duration and the other is class type. Options for class duration is 10, 30, 50 minutes. Options for class type is Stretching, Pilates or Power Pilates.

For video and audio classes assess alotofpilates.com 

## Setup
To run this skill on your Echo device, you must setup the following accounts:
* create an AWS Lamda function, 
* create an Alexa Skill via amazon developer console
* connect Alexa Skills to the Lambda function. 
* deploy the code to AWS Lamda and test it in Amazon Developer console. 
* you can also check the logs via AWS Cloud Watch (no need for any setup here). 
* get an API key for A Lot Of Pilates API at https://a-lot-of-pilates.3scale.net/docs

