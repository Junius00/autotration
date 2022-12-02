import React from "react";
import SquareButton from "../SquareButton";

const CyclicButton = ({ enabled, states }) => {
    if (!states) throw "CyclicButton requires a 'state' prop, passed as an array of ButtonStates.";

    const [ i, setI ] = React.useState(0);

    const goNext = () => { setI((i + 1) % states.length); }
    const state = states[i];

    return <SquareButton 
        enabled={enabled}
        state={state}
        goNext={goNext}
    />;
}

export default CyclicButton;