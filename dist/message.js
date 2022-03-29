
const MessageBox = React.memo((props) => {
    const [state, dispatch] = React.useContext(window.Context);

    return (
        <p className={`message__senderBox ${props.from == state.myNumber ? "message__self" : ""} ${props.className || ""}`}>
            {props.children}
        </p>
    )
});

window.MessageContainer = React.forwardRef((props, ref) => {
    const [state, dispatch] = React.useContext(window.Context)
    const [messages, setMessages] = React.useState([]);
    const [message, setMessage] = React.useState("");

    const textInput = React.useRef();

    React.useImperativeHandle(ref, () => {

    }, []);

    React.useEffect(() => {
        if (!state.myNumber) return e => e;

        const socket = window.getSocket(state.myNumber);
        socket.on("dialpad-message", async (data) => {

        })

        return () => {
            socket.off("dialpad-message");
        };
    }, [props]);

    const sendDialpadMessage = async () => {
        const request = new Request(`${window.env.SOCKET_URL}/socket/dialpad/send-text`, {
            method: 'POST', 
            body: JSON.stringify({
                from: state.myNumber,
                message,
                to: state.callingTo || (state.incomingOffer && state.incomingOffer.from),
                created_at: new Date().toISOString(),
            })
        });
        const response = await (await fetch(`${window.env.SOCKET_URL}/socket/dialpad/send-text`,{method: "POST"})).json();
        console.log(response)
    }

    return (
        <div className={`message__container ${props.className || ""}`}>
            <div className={`message__head`}>
                <button type="button" className="btn">
                    <span className={`mdi mdi-chevron-down`}></span>
                </button>
                <p style={{ flex: 1 }}>Messages</p>
            </div>
            <div className="message__body">
                <MessageBox from={state.myNumber}>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
                <MessageBox>Hey there!!</MessageBox>
            </div>
            <div className="message__footer">
                <div
                    className="message__input"
                    ref={textInput}
                    onKeyDown={(e) => {
                        setMessage(e.target.innerText);
                    }}
                    // onPasteCapture={(e) => {
                    //     setPastedImg(e.clipboardData.files);
                    // }}
                    // onKeyUp={mentionUser}
                    data-placeholder={"Type a Message"}
                    contentEditable={true}
                />
                <button type="button" className="btn" onClick={sendDialpadMessage}>
                    <span className={`mdi mdi-send`}></span>
                </button>
            </div>
        </div>
    );
});
