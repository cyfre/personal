export function fetchCookie(name) {
    let namedCookie = document.cookie
        .split(';')
        .find(cookie => cookie.startsWith(name));
    return namedCookie ? JSON.parse(namedCookie.split('=')[1]) : false;
}
export function saveCookie(name, value) {
    // save cookie for ten years
    document.cookie = `${name}=${JSON.stringify(value)}; max-age=${60*60*24*365*10}`;
}

export function fetchCookies(names) {
    return {...names.map(name => ({ [name]: fetchCookie(name) }))}
}
export function saveCookies(object) {
    Object.entries(object).map(entry => saveCookie(...entry));
}