import React from 'react';

const SpacedColumn = ({ spacing = 10, align = 'center', children }) => {
    if (!children || children.length <= 1) return children;

    return <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: align
        }}
    >
        {children.map((child, i) => <div
            key={i}
            style={{
                marginTop: i > 0 ? spacing : 0
            }}
        >
            {child}
        </div>)}
    </div>;
}

export default SpacedColumn;