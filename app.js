"use strict";

const { ContactList } = window;

const initialState = {
  myNumber: "",
  callingTo: "",
  outputNumber: "",
  showContacts: false,
  incomingOffer: null,
  contacts: []
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_CALLING_TO":
      return {
        ...state,
        callingTo: action.callingTo || state.outputNumber,
        outputNumber: action.callingTo || state.outputNumber,
        showContacts: false
      };
    case "SET_CURRENT_NUMBER":
      return {
        ...state,
        myNumber: action.myNumber,
        showContacts: false,
      };
    case "SET_INCOMING_OFFER":
      return {
        ...state,
        incomingOffer: action.incomingOffer,
        outputNumber: action.incomingOffer.from,
        showContacts: false
      };
    case "SET_OUTPUT_NUMBER":
      return {
        ...state,
        outputNumber: `${state.outputNumber}${action.outputNumber}`,
        showContacts: false,
      };
      case "REMOVE_OUTPUT_NUMBER":
        return {
          ...state,
          outputNumber: `${state.outputNumber.slice(0, state.outputNumber.length - 1)}`,
          showContacts: false,
      };
    case "SET_SHOW_CONTACTS":
      return {
        ...state,
        showContacts: action.showContacts
      }
    case "SET_USER_CONTACTS":
      return {
        ...state,
        contacts: action.contacts,
        showContacts: false,
      }
    case "RESET_STATES":
      return {
        ...state,
        outputNumber: initialState.outputNumber,
        callingTo: initialState.callingTo,
        incomingOffer: initialState.incomingOffer,
      };
    default:
      return state;
  }
};

const App = React.memo(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const [state, dispatch] = React.useContext(window.Context);

  React.useEffect(() => {
    if (!urlParams.get("number")) {
      const myNumber = prompt("Enter your number");
      window.location = window.location.pathname + `?number=${myNumber}`;
    } else {
      dispatch({
        type: "SET_CURRENT_NUMBER",
        myNumber: urlParams.get("number"),
      });
    }
  }, []);

  const getUsersContact = async (user_id) => {
    const response = await (await fetch(`${window.env.SOCKET_URL}/api/bwccrm/userdirectory`,
      {
        method: "POST",
        body: JSON.stringify({ user_id }),

      }
    )).json();
    dispatch({
      type: "SET_USER_CONTACTS",
      contacts: response.users
    });
  };

  React.useEffect(() => {
    if (state.myNumber) {
      getUsersContact(parseInt(state.myNumber));
    }
  }, [state.myNumber]);

  const { renderCallingState, renderHeader } = window.useCalling(state.myNumber);

  return (
    <div
      className="card bg-secondary border-primary mb-3"
      style={{ width: "20rem", minHeight: "36rem" }}
    >
      {renderHeader}
      <div className="card-body">
        {state.showContacts ? <ContactList number={state.myNumber} /> : renderCallingState}
      </div>
      <h6 id="footer_text">Powered by: {window.env.companyName}</h6>
    </div>
  );
});

const AppWrapper = () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <Context.Provider value={[state, dispatch]}>
      <App />
    </Context.Provider>
  );
};

ReactDOM.render(<AppWrapper />, document.querySelector("#root"));
