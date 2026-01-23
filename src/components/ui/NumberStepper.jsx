import React from 'react';

const NumberStepper = ({ value, onChange, min = 0.5, max = 10, step = 0.5 }) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <div className="number-stepper">
      <button 
        onClick={handleDecrement} 
        disabled={value <= min}
        style={{ opacity: value <= min ? 0.5 : 1 }}
      >
        −
      </button>
      <span className="number-stepper-value">{value}x</span>
      <button 
        onClick={handleIncrement} 
        disabled={value >= max}
        style={{ opacity: value >= max ? 0.5 : 1 }}
      >
        +
      </button>
    </div>
  );
};

export default NumberStepper;
