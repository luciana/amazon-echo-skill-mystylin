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

var getAddress = function(event){
     return new Promise((fulfill, reject) => {
        var cityName = getCitySlot(event.request);                     
        var address = getGoogleAddress(cityName).then(
            (location) => {
                try{
                    console.log("Address successfully retrieved from google maps", location);
                    console.log("getting lat and long" , location.results[0].geometry.location);
                    
                    return location.results[0].geometry.location;
                }catch(e){
                    return false;
                }
            }, 
            (failure) => {
                return false;
            })
            .then((data) => {
                console.log("Tried to google map - default Address was returned", data);
                if (! data ){
                    console.log("Attempt to get device location ");
                    var addr = getAlexaAddress(event.context).then(
                            (location) => {
                                try{
                                    console.log("Address successfully retrieved, from user alexa device", location);
                                    return location;
                                }catch(e){
                                    return false;
                                }
                            },
                            (failure) => {
                               return false;
                            }
                        );
                    return addr;
                }
                return false;
            });
        if (address){
            fulfill(address);
        }else{            
            reject();
        }
    });

};


/*  This function calls the AlexaDeviceAddress service to obtains the Alexa location.
*   @return address object ( containing countryCode and postalCode )
*   @return false if the user has not granted permission to identify location
*   @return false if testing using Service Simulator
*/
var getAlexaAddress = function(context){

    return new Promise((fullfil, reject) => {
        
        if(context.System.user.permissions) {
            console.log("Looking for user permissions");
            var consentToken = context.System.user.permissions.consentToken;
            if(!consentToken){
                console.log("User does not consent to look at location, use default");
                reject();
            }

            console.log("User consent to look at location, get device location");
            var deviceId = context.System.device.deviceId;
            var apiEndpoint = context.System.apiEndpoint;

            var alexaDeviceAddressService = new AlexaDeviceAddressService(apiEndpoint, deviceId, consentToken);
            var addressRequest = alexaDeviceAddressService.getCountryAndPostalCode();

            addressRequest.then((addressResponse) => {
                switch(addressResponse.statusCode){
                    case 200:
                        fullfil(addressResponse.address);
                        break;
                    default:
                        //TODO: ?
                }
            }, (failure) => {
                reject();
            });
        }else{
             //Only return default address while testing via the Service Simulator
            console.log("Test with Service Simulator");
            var defaultAddress = { "countryCode" : "US","postalCode" : 44139};
            fullfil(defaultAddress);
            //reject();                
        }
    });
};

/*  This function calls the GoogleMapAddress service to obtains the city lat and lng.
*   @return address object
*   @return {} if can not recognized location
*/
var getGoogleAddress = function(cityName){
     return new Promise((fulfill, reject) => {
        if(!cityName){
             reject();
        }
        var city = cityName.replace(/ /g,'');
        console.log("recognized city name", city);
        var googleMapAddressService = new GoogleMapAddressService();
        var addressRequest = googleMapAddressService.getAddress(city);

        addressRequest.then((addressResponse) => {
            console.log("get Google address response", addressResponse);
            switch(addressResponse.statusCode){
                case 200:
                    fulfill(addressResponse.address);
                    break;
                default:
                   reject();
            }
        }, (failure) => {
            reject();
        });
    });

};

module.exports = {
	"getTreatmetSlot": getTreatmetSlot,
    "getCitySlot":getCitySlot,
    "getAddress":getAddress,
    "getGoogleAddress":getGoogleAddress,
    "getAlexaAddress": getAlexaAddress
};