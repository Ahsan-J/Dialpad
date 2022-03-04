"use strict";

const Dialpad = React.memo((props) => {
  const { onDialPress } = props;

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if ((/\d/.test(e.key) || ["*", "#"].includes(e.key)) && onDialPress)
        onDialPress(e.key);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onDialPress]);

  const renderLinearDialPad = React.useMemo(
    () =>
      [...Array(9)].map((_, i) => {
        const value = i + 1;
        const onClick = (e) => {
          e.preventDefault();
          if (onDialPress) onDialPress(value);
        };
        return (
          <button
            key={value}
            type="button"
            className="btn btn-primary dialpad__number"
            onClick={onClick}
          >
            {value}
          </button>
        );
      }),
    [onDialPress]
  );

  const renderSpecialDialPad = React.useMemo(
    () =>
      ["*", "0", "#"].map((value) => {
        const onClick = (e) => {
          e.preventDefault();
          if (onDialPress) onDialPress(value);
        };
        return (
          <button
            key={value}
            type="button"
            className="btn btn-primary dialpad__number"
            onClick={onClick}
          >
            {value}
          </button>
        );
      }),
    [onDialPress]
  );

  return (
    <React.Fragment>
      {renderLinearDialPad}
      {renderSpecialDialPad}
      <button type="button" className="btn btn-success dialpad__callBtn">
        <span className={`mdi mdi-phone`}></span>
      </button>
    </React.Fragment>
  );
});

const Output = React.memo((props) => {
  const { onBackPress } = props;

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key.toLowerCase() == "backspace" && onBackPress) onBackPress(e.key);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onBackPress]);

  return (
    <div className="output__container">
      <p>{props.children}</p>
      <span onClick={onBackPress} className="mdi mdi-backspace-outline"></span>
    </div>
  );
});

const App = React.memo(() => {
  const [outputNumber, setOutputNumber] = React.useState("");
  const [activeCaller, setActiveCaller] = React.useState({});
  const [callingTo, setCallingToUser] = React.useState({});
  const urlParams = new URLSearchParams(window.location.search);

  const onDialPress = React.useCallback((key) => {
    setOutputNumber((v) => `${v}${key}`);
  }, []);

  const onBackPress = React.useCallback((key) => {
    setOutputNumber((v) => `${v.slice(0, v.length - 1)}`);
  }, []);

  const {} = window.useCalling(urlParams.get("number"));

  React.useEffect(() => {
    window.initSocket(urlParams.get("number"));
  }, []);

  return (
    <Context.Provider value={{activeCaller, setActiveCaller, callingTo, setCallingToUser}}>
      <div
        className="card text-white bg-secondary mb-3"
        style={{ width: "20rem" }}
      >
        <div className="card-header">
          <p>Your Number: {urlParams.get("number")} </p>
          <Output onBackPress={onBackPress}>{outputNumber}</Output>
        </div>
        <div className="card-body">
          <div className="dialpad__container">
            <Dialpad onDialPress={onDialPress} />
          </div>
        </div>
      </div>
    </Context.Provider>
  );
});

ReactDOM.render(<App />, document.querySelector("#root"));
