'use strict';

const Https = require('https');

/**
 * This is a small wrapper client for the Alexa Address API.
 */
class GoogleMapAddressService {

    /**
     * Retrieve an instance of the Google Maps API client.
     */
    constructor() {
        this.endpoint = 'maps.google.com';
        this.key = 'AIzaSyCQQWWc5j1hxmuJoLlMThUFxlbcMo3yGxA';
    }

    /**
     * This will make a request to the Address API using the device ID and
     * consent token provided when the Address Client was initialized.
     * This will retrieve the full address of a device.
     * @return {Promise} promise for the request in flight.
     */
    getAddress(cityName) {
        const options = this.__getRequestOptions(`/maps/api/geocode/json?key=${this.key}&address=${cityName}`);

        return new Promise((fulfill, reject) => {
            this.__handleDeviceAddressApiRequest(options, fulfill, reject);
        });
    }

    /**
     * This is a helper method that makes requests to the Address API and handles the response
     * in a generic manner. It will also resolve promise methods.
     * @param requestOptions
     * @param fulfill
     * @param reject
     * @private
     */
    __handleDeviceAddressApiRequest(requestOptions, fulfill, reject) {
        Https.get(requestOptions, (response) => {
            response.setEncoding('utf8');
           if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('FAILED TO LOAD API, STATUS CODE: ' + response.statusCode));
            }           
            var body = '';
            response.on('data', function (data){
                body += data;
            });
            response.on('end', function () {
              try{
                   // console.log(' GOOGLE API RESPONSE RESULTS: ' + body);
                    var googleAddressResponse = {
                        statusCode: response.statusCode,
                        address: JSON.parse(body).results[0].geometry.location
                    };
                }catch(e){
                    console.log("error with Google maps response parsing", e);
                    var googleAddressResponse = {
                        statusCode: 500,
                        address: {}
                    };
                }                
                fulfill(googleAddressResponse);
            });
        }).on('error', (e) => {
            console.error(e);
            reject();
        });
    }

    /**
     * Private helper method for retrieving request options.
     * @param path the path that you want to hit against the API provided by the skill event.
     * @return {{hostname: string, path: *, method: string, headers: {Authorization: string}}}
     * @private
     */
    __getRequestOptions(path) {
        return {
            hostname: this.endpoint,
            path: path,
            method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            };
    }
}

module.exports = GoogleMapAddressService;