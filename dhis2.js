const axios = require('axios');
const https = require('https')
const config = require('config')

const dhis2source = axios.create({
    baseURL: config.get('dhis2source.baseUrl'),
});




dhis2source.interceptors.request.use((request) => {
    request.headers = {
        Authorization: config.get('dhis2source.token'),
        "Content-Type": "application/json"
    }
    return request;
}, (error) => { return Promise.reject(error) });


const dhis2destination = axios.create({
    baseURL: config.get('dhis2destination.baseUrl')
});

dhis2destination.defaults.timeout = 30000;
dhis2destination.defaults.httpsAgent = new https.Agent({ keepAlive: true });

dhis2destination.interceptors.request.use((request) => {
    request.headers = {
        Authorization: config.get('dhis2destination.token'),
        "Content-Type": "application/json"
    }
    return request;
}, (error) => { return Promise.reject(error) });


exports.dhis2source = dhis2source;
exports.dhis2destination = dhis2destination;