window.Modal = React.forwardRef((props, ref) => {
  const { wrapper, children, className } = props;
  const [show, showModal] = React.useState(false);
  const el = React.useRef(null);

  React.useImperativeHandle(ref, () => {
    return {
      showModal,
    };
  },[]);

  const onBackdrop = React.useCallback((e) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      showModal(false);
      if (props.onBackdrop) props.onBackdrop(e, ref);
    }
  },[props, ref]);

  React.useEffect(() => {
    const modalRoot = document.getElementById("modal-root");
    el.current = el.current || document.createElement(wrapper || "div");
    el.current.setAttribute("class", "modal__backdrop");
    el.current.addEventListener("click", onBackdrop);
    
    if (show) modalRoot.appendChild(el.current);
    return () => {
      if (modalRoot.hasChildNodes() && modalRoot.contains(el.current)) modalRoot.removeChild(el.current);
    };
  }, [show, wrapper, onBackdrop]);


  if (!show && props.showChildren) return props.children;
  if (!show) return null
  return ReactDOM.createPortal(
    <div className={`modal__container ${className || ""}`}>
      {children}
    </div>,
    el.current
  );
});
