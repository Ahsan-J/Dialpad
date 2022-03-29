// 
const ContactBox = React.memo((props) => {
    const [state, dispatch] = React.useContext(window.Context);

    if(!props.contact) return null;
    if(!parseInt(props.contact.elsemployees_ext)) return null;

    const onInitCall = () => {
        dispatch({
            type: "SET_CALLING_TO",
            callingTo: props.contact.elsemployees_ext,
        });
    };

    return (
        <div className={`contact__containerBox ${props.className || ""}`}>
            <div>
                <h3>{props.contact.elsemployees_ext}</h3>
                <p>{props.contact.elsemployees_name}</p>
            </div>
            <button type="button" className="btn btn-success" onClick={onInitCall}>
              <span className={`mdi mdi-phone`}></span>
            </button>
        </div>
    )
});

window.ContactList = React.forwardRef((props, ref) => {
    const [state, dispatch] = React.useContext(window.Context)

    const onReturn = () => {
        dispatch({
            type: "SET_SHOW_CONTACTS",
            showContacts: false 
        })
    }

    return (
        <div className={`directory__container ${props.className || ""}`}>
            <button className="badge rounded-pill bg-danger" onClick={onReturn}>Return to phone</button>
            <h6 id="header_text">{window.env.companyName} Contact Details</h6>
            {state.contacts.map((contact) => <ContactBox contact={contact}/>)}
        </div>
    );
});
