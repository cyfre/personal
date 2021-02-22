import { useState, useEffect } from 'react';
import { auth, addAuthTrigger, removeAuthTrigger } from './auth';

// reference here: https://rangle.io/blog/simplifying-controlled-inputs-with-hooks/

const useE = (func, ...props) => useEffect(func, props)

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
    useE(() => {
        let script = document.createElement('script');
        script.src = src;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, [src]);
}

const useTitle = (title) => {
    useE(() => {
        const prevTitle = document.title;
        document.title = title;
        return () => {
            if (document.title === title) {
                document.title = prevTitle;
            }
        }
    }, [title]);
}

const useLink = (href, rel) => {
    useE(() => {
        let link = document.createElement('link');
        link.href = href;
        link.rel = rel;
        document.body.appendChild(link);
        return () => {
            document.body.removeChild(link);
        }
    }, [href, rel]);
}

const cleanupId = (id, callback) => () => callback(id);

const useTimeout = (callback, ms) =>
    useE(() => cleanupId(setTimeout(callback, ms), id => clearTimeout(id)),
        [callback, ms]);

const useInterval = (callback, ms) =>
    useE(() => cleanupId(setInterval(callback, ms), id => clearInterval(id)),
        [callback, ms]);

const useEventListener = (target, type, callback, useCapture) =>
    useE(() => cleanupId(
        target.addEventListener(type, callback, useCapture),
        () => target.removeEventListener(type, callback, useCapture),
    ), [target, type, callback, useCapture]);

const useAnimate = (animate) =>
    useE(() => {
        let id;
        const wrappedAnimate = () => {
            id = requestAnimationFrame(wrappedAnimate);
            animate();
        }
        wrappedAnimate();
        return () => cancelAnimationFrame(id);
    }, [animate]);

const useAuth = () => {
    const [localAuth, setLocalAuth] = useState(Object.assign({}, auth));
    useE(() => {
        let callback = auth => setLocalAuth(Object.assign({}, auth))
        addAuthTrigger(callback);
        return () => removeAuthTrigger(callback);
    }, []);

    return localAuth;
}

export {
    useE,
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