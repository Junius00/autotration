import React from 'react';

const SquareButton = ({ enabled, state, goNext = null }) => {
    return <div
        style={{
            display: 'flex',
            cursor: enabled ? 'pointer' : 'not-allowed',
            color: state.textColor,
            backgroundColor: enabled ? state.bgColor : '#cccccc',
            width: 130,
            height: 80,
            padding: 10,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center'
        }}
        onClick={() => {
            if (enabled) state.onClick(goNext);
        }}
    >
        {enabled ? state.value: 'Not Available'}
    </div>
};

export default SquareButton;