function fetchCookie(name) {
  let namedCookie = document.cookie
      .split(';').reverse()
      .find(cookie => cookie.startsWith(name));
  return namedCookie ? JSON.parse(namedCookie.split('=')[1]) : false;
}
function saveCookie(name, value) {
  // save cookie for ten years
  document.cookie = `${name}=${JSON.stringify(value)};expires=${60*60*24*365*10}`;
  fetchCookie(name);
}

function fetchCookies(names) {
  return {...names.map(name => ({ [name]: fetchCookie(name) }))}
}
function saveCookies(object) {
  Object.entries(object).map(entry => saveCookie(...entry));
}

function getStored(key) {
  let str = window.localStorage.getItem(key);
  return str ? JSON.parse(str) : fetchCookie(key)
}
function setStored(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
  return getStored(key)
}
function clearStored(key) {
  window.localStorage.removeItem(key)
  document.cookie = `${key}=;expires=0`;
}