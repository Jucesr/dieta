import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MEAL_TIME_OPTIONS, DAYS_OF_WEEK } from '../models/types';
import Loading from '../components/ui/Loading';
import './SettingsPage.css';

const SettingsPage = () => {
  const { 
    loading,
    mealTimes,
    setMealTimes,
    deliveryRules,
    createDeliveryRule,
    updateDeliveryRule,
    deleteDeliveryRule
  } = useApp();

  const [newRule, setNewRule] = useState({
    dayOfWeek: 6,
    mealTime: 'dinner'
  });

  const handleMealTimeToggle = (mealTime) => {
    if (mealTimes.includes(mealTime)) {
      if (mealTimes.length > 1) {
        setMealTimes(mealTimes.filter(t => t !== mealTime));
      }
    } else {
      setMealTimes([...mealTimes, mealTime]);
    }
  };

  const handleAddRule = async () => {
    // Check if rule already exists
    const exists = deliveryRules.some(
      r => r.dayOfWeek === newRule.dayOfWeek && r.mealTime === newRule.mealTime
    );
    
    if (exists) {
      return;
    }
    
    await createDeliveryRule({
      ...newRule,
      enabled: true
    });
  };

  const handleToggleRule = async (rule) => {
    await updateDeliveryRule(rule.id, { enabled: !rule.enabled });
  };

  const handleDeleteRule = async (rule) => {
    await deleteDeliveryRule(rule.id);
  };

  if (loading) {
    return <Loading text="Cargando configuración..." />;
  }

  return (
    <div className="settings-page">
      <header className="section-header">
        <h1 className="section-title">Configuración</h1>
      </header>

      <section className="settings-section">
        <h2 className="settings-section-title">Comidas del día</h2>
        <p className="settings-section-desc">
          Selecciona qué comidas quieres planificar cada día
        </p>
        
        <div className="meal-times-grid">
          {MEAL_TIME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`meal-time-toggle ${mealTimes.includes(opt.value) ? 'active' : ''}`}
              onClick={() => handleMealTimeToggle(opt.value)}
              style={{ '--toggle-color': opt.color }}
            >
              <span className="meal-time-icon">{opt.icon}</span>
              <span className="meal-time-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Reglas de Delivery</h2>
        <p className="settings-section-desc">
          Configura qué días y comidas deben ser siempre delivery
        </p>
        
        <div className="delivery-rules">
          {deliveryRules.length === 0 ? (
            <p className="no-rules">No hay reglas de delivery configuradas</p>
          ) : (
            <div className="rules-list">
              {deliveryRules.map(rule => {
                const day = DAYS_OF_WEEK.find(d => d.value === rule.dayOfWeek);
                const mealTime = MEAL_TIME_OPTIONS.find(m => m.value === rule.mealTime);
                
                return (
                  <div key={rule.id} className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}>
                    <div 
                      className={`toggle ${rule.enabled ? 'active' : ''}`}
                      onClick={() => handleToggleRule(rule)}
                    />
                    <div className="rule-info">
                      <span className="rule-day">{day?.label}</span>
                      <span className="rule-meal">{mealTime?.label}</span>
                    </div>
                    <button 
                      className="btn btn-icon btn-outline"
                      onClick={() => handleDeleteRule(rule)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="add-rule">
            <select
              value={newRule.dayOfWeek}
              onChange={(e) => setNewRule({ ...newRule, dayOfWeek: Number(e.target.value) })}
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
            <select
              value={newRule.mealTime}
              onChange={(e) => setNewRule({ ...newRule, mealTime: e.target.value })}
            >
              {MEAL_TIME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleAddRule}>
              + Agregar
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Acerca de</h2>
        <div className="about-card">
          <div className="about-header">
            <span className="about-emoji">🍽️</span>
            <div>
              <h3 className="about-title">Meal Planner</h3>
              <p className="about-version">Versión 1.0.0</p>
            </div>
          </div>
          <p className="about-desc">
            Planifica tus comidas de la semana, genera listas de compras y organiza tu alimentación de forma sencilla.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
