import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import WeekView from '../components/calendar/WeekView';
import DayMeals from '../components/calendar/DayMeals';
import MealPicker from '../components/calendar/MealPicker';
import RandomMealSuggestion from '../components/calendar/RandomMealSuggestion';
import MealForm from '../components/forms/MealForm';
import Loading from '../components/ui/Loading';
import Modal from '../components/ui/Modal';
import { pickMeal } from '../services/mealPickerService';
import { mealDetailsChanged, mealIngredientsChanged, normalizeMealSides } from '../models/types';
import './CalendarPage.css';

const CalendarPage = () => {
  const {
    loading,
    meals,
    mealIngredients,
    scheduledMeals,
    mealTimes,
    deliveryRules,
    selectedDate,
    setSelectedDate,
    loadScheduledMeals,
    generateDayMealPlan,
    generateWeekMealPlan,
    createScheduledMeal,
    updateScheduledMeal,
    deleteScheduledMeal,
    updateMeal
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showMealEditModal, setShowMealEditModal] = useState(false);
  const [editingScheduledMeal, setEditingScheduledMeal] = useState(null);
  const [addingMealTime, setAddingMealTime] = useState(null);
  const [showRandomSuggestion, setShowRandomSuggestion] = useState(false);
  const [randomMealTime, setRandomMealTime] = useState(null);
  const [suggestedMeal, setSuggestedMeal] = useState(null);
  const [excludedSuggestionIds, setExcludedSuggestionIds] = useState([]);
  
  // Full meal edit form state
  const [mealFormData, setMealFormData] = useState({
    code: '',
    name: '',
    difficulty: 'Sencillas',
    labels: [],
    sides: [],
    preparation: '',
    variations: '',
    preference: ''
  });
  const [mealFormIngredients, setMealFormIngredients] = useState([]);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const savingMealRef = useRef(false);
  const initialMealRef = useRef(null);

  // Load scheduled meals for current week
  const loadWeekMeals = useCallback(async () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    await loadScheduledMeals(
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    );
  }, [selectedDate, loadScheduledMeals]);

  useEffect(() => {
    loadWeekMeals();
  }, [loadWeekMeals]);

  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleGenerateDay = async () => {
    setIsGenerating(true);
    try {
      await generateDayMealPlan(selectedDate);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWeek = async () => {
    setIsGenerating(true);
    try {
      await generateWeekMealPlan(selectedDate);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditMeal = (scheduledMeal) => {
    // Find the actual meal data
    const meal = meals.find(m => m.id === scheduledMeal.mealId);
    if (!meal) return;
    const form = {
      code: meal.code || '',
      name: meal.name || '',
      difficulty: meal.difficulty || 'Sencillas',
      labels: [...(meal.labels || [])],
      sides: (meal.sides || []).map(side => ({ ...side })),
      preparation: meal.preparation || '',
      variations: meal.variations || '',
      preference: meal.preference || ''
    };
    const ingredients = (mealIngredients[meal.id] || []).map(ingredient => ({ ...ingredient }));
    setEditingScheduledMeal(scheduledMeal);
    setMealFormData(form);
    setMealFormIngredients(ingredients);
    initialMealRef.current = { meal: form, ingredients };
    setShowMealEditModal(true);
  };

  const handleQuickChangeMeal = (meal) => {
    setEditingScheduledMeal(meal);
    setShowMealPicker(true);
  };

  const handleDeleteMeal = async (meal) => {
    await deleteScheduledMeal(meal.id);
  };

  const handleMealSelect = async (newMeal) => {
    if (editingScheduledMeal) {
      await updateScheduledMeal(editingScheduledMeal.id, {
        mealId: newMeal.id,
        mealName: newMeal.name,
      });
      setEditingScheduledMeal(null);
    } else if (addingMealTime) {
      // Creating a new meal for this slot
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await createScheduledMeal({
        date: dateStr,
        mealTime: addingMealTime,
        mealId: newMeal.id,
        mealName: newMeal.name,
        servings: 1,
        isDelivery: false,
        completed: false
      });
      setAddingMealTime(null);
    }
  };

  const handleSaveMealEdit = async () => {
    if (!editingScheduledMeal || savingMealRef.current) return;

    const meal = meals.find(m => m.id === editingScheduledMeal.mealId);
    if (!meal) return;

    savingMealRef.current = true;
    setIsSavingMeal(true);
    try {
      const nextMeal = { ...mealFormData, sides: normalizeMealSides(mealFormData.sides) };
      const initial = initialMealRef.current;
      const detailsChanged = !initial || mealDetailsChanged(initial.meal, nextMeal);
      const ingredientsChanged = !initial || mealIngredientsChanged(initial.ingredients, mealFormIngredients);

      if (detailsChanged || ingredientsChanged) {
        await updateMeal(
          meal.id,
          detailsChanged ? nextMeal : null,
          ingredientsChanged ? mealFormIngredients : null
        );
      }

      if (mealFormData.name !== meal.name) {
        await updateScheduledMeal(editingScheduledMeal.id, {
          mealName: mealFormData.name
        });
      }

      setShowMealEditModal(false);
      setEditingScheduledMeal(null);
    } finally {
      savingMealRef.current = false;
      setIsSavingMeal(false);
    }
  };

  const handleCloseMealEdit = () => {
    setShowMealEditModal(false);
    setEditingScheduledMeal(null);
  };

  const handleLabelToggle = (label) => {
    setMealFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  const handleAddIngredient = () => {
    setMealFormIngredients(prev => [
      ...prev,
      { ingredientName: '', unit: 'gramos', quantity: 0 }
    ]);
  };

  const handleRemoveIngredient = (index) => {
    setMealFormIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    setMealFormIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  const handleAddMeal = (mealTime) => {
    setAddingMealTime(mealTime);
    setEditingScheduledMeal(null);
    setShowMealPicker(true);
  };

  const pickRandomSuggestion = (mealTime, excludeIds = []) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const availableMeals = meals.filter(m => !excludeIds.includes(m.id));
    return pickMeal({
      meals: availableMeals.length > 0 ? availableMeals : meals,
      mealTime,
      date: dateStr,
      recentMeals: scheduledMeals,
      deliveryRules,
      config: {
        avoidRepetition: true,
        repetitionWindow: 7,
        respectPreferences: true,
        balanceDifficulty: true
      }
    });
  };

  const handleRandomMeal = (mealTime) => {
    const picked = pickRandomSuggestion(mealTime);
    setRandomMealTime(mealTime);
    setSuggestedMeal(picked);
    setExcludedSuggestionIds(picked ? [picked.id] : []);
    setShowRandomSuggestion(true);
  };

  const handleAnotherSuggestion = () => {
    const picked = pickRandomSuggestion(randomMealTime, excludedSuggestionIds);
    if (picked) {
      setSuggestedMeal(picked);
      setExcludedSuggestionIds(prev =>
        prev.includes(picked.id) ? [picked.id] : [...prev, picked.id]
      );
    }
  };

  const handleCloseRandomSuggestion = () => {
    setShowRandomSuggestion(false);
    setRandomMealTime(null);
    setSuggestedMeal(null);
    setExcludedSuggestionIds([]);
  };

  const handleAcceptSuggestion = async () => {
    if (!suggestedMeal || !randomMealTime) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await createScheduledMeal({
      date: dateStr,
      mealTime: randomMealTime,
      mealId: suggestedMeal.id,
      mealName: suggestedMeal.name,
      servings: 1,
      isDelivery: suggestedMeal.isDelivery || false,
      completed: false
    });
    handleCloseRandomSuggestion();
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  if (loading) {
    return <Loading text="Cargando plan de comidas..." />;
  }

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <h1 className="calendar-title">Plan de Comidas</h1>
        <div className="calendar-nav">
          <button className="btn btn-icon btn-secondary" onClick={handlePrevWeek}>
            ←
          </button>
          <button className="btn btn-sm btn-secondary" onClick={handleToday}>
            Hoy
          </button>
          <button className="btn btn-icon btn-secondary" onClick={handleNextWeek}>
            →
          </button>
        </div>
      </header>

      <div className="calendar-week-label">
        {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
      </div>

      <WeekView
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        scheduledMeals={scheduledMeals}
        mealTimes={mealTimes}
      />

      <div className="calendar-actions">
        <button 
          className="btn btn-primary"
          onClick={handleGenerateDay}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳' : '✨'} Generar Día
        </button>
        <button 
          className="btn btn-secondary"
          onClick={handleGenerateWeek}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳' : '📅'} Generar Semana
        </button>
      </div>

      <DayMeals
        date={selectedDate}
        scheduledMeals={scheduledMeals}
        onEditMeal={handleEditMeal}
        onQuickChangeMeal={handleQuickChangeMeal}
        onDeleteMeal={handleDeleteMeal}
        onAddMeal={handleAddMeal}
        onRandomMeal={handleRandomMeal}
        mealTimes={mealTimes}
      />

      <MealPicker
        isOpen={showMealPicker}
        onClose={() => {
          setShowMealPicker(false);
          setEditingScheduledMeal(null);
          setAddingMealTime(null);
        }}
        onSelect={handleMealSelect}
        mealTime={editingScheduledMeal?.mealTime || addingMealTime}
        currentMealId={editingScheduledMeal?.mealId}
      />

      <RandomMealSuggestion
        isOpen={showRandomSuggestion}
        onClose={handleCloseRandomSuggestion}
        onAccept={handleAcceptSuggestion}
        onAnother={handleAnotherSuggestion}
        meal={suggestedMeal}
        mealTime={randomMealTime}
      />

      <Modal
        isOpen={showMealEditModal}
        onClose={handleCloseMealEdit}
        title="Editar Comida Completa"
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseMealEdit}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveMealEdit} disabled={isSavingMeal}>
              💾 Guardar cambios
            </button>
          </>
        }
      >
        <MealForm
          formData={mealFormData}
          formIngredients={mealFormIngredients}
          onFormDataChange={setMealFormData}
          onIngredientChange={handleIngredientChange}
          onAddIngredient={handleAddIngredient}
          onRemoveIngredient={handleRemoveIngredient}
          onLabelToggle={handleLabelToggle}
          onSubmit={(e) => { e.preventDefault(); handleSaveMealEdit(); }}
          datalistId="meal-edit-ingredients-datalist"
        />
      </Modal>
    </div>
  );
};

export default CalendarPage;
