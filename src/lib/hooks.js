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

export {
    useInput,
    useScript,
    useTitle,
    useLink
}