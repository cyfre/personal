import { useState, useEffect } from 'react';
import { auth, addAuthTrigger, removeAuthTrigger } from './auth';

// reference here: https://rangle.io/blog/simplifying-controlled-inputs-with-hooks/

const useE = (...props) => {
    let func = props.pop()
    useEffect(() => func(), props)
}
const useF = (...props) => {
    let func = props.pop()
    useEffect(() => { func() }, props)
}

const useInput = (initialValue) => {
    const [value, setValue] = useState(initialValue);

    return {
        value,
        setValue,
        bind: {
            value,
            onChange: e => setValue(e.target.value)
        },
        reset: () => setValue(initialValue),
    };
};

const useScript = (src) => {
    useE(src, () => {
        let script = document.createElement('script');
        script.src = src;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    });
}

const useTitle = (title) => {
    useE(title, () => {
        const prevTitle = document.title;
        document.title = title;
        return () => {
            if (document.title === title) {
                document.title = prevTitle;
            }
        }
    });
}

const useLink = (href, rel) => {
    useE(href, rel, () => {
        let link = document.createElement('link');
        link.href = href;
        link.rel = rel;
        document.body.appendChild(link);
        return () => {
            document.body.removeChild(link);
        }
    });
}

const cleanupId = (id, callback) => () => callback(id);

const useTimeout = (callback, ms) =>
    useE(callback, ms, () => cleanupId(setTimeout(callback, ms), id => clearTimeout(id)));

const useInterval = (callback, ms) =>
    useE(callback, ms, () => cleanupId(setInterval(callback, ms), id => clearInterval(id)));

const useEventListener = (target, type, callback, useCapture) =>
    useE(target, type, callback, useCapture, () => cleanupId(
        target.addEventListener(type, callback, useCapture),
        () => target.removeEventListener(type, callback, useCapture),
    ));

const useAnimate = (animate) =>
    useE(animate, () => {
        let id;
        const wrappedAnimate = (timestamp) => {
            id = requestAnimationFrame(wrappedAnimate);
            animate(timestamp);
        }
        wrappedAnimate(performance.now());
        return () => cancelAnimationFrame(id);
    });

const useAuth = () => {
    const [localAuth, setLocalAuth] = useState(Object.assign({}, auth));
    useE(() => {
        let callback = auth => setLocalAuth(Object.assign({}, auth))
        addAuthTrigger(callback);
        return () => removeAuthTrigger(callback);
    });

    return localAuth;
}

export {
    useE, useF,
    useInput,
    useScript,
    useTitle,
    useLink,
    useTimeout,
    useInterval,
    useEventListener,
    useAnimate,
    useAuth
}