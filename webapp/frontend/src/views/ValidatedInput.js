import React from 'react';

const ValidatedInput = ({ validator, setInput }) => {
    const [ val, setVal ] = React.useState();
    const [ errorMsg, setErrorMsg ] = React.useState();

    return <div>
        <div
            style={{
                display: 'flex',
                flexDirection: 'row'
            }}
        >
            <input onChange={(e) => setVal(e.target.value)} />
            <button onClick={() => {
                const error = validator(val);
                if (error) {
                    setErrorMsg(error);
                    return;
                } 

                setInput(val);
            }}>Submit</button>
        </div>
        {errorMsg && <p>{errorMsg}</p>}
    </div>
    
};

export default ValidatedInput;