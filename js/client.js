import {API_BASE} from "./config.js";

function fetchConfig(method = 'GET', data = false) {
    let config = {
        method,
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    };
    if (data !== false) {
        config.body = JSON.stringify(data) // body data type must match "Content-Type" header
    }

    return config;
}

// From https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function sendData(method = 'POST', path = '', data = {}) {
    // Default options are marked with *
    const url = API_BASE + path;
    const response = await fetch(url, fetchConfig(method, data));

    return response.json(); // parses JSON response into native JavaScript objects
}

export async function postData(path = '', data = {}) {
    return sendData('POST', path, data);
}

export async function updateData(path = '', data = {}) {
    return sendData('PUT', path, data);
}

export async function deleteData(path = '') {
    return sendData('DELETE', path);
}

export async function getData(path = '', data = {}) {
    const url = API_BASE + path;
    const response = await fetch(url, fetchConfig());

    return response.json();
}
