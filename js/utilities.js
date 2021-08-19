export function $(id) {
    return document.getElementById(id);
}

export function randomString(length = 6) {
    return Math.random().toString(16).substr(-length);
}

export function forEachQuery(query, callback) {
    Array.prototype.forEach.call(
        document.querySelectorAll(query), callback
    );
}
