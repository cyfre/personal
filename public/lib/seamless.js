(() => {
    if (window.self !== window.top) {
        document.body.style.background = 'none';
        document.body.classList.add('seamless');
        window.parent.document.querySelector('iframe').parentElement.classList.add('seamless');
    }
})()