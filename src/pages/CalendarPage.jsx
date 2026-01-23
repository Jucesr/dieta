import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import WeekView from '../components/calendar/WeekView';
import DayMeals from '../components/calendar/DayMeals';
import MealPicker from '../components/calendar/MealPicker';
import Loading from '../components/ui/Loading';
import './CalendarPage.css';

const CalendarPage = () => {
  const {
    loading,
    scheduledMeals,
    mealTimes,
    selectedDate,
    setSelectedDate,
    loadScheduledMeals,
    generateDayMealPlan,
    generateWeekMealPlan,
    updateScheduledMeal,
    deleteScheduledMeal
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

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

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setShowMealPicker(true);
  };

  const handleDeleteMeal = async (meal) => {
    if (confirm('¿Eliminar esta comida?')) {
      await deleteScheduledMeal(meal.id);
    }
  };

  const handleMealSelect = async (newMeal) => {
    if (editingMeal) {
      await updateScheduledMeal(editingMeal.id, {
        mealId: newMeal.id,
        mealName: newMeal.name,
        selectedSideId: newMeal.sideIds?.[0] || null
      });
      setEditingMeal(null);
    }
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
        onDeleteMeal={handleDeleteMeal}
        mealTimes={mealTimes}
      />

      <MealPicker
        isOpen={showMealPicker}
        onClose={() => {
          setShowMealPicker(false);
          setEditingMeal(null);
        }}
        onSelect={handleMealSelect}
        mealTime={editingMeal?.mealTime}
        currentMealId={editingMeal?.mealId}
      />
    </div>
  );
};

export default CalendarPage;
