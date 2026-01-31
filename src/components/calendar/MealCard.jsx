import React, { useState } from 'react';
import { MEAL_TIME_OPTIONS } from '../../models/types';
import { useApp } from '../../context/AppContext';
import NumberStepper from '../ui/NumberStepper';
import Modal from '../ui/Modal';
import './MealCard.css';

const MealCard = ({ scheduledMeal, onEdit, onQuickChange, onDelete }) => {
  const { sides, meals, updateScheduledMeal } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const mealTimeConfig = MEAL_TIME_OPTIONS.find(
    opt => opt.value === scheduledMeal.mealTime
  );
  
  const meal = meals.find(m => m.id === scheduledMeal.mealId);
  const selectedSide = sides.find(s => s.id === scheduledMeal.selectedSideId);
  const availableSides = meal?.sideIds?.map(
    sideId => sides.find(s => s.id === sideId || s.code === sideId)
  ).filter(Boolean) || [];

  const handleServingsChange = async (newServings) => {
    await updateScheduledMeal(scheduledMeal.id, { servings: newServings });
  };

  const handleSideChange = async (sideIdOrNull) => {
    await updateScheduledMeal(scheduledMeal.id, { selectedSideId: sideIdOrNull ?? null });
  };

  const handleOpenComplete = () => {
    setShowCompleteModal(true);
  };

  const handleCompleteConfirm = async () => {
    await updateScheduledMeal(scheduledMeal.id, { 
      completed: true
    });
    setShowCompleteModal(false);
  };

  const handleUncomplete = async () => {
    await updateScheduledMeal(scheduledMeal.id, { completed: false });
  };

  // Build display name: meal name + side name if exists
  const displayName = selectedSide 
    ? `${scheduledMeal.mealName} + ${selectedSide.name}`
    : scheduledMeal.mealName;

  return (
    <>
      <div 
        className={`meal-card ${scheduledMeal.isDelivery ? 'delivery' : ''} ${scheduledMeal.completed ? 'completed' : ''}`}
        style={{ '--meal-color': mealTimeConfig?.color }}
      >
        <div className="meal-card-header" onClick={() => setExpanded(!expanded)}>
          <div className="meal-card-time">
            <span className="meal-card-icon">{mealTimeConfig?.icon}</span>
            <span className="meal-card-label">{mealTimeConfig?.label}</span>
          </div>
          <div className="meal-card-name">
            {displayName}
            {scheduledMeal.isDelivery && (
              <span className="delivery-badge">🛵 Delivery</span>
            )}
            {scheduledMeal.completed && (
              <span className="completed-badge">✓ Completado</span>
            )}
          </div>
          <button 
            className="meal-card-expand"
            aria-label="Expandir"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
        
        {expanded && (
          <div className="meal-card-details">
            <div className="meal-card-row">
              <span className="meal-card-row-label">Porciones:</span>
              <NumberStepper
                value={scheduledMeal.servings || 1}
                onChange={handleServingsChange}
                min={0.5}
                max={4}
                step={0.5}
              />
            </div>
            
            {availableSides.length > 0 && (
              <div className="meal-card-row">
                <span className="meal-card-row-label">Guarnición:</span>
                <div className="meal-card-sides">
                  <button
                    className={`chip ${!scheduledMeal.selectedSideId ? 'selected' : ''}`}
                    onClick={() => handleSideChange(null)}
                  >
                    Sin guarnición
                  </button>
                  {availableSides.map(side => (
                    <button
                      key={side.id}
                      className={`chip ${scheduledMeal.selectedSideId === side.id ? 'selected' : ''}`}
                      onClick={() => handleSideChange(side.id)}
                    >
                      {side.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="meal-card-actions">
              
              <button className="btn btn-sm" onClick={onEdit}>
                ✏️ Editar
              </button>
              {onQuickChange && (
                <button className="btn btn-secondary btn-sm" onClick={onQuickChange}>
                  🔄 Cambiar
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={onDelete}>
                🗑️ Eliminar
              </button>

              {scheduledMeal.completed ? (
                <button className="btn btn-secondary btn-sm" onClick={handleUncomplete}>
                  ↩️ Desmarcar
                </button>
              ) : (
                <button className="btn btn-success btn-sm" onClick={handleOpenComplete}>
                  ✓ Completar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Completar comida"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleCompleteConfirm}>
              ✓ Completar
            </button>
          </>
        }
      >
        <div className="complete-modal-content">
          <p className="complete-modal-info">
            ¿Marcar "{displayName}" como completado?
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Los ingredientes de esta comida se calcularán automáticamente desde la lista de compras.
          </p>
        </div>
      </Modal>
    </>
  );
};

export default MealCard;
