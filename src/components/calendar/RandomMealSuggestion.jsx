import React from 'react';
import Modal from '../ui/Modal';
import { MEAL_TIME_OPTIONS, DIFFICULTY_OPTIONS } from '../../models/types';
import './RandomMealSuggestion.css';

const RandomMealSuggestion = ({
  isOpen,
  onClose,
  onAccept,
  onAnother,
  meal,
  mealTime
}) => {
  const mealTimeConfig = MEAL_TIME_OPTIONS.find(opt => opt.value === mealTime);
  const difficulty = DIFFICULTY_OPTIONS.find(d => d.value === meal?.difficulty);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sugerencia · ${mealTimeConfig?.label || 'Comida'}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-secondary" onClick={onAnother} disabled={!meal}>
            🎲 Otra
          </button>
          <button className="btn btn-primary" onClick={onAccept} disabled={!meal}>
            ✓ Aceptar
          </button>
        </>
      }
    >
      <div className="random-suggestion">
        {!meal ? (
          <p className="random-suggestion-empty">
            No hay comidas disponibles para {mealTimeConfig?.label?.toLowerCase() || 'este horario'}.
          </p>
        ) : (
          <div className="random-suggestion-card">
            <span className="random-suggestion-icon">{mealTimeConfig?.icon}</span>
            <div className="random-suggestion-info">
              {meal.code && (
                <span className="random-suggestion-code">{meal.code}</span>
              )}
              <span className="random-suggestion-name">{meal.name}</span>
              {meal.difficulty && (
                <span className={`badge badge-${difficulty?.color || 'default'}`}>
                  {meal.difficulty}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RandomMealSuggestion;
