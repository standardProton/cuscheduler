import styles from "styles/Main.module.css";

export default function Popup({visible, setVisible, onClose, children}){
    if (!visible) return (<></>);
    
    return (
        <div className={styles.popup_container} id="popup-bg" onClick={(e) => {
            if (e.target.id == "popup-bg" || e.target.id == "popup-bg-center") {
                setVisible(false);
                if (onClose != undefined) onClose();
            }
        }}>
            <center id="popup-bg-center">
                <div className={styles.popup} id="popup-contents">
                    {children}
                </div>
            </center>
        </div>
    )
}