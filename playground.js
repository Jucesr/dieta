const { getStartOfTheWeek, getDateString, getDayLabel } = require('./sheet');

const startDate = getStartOfTheWeek(1);

console.log(getDateString(startDate, 0));
console.log(getDateString(startDate, 1));
console.log(getDateString(startDate, 2));
console.log(getDateString(startDate, 3));

console.log(getDayLabel(startDate, 0));
console.log(getDayLabel(startDate, 1));
console.log(getDayLabel(startDate, 2));
console.log(getDayLabel(startDate, 3));