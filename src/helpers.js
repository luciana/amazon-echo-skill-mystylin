/**
 * This class contains all helper function definitions
 * 
 */
var AlexaDeviceAddressService = require('./AlexaDeviceAddressService'),
    GoogleMapAddressService = require('./GoogleMapAddressService');

var TREATMENTS="hair,products,nails,wellness,spa,products";

/*  This function recognizes the treatment slot 
*   If not treatment is recognized, the default returns all treatments
*   @return string list (common separated default treatment) or single string of treatment.
*/
var getTreatmetSlot = function(request) {
    var slot = request.intent.slots["treatment"];
    var slotValue;
    if (slot && slot.value){
        if(slot.value.toLowerCase()){
            return request.intent.slots.treatment.value;
        }
    }else{
        return TREATMENTS;
	}
};

/*  This function recognizes the city if spoken by the user
*   If not city is recognized, returns false
*   @return city slot or false
*/
var getCitySlot = function(request) {
    var slot = request.intent.slots["city"];
    var slotValue;
    if (slot && slot.value){
        if(slot.value.toLowerCase()){
            return request.intent.slots.city.value;
        }
    }
    return false;
};

/*  This function returns a object of address. 
*   Address object contains countryCode, postaCode, lat, lng
*   The address object is composed by information from Alexa Device address, Google Lat/Lng, or Default Address.
*   If no address is recognized, return default address object.
*   @return address object
*/
var getAddress = function(event) {
    var cityName = getCitySlot(event.request);
    var defaultAddress = { "countryCode" : "US","postalCode" : 44139, "lat": 41.3897764, "lng":-81.44122589999999};
    var address ={};
    if(cityName){
        console.log("recognized city name", cityName);
        address = getGoogleAddress(cityName);
        console.log("Address successfully retrieved from google maps", address);
        if(!address){
            console.log("Default Address returned");
            address = defaultAddress;
        }
    }else{
        console.log("attempt to get device location ");
        address = getAlexaAddress(event.context);
        console.log("Address successfully retrieved, from user alexa device", address);
        if(!address){
            console.log("Default Address returned");
            address = defaultAddress;
        }
    }
    return address;
};


/*  This function calls the AlexaDeviceAddress service to obtains the Alexa location.
*   @return address object ( containing countryCode and postalCode )
*   @return false if the user has not granted permission to identify location
*   @return false if testing using Service Simulator
*/
var getAlexaAddress = function(context){
    console.log("Is permission user permission", context.System.user.permissions);
    if (context.System.user.permissions){
        console.log("Looking for user permissions");
        var consentToken = context.System.user.permissions.consentToken;
        if(!consentToken){
            console.log("User does not consent to look at location, use default");
            return false;
        }
        console.log("User consent to look at location, get device location");
        var deviceId = context.System.device.deviceId;
        var apiEndpoint = context.System.apiEndpoint;

        var alexaDeviceAddressService = new AlexaDeviceAddressService(apiEndpoint, deviceId, consentToken);
        var addressRequest = alexaDeviceAddressService.getCountryAndPostalCode();

        addressRequest.then((addressResponse) => {
            switch(addressResponse.statusCode){
                case 200:
                    return addressResponse.address;
                    break;
                default:
                    //TODO: ?
            }
        });
    }else{
        //testing from Service Simulator        
        return false;
    }
};

/*  This function calls the GoogleMapAddress service to obtains the city lat and lng.
*   @return address object
*   @return {} if can not recognized location
*/
var getGoogleAddress = function(cityName){
        var googleMapAddressService = new GoogleMapAddressService();
        var addressRequest = googleMapAddressService.getAddress(cityName);

        addressRequest.then((addressResponse) => {
            switch(addressResponse.statusCode){
                case 200:
                    return addressResponse.address;
                    break;
                default:
                   return {};
            }
        });
    
};

module.exports = {
	"getTreatmetSlot": getTreatmetSlot,
    "getCitySlot":getCitySlot,
    "getAddress":getAddress,
    "getGoogleAddress":getGoogleAddress,
    "getAlexaAddress": getAlexaAddress
};