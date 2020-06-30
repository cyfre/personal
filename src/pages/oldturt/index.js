import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useInput } from '../../lib/hooks';
import './turt.css';

const About = (props) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="About">
            <div className="tab centering" onClick={() => setOpen(!open)}>{open ? 'x' : '?'}</div>
            { open &&
                <content>
                    <p>Turt Smurts!</p>

                    <p>
                        Tap the turtle for a little bit of wisdom, <br/>
                        or share your own favorite quotes for others to see
                    </p>
                </content>
            }
        </div>
    )
}

const Wisput = (props) => {
    const {
        value: wisdom,
        bind: bindWisdom,
        reset: resetWisdom
    } = useInput('');
    const {
        value: name,
        bind: bindName
    } = useInput('');
    const [sending, setSending] = useState(false);
    const [open, setOpen] = useState(false);

    const handle = {
        open: () => {
            setOpen(!open);
        },
        submit: (e) => {
            e.preventDefault();
            console.log(`${wisdom} ${name || 'anonymous'}`);
            if (!sending && wisdom) {
                setSending(true);
                api.create('/turt', {
                    content: wisdom,
                    author: name || 'anonymous'
                }, data => {
                    console.log(data);
                    resetWisdom();
                    setSending(false);
                    props.onWisput(data._id);
                });
            }
        }
    }

    return (
        <div className={`Wisput ${open ? "open" : ""}`}>
            <div className="tab centering" onClick={handle.open}>{open ? '-' : '+'}</div>
            <form onSubmit={handle.submit}>
                <div className="inputs">
                    <input type="text" placeholder="What are some wise words?" {...bindWisdom} />
                    <input type="text" placeholder=" - anonymous" {...bindName} />
                </div>
                <input className="button" type="submit" value="Submit" />
            </form>
        </div>
    )
}

export default (props) => {
    const [wisdom, setWisdom] = useState('Tap me for some wisdom :-)');
    const [author, setAuthor] = useState('Turt Smurts');
    const [visible, setVisible] = useState(true);
    const [responding, setResponding] = useState(false);

    const handle = {
        turtle: () => {
            if (!responding) {
                setResponding(true);
                setVisible(false);
                if (Math.random() > 0.5) {
                    setTimeout(() => {
                        fetch('https://api.quotable.io/random')
                        .then(res => res.json())
                        .then(data => {
                            console.log(data);
                            setWisdom(data.content);
                            setAuthor(data.author);
                            setVisible(true);
                            setResponding(false)
                        });
                    }, 1000);
                } else {
                    setTimeout(() => api.read('/turt/random/', data => {
                        console.log(data);
                        setWisdom(data.content);
                        setAuthor(data.author);
                        setVisible(true);
                        setResponding(false);
                    }), 1000);
                }
            }
        },
        wisput: (id) => {
            setResponding(true);
            setVisible(false);
            setTimeout(() => api.read(`/turt/${id}`, data => {
                console.log(data);
                setWisdom(data.content);
                setAuthor(data.author);
                setVisible(true);
                setResponding(false);
            }), 1000);
        }
    }

    useEffect(() => {
        document.title = "Turt Smurts";
    });

    return (
        <div className="Turt">
            <About />
            <div className={`quote-container ${visible ? "" : " unvisible"}`}>
                <div className="quote">
                    <p className="wisdom">{wisdom}</p>
                    <p className="author">
                        <span className="text">{author}</span>
                    </p>
                </div>
            </div>
            <p className="turtle" onClick={handle.turtle}>🐢</p>
            <Wisput onWisput={handle.wisput} />
        </div>
    );
}