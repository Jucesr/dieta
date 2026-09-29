import React, { useState } from 'react';
import { MEAL_TIME_OPTIONS } from '../../models/types';
import { useApp } from '../../context/AppContext';
import NumberStepper from '../ui/NumberStepper';
import Modal from '../ui/Modal';
import './MealCard.css';

const MealCard = ({ scheduledMeal, onEdit, onQuickChange, onDelete, slotIndex = 0 }) => {
  const { meals, updateScheduledMeal } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const mealTimeConfig = MEAL_TIME_OPTIONS.find(
    opt => opt.value === scheduledMeal.mealTime
  );
  
  const meal = meals.find(m => m.id === scheduledMeal.mealId);
  const sideNames = (meal?.sides || [])
    .map(side => side.ingredientName)
    .filter(Boolean);

  const handleServingsChange = async (newServings) => {
    await updateScheduledMeal(scheduledMeal.id, { servings: newServings });
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

  const displayName = sideNames.length
    ? `${scheduledMeal.mealName} + ${sideNames.join(', ')}`
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
            <span className="meal-card-label">
              {mealTimeConfig?.label}{slotIndex > 0 ? ` ${slotIndex + 1}` : ''}
            </span>
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
            
            {sideNames.length > 0 && (
              <div className="meal-card-row">
                <span className="meal-card-row-label">Guarnición:</span>
                <span>{sideNames.join(', ')}</span>
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
              {!scheduledMeal.completed && (
                <button className="btn btn-outline btn-sm" onClick={onDelete}>
                  🗑️ Eliminar
                </button>
              )}

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
