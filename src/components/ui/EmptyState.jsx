import React from 'react';

const EmptyState = ({ icon, text, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-text">{text}</p>
      {action}
    </div>
  );
};

export default EmptyState;
