import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { LABEL_OPTIONS, UNIT_OPTIONS } from '../models/types';
import './SidesPage.css';

const SidesPage = () => {
  const { 
    sides, 
    sideIngredients,
    ingredients,
    loading, 
    createSide, 
    updateSide, 
    deleteSide 
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingSide, setEditingSide] = useState(null);
  const [search, setSearch] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    labels: [],
    preference: ''
  });
  const [formIngredients, setFormIngredients] = useState([]);

  const filteredSides = useMemo(() => {
    let filtered = sides;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.code?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [sides, search]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      labels: [],
      preference: ''
    });
    setFormIngredients([]);
    setEditingSide(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (side) => {
    setEditingSide(side);
    setFormData({
      code: side.code || '',
      name: side.name || '',
      labels: side.labels || [],
      preference: side.preference || ''
    });
    setFormIngredients(sideIngredients[side.id] || []);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingSide) {
      await updateSide(editingSide.id, formData, formIngredients);
    } else {
      await createSide(formData, formIngredients);
    }
    
    handleClose();
  };

  const handleDelete = async (side) => {
    if (confirm(`¿Eliminar "${side.name}"?`)) {
      await deleteSide(side.id);
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
    return <Loading text="Cargando guarniciones..." />;
  }

  return (
    <div className="sides-page">
      <header className="section-header">
        <h1 className="section-title">Guarniciones</h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Nueva
        </button>
      </header>

      <div className="sides-search-wrap">
        <input
          type="text"
          placeholder="Buscar guarnición..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sides-search"
        />
        <span className="sides-count">
          {filteredSides.length} guarnición{filteredSides.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {filteredSides.length === 0 ? (
        <EmptyState
          icon="🥗"
          text="No hay guarniciones"
          action={
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              Crear primera guarnición
            </button>
          }
        />
      ) : (
        <div className="sides-list">
          {filteredSides.map(side => (
            <div key={side.id} className="side-card">
              <div className="side-info" onClick={() => handleOpenEdit(side)}>
                <span className="side-code">{side.code}</span>
                <span className="side-name">{side.name}</span>
                {side.labels?.length > 0 && (
                  <div className="side-labels">
                    {side.labels.map(label => (
                      <span key={label} className="badge">{label}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="side-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleOpenEdit(side)}
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleDelete(side)}
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
        title={editingSide ? 'Editar Guarnición' : 'Nueva Guarnición'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingSide ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="side-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: '0 0 100px' }}>
              <label className="form-label">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="S01"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Arroz, Ensalada..."
                required
              />
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

export default SidesPage;
