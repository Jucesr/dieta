import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import './IngredientsPage.css';

const IngredientsPage = () => {
  const { 
    ingredients, 
    loading, 
    createIngredient, 
    updateIngredient, 
    deleteIngredient 
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [search, setSearch] = useState('');
  const [formName, setFormName] = useState('');

  const filteredIngredients = useMemo(() => {
    let filtered = ingredients;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(i => 
        i.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [ingredients, search]);

  const handleOpenCreate = () => {
    setFormName('');
    setEditingIngredient(null);
    setShowForm(true);
  };

  const handleOpenEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormName(ingredient.name || '');
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingIngredient(null);
    setFormName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formName.trim()) return;
    
    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, { name: formName.trim() });
    } else {
      await createIngredient({ name: formName.trim() });
    }
    
    handleClose();
  };

  const handleDelete = async (ingredient) => {
    if (confirm(`¿Eliminar "${ingredient.name}"?`)) {
      await deleteIngredient(ingredient.id);
    }
  };

  if (loading) {
    return <Loading text="Cargando ingredientes..." />;
  }

  return (
    <div className="ingredients-page">
      <header className="section-header">
        <h1 className="section-title">Ingredientes</h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Nuevo
        </button>
      </header>

      <div className="ingredients-search-wrap">
        <input
          type="text"
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ingredients-search"
        />
        <span className="ingredients-count">
          {filteredIngredients.length} ingrediente{filteredIngredients.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredIngredients.length === 0 ? (
        <EmptyState
          icon="🥕"
          text="No hay ingredientes"
          action={
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              Crear primer ingrediente
            </button>
          }
        />
      ) : (
        <div className="ingredients-grid">
          {filteredIngredients.map(ingredient => (
            <div key={ingredient.id} className="ingredient-card">
              <span className="ingredient-name">{ingredient.name}</span>
              <div className="ingredient-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleOpenEdit(ingredient)}
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleDelete(ingredient)}
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
        title={editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingIngredient ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Pollo, Tomate, Arroz..."
              autoFocus
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IngredientsPage;
