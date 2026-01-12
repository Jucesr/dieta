const fs = require('fs');
const path = require('path');

// Mock Google Apps Script APIs for local testing
global.SpreadsheetApp = {
    getUi: () => ({
        createMenu: () => ({
            addItem: () => ({ addToUi: () => {} })
        }),
        prompt: (title, message, buttonSet) => ({
            getSelectedButton: () => 'OK',
            getResponseText: () => '1'
        }),
        alert: (msg) => console.log('ALERT:', msg),
        Button: { OK: 'OK', CANCEL: 'CANCEL' },
        ButtonSet: { OK_CANCEL: 'OK_CANCEL' }
    }),
    getActive: () => ({
        getSheetByName: (name) => {
            if (name === 'Meals') return mockMealsSheet;
            if (name === 'Ingredientes') return mockIngredientsSheet;
            return mockPlanSheet;
        },
        insertSheet: (name) => {
            console.log(`Creating new sheet: ${name}`);
            return mockPlanSheet;
        }
    })
};

// Mock Meals sheet with sample data
const mockMealsSheet = {
    getDataRange: () => ({
        getValues: () => {
            const filePath = path.join(__dirname, 'meals.csv');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return fileContent.split('\n').map(line => line.split(','));
        }
    })
};

// Mock Ingredients sheet with sample data
const mockIngredientsSheet = {
    getDataRange: () => ({
        getValues: () => {
            const filePath = path.join(__dirname, 'ingredients.csv');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return fileContent.split('\n').map(line => line.split(','));
        }
    })
};

// Mock plan sheet for output
const mockPlanSheet = {
    clear: () => console.log('Clearing sheet...'),
    getRange: (row, col, numRows, numCols) => ({
        setValues: (values) => {
            console.log('\n=== WEEK PLAN OUTPUT ===\n');
            values.forEach((row, idx) => {
                console.log(`Row ${idx + 1}:`, row);
            });
            console.log('\n=====================\n');
        },
        merge: () => ({}),
        setHorizontalAlignment: () => ({}),
        setFontWeight: () => ({ setHorizontalAlignment: () => ({}) }),
        setBorder: () => ({}),
        setWrap: () => ({})
    }),
    autoResizeColumns: () => {},
    setRowHeight: () => {},
    setRowHeights: () => {}
};

// Load the sheet.js functions
const sheetFunctions = require('./sheet.js');

// Test the week plan generation
console.log('=== Testing Meal Planner ===\n');

try {
    // Test reading meals
    console.log('1. Reading meals from sheet...');
    const meals = sheetFunctions.readMealsSheet();
    console.log(`Found ${meals.length} meals\n`);
    
    // Show first few meals
    console.log('Sample meals:');
    meals.slice(0, 3).forEach(m => {
        console.log(`  - ${m.code}: ${m.name} [${m.tags}] (count: ${m.count})`);
    });
    console.log('');
    
    // Test generating a week plan
    console.log('2. Generating week plan...');
    const startDate = sheetFunctions.getStartOfTheWeek(1);
    const weekPlan = sheetFunctions.generateWeekPlan(meals, startDate);
    console.log(`Generated plan for ${weekPlan.length} days\n`);
    
    // Test reading ingredients
    console.log('3. Reading ingredients from sheet...');
    const rawIngredients = sheetFunctions.readIngredientsSheet();
    const ingredients = sheetFunctions.processIngredientsSheet(rawIngredients);

    console.log(`Found ${ingredients.length} ingredient entries\n`);
    
    // Show first few ingredients
    console.log('Sample ingredients:');
    ingredients.slice(0, 5).forEach(ing => {
        console.log(`  - ${ing.mealCode}: ${ing.quantity}${ing.unit} ${ing.name}`);
    });
    console.log('');
    
    // Test shopping list by day
    console.log('4. Generating shopping list by day...');
    const shoppingByDay = sheetFunctions.generateShoppingListGroupedByDay(weekPlan, ingredients);
    console.log('\n=== SHOPPING LIST BY DAY ===\n');
    shoppingByDay.forEach(day => {
        console.log(`\n${day.dayLabel}`);
        console.log('');
        if (day.ingredients.length === 0) {
            console.log('  No hay ingredientes registrados para este día');
        } else {
            day.ingredients.forEach(ing => {
                const quantityStr = ing.quantity > 0 
                    ? `${ing.quantity}${ing.unit}` 
                    : ing.unit || 'al gusto';
                console.log(`  - ${quantityStr} ${ing.name}`);
            });
        }
    });
    console.log('\n============================\n');
    
    // Test shopping list by week (aggregated)
    console.log('5. Generating shopping list by week (aggregated)...');
    const shoppingByWeek = sheetFunctions.generateShoppingListAggregated(weekPlan, ingredients);
    console.log('\n=== SHOPPING LIST BY WEEK ===\n');
    if (shoppingByWeek.length === 0) {
        console.log('No hay ingredientes registrados');
    } else {
        shoppingByWeek.forEach(ing => {
            const quantityStr = ing.quantity > 0 
                ? `${ing.quantity}${ing.unit}` 
                : ing.unit || 'al gusto';
            console.log(`- ${quantityStr} ${ing.name}`);
        });
    }
    console.log('\n=============================\n');
    
} catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
}

