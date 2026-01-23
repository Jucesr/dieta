import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { DIFFICULTY_OPTIONS, LABEL_OPTIONS, UNIT_OPTIONS } from '../models/types';
import './MealsPage.css';

const MealsPage = () => {
  const { 
    meals, 
    sides,
    mealIngredients,
    ingredients,
    loading, 
    createMeal, 
    updateMeal, 
    deleteMeal 
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    difficulty: 'Sencillas',
    labels: [],
    sideIds: [],
    preparation: '',
    variations: '',
    preference: ''
  });
  const [formIngredients, setFormIngredients] = useState([]);

  const filteredMeals = useMemo(() => {
    let filtered = meals;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(searchLower) ||
        m.code?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterDifficulty) {
      filtered = filtered.filter(m => m.difficulty === filterDifficulty);
    }
    
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [meals, search, filterDifficulty]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      difficulty: 'Sencillas',
      labels: [],
      sideIds: [],
      preparation: '',
      variations: '',
      preference: ''
    });
    setFormIngredients([]);
    setEditingMeal(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      code: meal.code || '',
      name: meal.name || '',
      difficulty: meal.difficulty || 'Sencillas',
      labels: meal.labels || [],
      sideIds: meal.sideIds || [],
      preparation: meal.preparation || '',
      variations: meal.variations || '',
      preference: meal.preference || ''
    });
    setFormIngredients(mealIngredients[meal.id] || []);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingMeal) {
      await updateMeal(editingMeal.id, formData, formIngredients);
    } else {
      await createMeal({ ...formData, useCount: 0 }, formIngredients);
    }
    
    handleClose();
  };

  const handleDelete = async (meal) => {
    if (confirm(`¿Eliminar "${meal.name}"?`)) {
      await deleteMeal(meal.id);
    }
  };

  const handleLabelToggle = (label) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  const handleSideToggle = (sideId) => {
    setFormData(prev => ({
      ...prev,
      sideIds: prev.sideIds.includes(sideId)
        ? prev.sideIds.filter(s => s !== sideId)
        : [...prev.sideIds, sideId]
    }));
  };

  const handleAddIngredient = () => {
    setFormIngredients(prev => [
      ...prev,
      { ingredientName: '', unit: 'gramos', quantity: 0 }
    ]);
  };

  const handleRemoveIngredient = (index) => {
    setFormIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    setFormIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  if (loading) {
    return <Loading text="Cargando comidas..." />;
  }

  return (
    <div className="meals-page">
      <header className="section-header">
        <h1 className="section-title">Comidas</h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Nueva
        </button>
      </header>

      <div className="meals-filters">
        <input
          type="text"
          placeholder="Buscar comida..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="meals-search"
        />
        <div className="meals-filter-chips">
          <button
            className={`chip ${filterDifficulty === '' ? 'selected' : ''}`}
            onClick={() => setFilterDifficulty('')}
          >
            Todas
          </button>
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`chip ${filterDifficulty === opt.value ? 'selected' : ''}`}
              onClick={() => setFilterDifficulty(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredMeals.length === 0 ? (
        <EmptyState
          icon="🍽️"
          text="No hay comidas"
          action={
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              Crear primera comida
            </button>
          }
        />
      ) : (
        <div className="meals-list">
          {filteredMeals.map(meal => (
            <div key={meal.id} className="meal-list-item">
              <div className="meal-list-info" onClick={() => handleOpenEdit(meal)}>
                <span className="meal-list-code">{meal.code}</span>
                <span className="meal-list-name">{meal.name}</span>
                {meal.difficulty && (
                  <span className={`badge badge-${
                    DIFFICULTY_OPTIONS.find(d => d.value === meal.difficulty)?.color
                  }`}>
                    {meal.difficulty}
                  </span>
                )}
              </div>
              <div className="meal-list-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleOpenEdit(meal)}
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleDelete(meal)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingMeal ? 'Editar Comida' : 'Nueva Comida'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingMeal ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="meal-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: '0 0 100px' }}>
              <label className="form-label">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="C01"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enchiladas suizas"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dificultad</label>
            <div className="form-chips">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chip ${formData.difficulty === opt.value ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, difficulty: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Etiquetas</label>
            <div className="form-chips">
              {LABEL_OPTIONS.map(label => (
                <button
                  key={label}
                  type="button"
                  className={`chip ${formData.labels.includes(label) ? 'selected' : ''}`}
                  onClick={() => handleLabelToggle(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Guarniciones disponibles</label>
            <div className="form-chips">
              {sides.map(side => (
                <button
                  key={side.id}
                  type="button"
                  className={`chip ${formData.sideIds.includes(side.id) ? 'selected' : ''}`}
                  onClick={() => handleSideToggle(side.id)}
                >
                  {side.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Ingredientes</label>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={handleAddIngredient}
              >
                + Agregar
              </button>
            </div>
            <div className="ingredients-list">
              {formIngredients.map((ing, index) => (
                <div key={index} className="ingredient-row">
                  <input
                    type="text"
                    placeholder="Ingrediente"
                    value={ing.ingredientName}
                    onChange={(e) => handleIngredientChange(index, 'ingredientName', e.target.value)}
                    list="ingredients-datalist"
                  />
                  <input
                    type="number"
                    placeholder="Cant"
                    value={ing.quantity || ''}
                    onChange={(e) => handleIngredientChange(index, 'quantity', Number(e.target.value))}
                    style={{ width: '70px' }}
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    style={{ width: '100px' }}
                  >
                    {UNIT_OPTIONS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-icon btn-outline"
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <datalist id="ingredients-datalist">
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.name} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label className="form-label">Preparación</label>
            <textarea
              value={formData.preparation}
              onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
              placeholder="Instrucciones de preparación..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Variaciones</label>
            <input
              type="text"
              value={formData.variations}
              onChange={(e) => setFormData({ ...formData, variations: e.target.value })}
              placeholder="Con pollo, con carne de res..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferencia</label>
            <input
              type="text"
              value={formData.preference}
              onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
              placeholder="Julio, Ericka..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MealsPage;
