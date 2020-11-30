import { useState, useEffect } from 'react';

// reference here: https://rangle.io/blog/simplifying-controlled-inputs-with-hooks/

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
    useEffect(() => {
        let script = document.createElement('script');
        script.src = src;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, [src]);
}

const useTitle = (title) => {
    useEffect(() => {
        document.title = title;
    }, [title]);
}

const useLink = (href, rel) => {
    useEffect(() => {
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
    useEffect(
        () => cleanupId(setTimeout(callback, ms), id => clearTimeout(id)),
        [callback, ms]);

const useInterval = (callback, ms) =>
    useEffect(
        () => cleanupId(setInterval(callback, ms), id => clearInterval(id)),
        [callback, ms]);

const useEventListener = (target, type, callback, useCapture) =>
    useEffect(() => cleanupId(
        target.addEventListener(type, callback, useCapture),
        () => target.removeEventListener(type, callback, useCapture),
    ), [target, type, callback, useCapture]);

const useAnimate = (animate) =>
    useEffect(() => {
        let id;
        const wrappedAnimate = () => {
            id = requestAnimationFrame(wrappedAnimate);
            animate();
        }
        wrappedAnimate();
        return () => cancelAnimationFrame(id);
    }, [animate]);

export {
    useInput,
    useScript,
    useTitle,
    useLink,
    useTimeout,
    useInterval,
    useEventListener,
    useAnimate,
}