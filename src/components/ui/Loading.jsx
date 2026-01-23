import React from 'react';

const Loading = ({ text = 'Cargando...' }) => {
  return (
    <div className="loading">
      <div className="spinner"></div>
      {text && <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>{text}</span>}
    </div>
  );
};

export default Loading;
