/**
 * This class contains all helper function definitions
 * 
 */
var AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');

var getSlot = function(request, name) {
    var slot = request.intent.slots[name];
    var slotValue;
    if (slot && slot.value){
        if(slot.value.toLowerCase()){
            return request.intent.slots.treatment.value;
        }
    	return treatment;
    }else{
    	return false;
	}
};

var getAddress = function(context){
    var defaultAddress = { "countryCode" : "US","postalCode" : "44124"};
    if (context.System.user.permissions){
        var consentToken = context.System.user.permissions.consentToken;
        if(!consentToken){
            //this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
            //TODO: what should we do if the user does not have location permission set?
            return defaultAddress;
        }
        var deviceId = context.System.device.deviceId;
        var apiEndpoint = context.System.apiEndpoint;

        var alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
        var addressRequest = alexaDeviceAddressClient.getCountryAndPostalCode();

        addressRequest.then((addressResponse) => {
            switch(addressResponse.statusCode){
                case 200:
                    console.log("Address successfully retrieved, now responding to user.");
                    return addressResponse.address;
                    //var ADDRESS_MESSAGE = Messages.ADDRESS_AVAILABLE +`${address['postalCode']}, ${address['countryCode']}}`;
                   // this.emit(":tell", ADDRESS_MESSAGE);
                    break;
                case 204:
                    break;
                case 403:
                    break;
                default:
                    //this.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
            }
        });
    }else{
        //testing from Service Simulator
        return defaultAddress;
    }
};


module.exports = {
	"getSlot": getSlot,
    "getAddress": getAddress
};