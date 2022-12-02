import { useState } from "react";
import { connectReq } from "../socket";

const ConnectWidget = ({ socket, setBoardReady }) => {
    const [ port, setPort ] = useState('COM4');
    const [ errorMsg, setErrorMsg ] = useState();

    return <div>
        <h1>Enter a port to connect.</h1>
        <input onChange={(event) => setPort(event.target.value.toLocaleUpperCase())}/>
        <button onClick={() => {
            setErrorMsg(`Attempting to connect to ${port}...`);
            connectReq(socket, port, (isSuccess) => {
                if (!isSuccess) {
                    setErrorMsg('Failed to connect. Please try another port and/or check connection.');
                    return;
                }

                setBoardReady(true);
            })
        }}>Connect</button>
        {errorMsg && <p>{errorMsg}</p>}
    </div>;
};

export default ConnectWidget;