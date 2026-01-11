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
    console.log(JSON.stringify(weekPlan, null, 2));
    const rows = sheetFunctions.convertWeekPlanToRows(weekPlan);
    console.log(rows);
    // console.log(`Generated plan for ${weekPlan.length} days\n`);
    
    // // Display the full JSON structure
    // console.log('3. Week Plan JSON Output:');
    // console.log(JSON.stringify(weekPlan, null, 2));
    
    // console.log('\n4. Testing first day structure:');
    // console.log(JSON.stringify(weekPlan[0], null, 2));
    
} catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
}

