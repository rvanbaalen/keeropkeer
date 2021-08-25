export function $(id) {
    return document.getElementById(id);
}

export function randomString(length = 6) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, length);
}

export function forEachQuery(query, callback) {
    Array.prototype.forEach.call(
        document.querySelectorAll(query), callback
    );
}

// From https://stackoverflow.com/questions/39997067/es6-unique-array-of-objects-with-set
export const uniqueArray = a => [...new Set(a.map(o => JSON.stringify(o)))].map(s => JSON.parse(s));
