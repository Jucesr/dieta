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
            if (name === 'Sides') return mockSidesSheet;
            if (name === 'SideIngredientes') return mockSideIngredientsSheet;
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

// Mock Sides sheet with sample data
const mockSidesSheet = {
    getDataRange: () => ({
        getValues: () => {
            const filePath = path.join(__dirname, 'sides.csv');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return fileContent.split('\n').map(line => line.split(','));
        }
    })
};

// Mock Side Ingredients sheet with sample data
const mockSideIngredientsSheet = {
    getDataRange: () => ({
        getValues: () => {
            const filePath = path.join(__dirname, 'sides-ingredients.csv');
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
    meals.slice(0, 5).forEach(m => {
        const sidesInfo = m.availableSides.length > 0 ? `sides: [${m.availableSides.join(', ')}]` : 'no sides';
        console.log(`  - ${m.code}: ${m.name} [${m.tags}] (count: ${m.count}, ${sidesInfo})`);
    });
    console.log('');
    
    // Test reading sides
    console.log('2. Reading sides from sheet...');
    const sides = sheetFunctions.readSidesSheet();
    console.log(`Found ${sides.length} sides\n`);
    
    // Show first few sides
    console.log('Sample sides:');
    sides.slice(0, 3).forEach(s => {
        console.log(`  - ${s.code}: ${s.name} [${s.tags}]`);
    });
    console.log('');
    
    // Test reading side ingredients
    console.log('3. Reading side ingredients from sheet...');
    const rawSideIngredients = sheetFunctions.readSideIngredientsSheet();
    const sideIngredients = sheetFunctions.processSideIngredientsSheet(rawSideIngredients);
    console.log(`Found ${sideIngredients.length} side ingredient entries\n`);
    
    // Show first few side ingredients
    console.log('Sample side ingredients:');
    sideIngredients.slice(0, 5).forEach(ing => {
        console.log(`  - ${ing.sideCode}: ${ing.quantity}${ing.unit} ${ing.name}`);
    });
    console.log('');
    
    // Test generating a week plan with sides
    console.log('4. Generating week plan with sides...');
    const startDate = sheetFunctions.getStartOfTheWeek(1);
    const weekPlan = sheetFunctions.generateWeekPlan(meals, startDate, sides, sideIngredients);
    console.log(`Generated plan for ${weekPlan.length} days\n`);
    
    // Show sample day with meals and sides
    console.log('Sample day plan:');
    const sampleDay = weekPlan[0];
    console.log(`${sampleDay.dayLabel}:`);
    sampleDay.meals.forEach(m => {
        const sideInfo = m.side ? ` + ${m.side.name}` : '';
        console.log(`  - ${m.time}: ${m.meal.name}${sideInfo}`);
    });
    console.log('');
    
    // Test reading ingredients
    console.log('5. Reading ingredients from sheet...');
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
    console.log('6. Generating shopping list by day (including sides)...');
    const shoppingByDay = sheetFunctions.generateShoppingListGroupedByDay(weekPlan, ingredients, sideIngredients);
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
    console.log('7. Generating shopping list by week (aggregated, including sides)...');
    const shoppingByWeek = sheetFunctions.generateShoppingListAggregated(weekPlan, ingredients, sideIngredients);
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

