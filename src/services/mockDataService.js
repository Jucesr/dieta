/**
 * Mock Data Service
 * 
 * This service provides mock data for development and demo purposes.
 * Toggle USE_MOCK_DATA in the context to switch between mock and Firebase.
 */

// Sample meals from CSV data
const mockMeals = [
  { id: 'm1', code: 'C01', name: 'Enchiladas suizas', difficulty: 'Sencillas', labels: ['Comida'], sideIds: [], preparation: '', preference: 'Julio', useCount: 0 },
  { id: 'm2', code: 'C02', name: 'Enchiladas rojas', difficulty: 'Sencillas', labels: ['Comida'], sideIds: [], preparation: '', preference: 'Julio', useCount: 1 },
  { id: 'm3', code: 'C03', name: 'Pollo con salsa de champion', difficulty: 'Sencillas', labels: ['Comida'], sideIds: ['s1', 's2', 's3'], preparation: '', preference: 'Julio', useCount: 0 },
  { id: 'm4', code: 'C07', name: 'Hamburguesas', difficulty: 'Sencillas', labels: ['Comida'], sideIds: [], preparation: '', preference: 'Julio', useCount: 0 },
  { id: 'm5', code: 'C09', name: 'Bulgogi', difficulty: 'Elaborada', labels: ['Comida'], sideIds: ['s1', 's2', 's3', 's8'], preparation: '', preference: 'Julio; Ericka', useCount: 0 },
  { id: 'm6', code: 'C11', name: 'Tacos de pescado', difficulty: 'Elaborada', labels: ['Comida'], sideIds: [], preparation: '', preference: 'Julio; Ericka', useCount: 0 },
  { id: 'm7', code: 'C21', name: 'Pollo asado', difficulty: 'Sencillas', labels: ['Comida'], sideIds: ['s1', 's2', 's3', 's8', 's9'], preparation: '', preference: '', useCount: 0 },
  { id: 'm8', code: 'C34', name: 'Tacos de carne asada', difficulty: 'No casera', labels: ['Comida', 'Cena'], sideIds: [], preparation: '', preference: '', useCount: 1 },
  { id: 'm9', code: 'C37', name: 'Pizza', difficulty: 'No casera', labels: ['Comida', 'Cena'], sideIds: [], preparation: '', preference: '', useCount: 1 },
  { id: 'm10', code: 'D01', name: 'Huevo con jamon de pavo', difficulty: 'Sencillas', labels: ['Desayuno'], sideIds: ['s4', 's5', 's6'], preparation: '', preference: 'Julio; Ericka', useCount: 0 },
  { id: 'm11', code: 'D02', name: 'Huevo chorizo', difficulty: 'Sencillas', labels: ['Desayuno'], sideIds: ['s4', 's5', 's6'], preparation: '', preference: 'Julio', useCount: 0 },
  { id: 'm12', code: 'D03', name: 'Huevo con papa', difficulty: 'Sencillas', labels: ['Desayuno'], sideIds: ['s4', 's5', 's6'], preparation: '', preference: 'Julio', useCount: 0 },
  { id: 'm13', code: 'D04', name: 'Omelette con champiñón, espinaca, queso', difficulty: 'Sencillas', labels: ['Desayuno'], sideIds: ['s4', 's5', 's6'], preparation: '', preference: 'Julio; Ericka', useCount: 0 },
  { id: 'm14', code: 'D08', name: 'Yogur griego con toppings', difficulty: 'Sencillas', labels: ['Desayuno', 'Cena', 'Comida'], sideIds: [], preparation: '', preference: 'Ericka', useCount: 2 },
  { id: 'm15', code: 'D09', name: 'Huevo con tocino', difficulty: 'Sencillas', labels: ['Desayuno'], sideIds: ['s4', 's5', 's6'], preparation: '', preference: '', useCount: 2 },
  { id: 'm16', code: 'C32', name: 'Quesadillas con jamon de pavo', difficulty: 'Sencillas', labels: ['Comida'], sideIds: [], preparation: '', preference: '', useCount: 3 },
  { id: 'm17', code: 'C38', name: 'Spaghetti con pollo', difficulty: 'Sencillas', labels: ['Comida'], sideIds: [], preparation: '', preference: '', useCount: 1 },
  { id: 'm18', code: 'C35', name: 'Lentejas preparadas', difficulty: 'Sencillas', labels: ['Comida', 'Cena'], sideIds: [], preparation: '', preference: '', useCount: 0 },
];

const mockSides = [
  { id: 's1', code: 'S01', name: 'Arroz', labels: ['Comida'], preference: 'Julio; Ericka' },
  { id: 's2', code: 'S02', name: 'Ensalada', labels: ['Comida'], preference: 'Julio; Ericka' },
  { id: 's3', code: 'S03', name: 'Pasta', labels: ['Comida'], preference: 'Ericka' },
  { id: 's4', code: 'S04', name: 'Pan', labels: ['Desayuno'], preference: 'Julio; Ericka' },
  { id: 's5', code: 'S05', name: 'Tortilla', labels: ['Desayuno', 'Comida'], preference: 'Julio; Ericka' },
  { id: 's6', code: 'S06', name: 'Quesadilla', labels: ['Desayuno', 'Comida'], preference: 'Julio' },
  { id: 's7', code: 'S07', name: 'Frijoles', labels: ['Comida', 'Cena'], preference: 'Julio; Ericka' },
  { id: 's8', code: 'S08', name: 'Verduras al vapor', labels: ['Comida'], preference: 'Ericka' },
  { id: 's9', code: 'S09', name: 'Puré de papa', labels: ['Comida'], preference: 'Julio; Ericka' },
  { id: 's10', code: 'S10', name: 'Camote al horno', labels: ['Comida'], preference: 'Ericka' },
];

const mockIngredients = [
  { id: 'i1', name: 'Pollo' },
  { id: 'i2', name: 'Queso mozzarella' },
  { id: 'i3', name: 'Tortillas' },
  { id: 'i4', name: 'Salsa verde' },
  { id: 'i5', name: 'Salsa roja' },
  { id: 'i6', name: 'Cebolla morada' },
  { id: 'i7', name: 'Huevo' },
  { id: 'i8', name: 'Tocino' },
  { id: 'i9', name: 'Arroz' },
  { id: 'i10', name: 'Lechuga' },
  { id: 'i11', name: 'Tomate' },
  { id: 'i12', name: 'Pepino' },
  { id: 'i13', name: 'Aguacate' },
  { id: 'i14', name: 'Crema' },
  { id: 'i15', name: 'Queso fresco' },
];

const mockMealIngredients = {
  'm1': [
    { ingredientName: 'Pollo', unit: 'gramos', quantity: 160 },
    { ingredientName: 'Tortillas', unit: 'pieza', quantity: 4 },
    { ingredientName: 'Queso mozzarella', unit: 'gramos', quantity: 60 },
    { ingredientName: 'Crema', unit: 'gramos', quantity: 30 },
    { ingredientName: 'Salsa verde', unit: 'gramos', quantity: 225 },
  ],
  'm2': [
    { ingredientName: 'Pollo', unit: 'gramos', quantity: 150 },
    { ingredientName: 'Queso fresco', unit: 'gramos', quantity: 30 },
    { ingredientName: 'Salsa roja', unit: 'gramos', quantity: 225 },
    { ingredientName: 'Tortillas', unit: 'pieza', quantity: 4 },
  ],
  'm10': [
    { ingredientName: 'Huevo', unit: 'pieza', quantity: 2 },
    { ingredientName: 'Jamón de pavo', unit: 'rebanada', quantity: 2 },
  ],
  'm15': [
    { ingredientName: 'Huevo', unit: 'pieza', quantity: 2 },
    { ingredientName: 'Tocino', unit: 'tiras', quantity: 2 },
  ],
};

const mockSideIngredients = {
  's1': [{ ingredientName: 'Arroz', unit: 'gramos', quantity: 100 }],
  's2': [
    { ingredientName: 'Lechuga', unit: 'gramos', quantity: 50 },
    { ingredientName: 'Tomate', unit: 'gramos', quantity: 30 },
    { ingredientName: 'Pepino', unit: 'gramos', quantity: 30 },
  ],
  's3': [{ ingredientName: 'Pasta', unit: 'gramos', quantity: 100 }],
  's4': [{ ingredientName: 'Pan', unit: 'pieza', quantity: 2 }],
  's5': [{ ingredientName: 'Tortilla', unit: 'pieza', quantity: 3 }],
  's6': [
    { ingredientName: 'Tortilla', unit: 'pieza', quantity: 2 },
    { ingredientName: 'Queso mozzarella', unit: 'gramos', quantity: 40 },
  ],
  's7': [{ ingredientName: 'Frijoles', unit: 'gramos', quantity: 150 }],
  's8': [{ ingredientName: 'Verduras', unit: 'gramos', quantity: 150 }],
  's9': [{ ingredientName: 'Papa', unit: 'gramos', quantity: 150 }],
  's10': [{ ingredientName: 'Camote', unit: 'gramos', quantity: 150 }],
};

let mockScheduledMeals = [];
let mockDeliveryRules = [
  { id: 'dr1', dayOfWeek: 6, mealTime: 'dinner', enabled: true },
];

// Helper to generate unique IDs
let idCounter = Date.now();
const generateId = () => `mock_${idCounter++}`;

// Mock service implementations
export const mockMealsService = {
  getAll: async () => [...mockMeals],
  getById: async (id) => mockMeals.find(m => m.id === id) || null,
  create: async (data) => {
    const meal = { id: generateId(), ...data };
    mockMeals.push(meal);
    return meal;
  },
  update: async (id, data) => {
    const index = mockMeals.findIndex(m => m.id === id);
    if (index >= 0) {
      mockMeals[index] = { ...mockMeals[index], ...data };
      return mockMeals[index];
    }
    return null;
  },
  delete: async (id) => {
    const index = mockMeals.findIndex(m => m.id === id);
    if (index >= 0) mockMeals.splice(index, 1);
  }
};

export const mockIngredientsService = {
  getAll: async () => [...mockIngredients],
  getById: async (id) => mockIngredients.find(i => i.id === id) || null,
  create: async (data) => {
    const ingredient = { id: generateId(), ...data };
    mockIngredients.push(ingredient);
    return ingredient;
  },
  update: async (id, data) => {
    const index = mockIngredients.findIndex(i => i.id === id);
    if (index >= 0) {
      mockIngredients[index] = { ...mockIngredients[index], ...data };
      return mockIngredients[index];
    }
    return null;
  },
  delete: async (id) => {
    const index = mockIngredients.findIndex(i => i.id === id);
    if (index >= 0) mockIngredients.splice(index, 1);
  }
};

export const mockMealIngredientsService = {
  getByMealId: async (mealId) => mockMealIngredients[mealId] || [],
  batchUpdate: async (mealId, ingredients) => {
    mockMealIngredients[mealId] = [...ingredients];
  }
};

export const mockSidesService = {
  getAll: async () => [...mockSides],
  getById: async (id) => mockSides.find(s => s.id === id) || null,
  create: async (data) => {
    const side = { id: generateId(), ...data };
    mockSides.push(side);
    return side;
  },
  update: async (id, data) => {
    const index = mockSides.findIndex(s => s.id === id);
    if (index >= 0) {
      mockSides[index] = { ...mockSides[index], ...data };
      return mockSides[index];
    }
    return null;
  },
  delete: async (id) => {
    const index = mockSides.findIndex(s => s.id === id);
    if (index >= 0) mockSides.splice(index, 1);
  }
};

export const mockSideIngredientsService = {
  getBySideId: async (sideId) => mockSideIngredients[sideId] || [],
  batchUpdate: async (sideId, ingredients) => {
    mockSideIngredients[sideId] = [...ingredients];
  }
};

export const mockScheduledMealsService = {
  getByDateRange: async (startDate, endDate) => {
    return mockScheduledMeals.filter(m => m.date >= startDate && m.date <= endDate);
  },
  getByDate: async (date) => mockScheduledMeals.filter(m => m.date === date),
  create: async (data) => {
    const meal = { id: generateId(), ...data };
    mockScheduledMeals.push(meal);
    return meal;
  },
  update: async (id, data) => {
    const index = mockScheduledMeals.findIndex(m => m.id === id);
    if (index >= 0) {
      mockScheduledMeals[index] = { ...mockScheduledMeals[index], ...data };
      return mockScheduledMeals[index];
    }
    return null;
  },
  delete: async (id) => {
    const index = mockScheduledMeals.findIndex(m => m.id === id);
    if (index >= 0) mockScheduledMeals.splice(index, 1);
  },
  deleteByDate: async (date) => {
    mockScheduledMeals = mockScheduledMeals.filter(m => m.date !== date);
  },
  batchCreate: async (meals) => {
    const created = meals.map(meal => ({ id: generateId(), ...meal }));
    mockScheduledMeals.push(...created);
    return created;
  }
};

export const mockDeliveryRulesService = {
  getAll: async () => [...mockDeliveryRules],
  create: async (data) => {
    const rule = { id: generateId(), ...data };
    mockDeliveryRules.push(rule);
    return rule;
  },
  update: async (id, data) => {
    const index = mockDeliveryRules.findIndex(r => r.id === id);
    if (index >= 0) {
      mockDeliveryRules[index] = { ...mockDeliveryRules[index], ...data };
      return mockDeliveryRules[index];
    }
    return null;
  },
  delete: async (id) => {
    const index = mockDeliveryRules.findIndex(r => r.id === id);
    if (index >= 0) mockDeliveryRules.splice(index, 1);
  }
};

export default {
  meals: mockMealsService,
  ingredients: mockIngredientsService,
  mealIngredients: mockMealIngredientsService,
  sides: mockSidesService,
  sideIngredients: mockSideIngredientsService,
  scheduledMeals: mockScheduledMealsService,
  deliveryRules: mockDeliveryRulesService
};
