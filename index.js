import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import prettyBytes from 'pretty-bytes';
import setUpEditors from './setupEditor';
import { EditorView } from '@codemirror/view';

// Reference the HTML DOM Elements in the index.html
const form = document.querySelector('[data-form]');
const queryParamsContainer = document.querySelector('[data-query-params]');
const requestHeadersContainer = document.querySelector('[data-request-headers]');
const keyValueTemplate = document.querySelector('[data-key-value-template]');
const responseHeadersContainer = document.querySelector('[data-response-headers]');


document.querySelector('[data-add-query-param-btn]').addEventListener('click', () => {
    queryParamsContainer.append(createKeyValuePair());
});

document.querySelector('[data-add-request-header-btn]').addEventListener('click', () => {
    requestHeadersContainer.append(createKeyValuePair());
});

queryParamsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());


// Interceptors

axios.interceptors.request.use(request => {
    request.customData = request.customData || {};
    request.customData.startTime = new Date().getTime();
    return request;
});

function updateEndTime(response){
    response.customData = response.customData || {};
    response.customData.time = new Date().getTime() - response.config.customData.startTime;
    return response;
}


axios.interceptors.response.use(res => updateEndTime(res), err => {
    return Promise.reject(updateEndTime(err.response));
});


// Get the return values from setUpEditors function which has been imported from 
// setUpEditor.js to display the body container in json format.
const {requestEditor, updateResponseEditor} = setUpEditors();

form.addEventListener('submit', (e) => {
    e.preventDefault();

    let data;

    try {
        data = JSON.parse(requestEditor.state.doc.toString() || null);
    } catch (err) {
        alert('JSON data is undefined');
        return;
    }

    axios({
        url: document.querySelector('[data-url]').value,
        method: document.querySelector('[data-method]').value,
        params: keyValuePairsToObject(queryParamsContainer),
        headers: keyValuePairsToObject(requestHeadersContainer),
        data
    })
    .catch(err => err)
    .then(res => {

        document.querySelector('[data-response-section]').classList.remove("d-none");

        // Update response details ---> Status, Time, Size
        updateResponseDetails(res);

        // // Update Reponse body ---> Body
        updateResponseEditor(res.data);

        // Update Reponse Headers ---> Headers
        updateResponseHeaders(res.headers);

        console.log(res);
    });
});


function updateResponseDetails(res){
    document.querySelector('[data-response-status').textContent = res.status;

    document.querySelector('[data-response-time]').textContent = res.customData.time;

    document.querySelector('[data-response-size]').textContent = prettyBytes(JSON.stringify(res.data).length + JSON.stringify(res.headers).length);
}

function updateResponseHeaders(headers){
    responseHeadersContainer.innerHTML = "";

    Object.entries(headers).forEach(([key,value]) => {
        const keyElement = document.createElement('div');
        keyElement.textContent = key;
        responseHeadersContainer.append(keyElement);

        const valueElement = document.createElement('div');
        valueElement.textContent = value;
        responseHeadersContainer.append(valueElement);
    });
}

function createKeyValuePair() {
    const element = keyValueTemplate.content.cloneNode(true);
    console.log(element);
    element.querySelector('[data-remove-btn]').addEventListener('click', (e) => {
        e.target.closest('[data-key-value-pair]').remove();
    });
    return element;
}

function keyValuePairsToObject(container){
    const pairs = container.querySelectorAll('[data-key-value-pair]');
    return [...pairs].reduce( (data,pair) => {
        const key = pair.querySelector('[data-key]').value;
        const value = pair.querySelector('[data-value]').value;

        if(key === '') return data;

        return {...data, [key]: value};
    },{});
}