/**
 * This class contains all helper function definitions
 * 
 */
var AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');


var getTreatmetSlot = function(request) {
    var slot = request.intent.slots["treatment"];
    var slotValue;
    if (slot && slot.value){
        if(slot.value.toLowerCase()){
            return request.intent.slots.treatment.value;
        }
    }else{
        //TODO: currently treatment is a required value in the API     
        return "hair";
	}
};

var getCitySlot = function(request) {
    var slot = request.intent.slots["city"];
    var slotValue;
    if (slot && slot.value){
        if(slot.value.toLowerCase()){
            return request.intent.slots.city.value;
        }
    }else{
        //TODO: currently location is a required value in the API     
        return "Solon, OH";
    }
};

var getAddress = function(context){
    
    //TODO: currently zip is a required value in the API  
    var defaultAddress = { "countryCode" : "US","postalCode" : 44139};
    console.log("Is permission user permission", context.System.user.permissions);
    if (context.System.user.permissions){
        console.log("Looking for user permissions");
        var consentToken = context.System.user.permissions.consentToken;
        if(!consentToken){
            //TODO: what should we do if the user does not have location permission set?
            console.log("User does not consent to look at location, use default");
            return false;
        }
        console.log("User consent to look at location, get device location");
        var deviceId = context.System.device.deviceId;
        var apiEndpoint = context.System.apiEndpoint;

        var alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
        var addressRequest = alexaDeviceAddressClient.getCountryAndPostalCode();

        addressRequest.then((addressResponse) => {
            switch(addressResponse.statusCode){
                case 200:
                    console.log("Address successfully retrieved, now responding to user.");
                    return addressResponse.address;
                    break;               
                default:
                    //this.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
            }
        });
    }else{
        //testing from Service Simulator
        console.log("Default Address returned");
        return defaultAddress;
    }
};


module.exports = {
	"getTreatmetSlot": getTreatmetSlot,
    "getCitySlot":getCitySlot,
    "getAddress": getAddress
};