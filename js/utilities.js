/**
 * Shorthand function for document.getElementById()
 * @param id
 * @returns {HTMLElement}
 */
export function $(id) {
    return document.getElementById(id);
}

/**
 * Create a random string with given length
 * @param length The length of the string
 * @returns {string}
 */
export function randomString(length = 6) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, length);
}

/**
 * Shorthand function for document.querySelectorAll.forEach
 * @param query
 * @param callback
 */
export function forEachQuery(query, callback) {
    Array.prototype.forEach.call(
        document.querySelectorAll(query), callback
    );
}

/**
 * Render template strings into actual node elements
 * @param tpl Template string
 * @returns {Element}
 */
export function R(tpl) {
    const tmp = document.createElement('div');
    tmp.innerHTML = tpl;
    return tmp.firstElementChild;
}
