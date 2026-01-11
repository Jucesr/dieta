# Dieta - Meal Planner

Repositorio para guardar codigo relacionado a automatizaciones de dieta.

Actualmente tengo este [google sheet](https://docs.google.com/spreadsheets/d/1SbomUnfF1xjCvFYFQIO8xKtRwUDAajwOU4rVFwJ-z00/edit?usp=sharing)

## Uso en Google Apps Script

1. Copia el contenido de `sheet.js` en el editor de scripts de Google Sheets
2. Usa el menú "Meal Planner" > "Generate 1 Week (week N tab)"
3. El script generará una nueva pestaña con el plan semanal

## Pruebas Locales

Para probar la lógica localmente sin usar Google Sheets:

```bash
npm test
```

Esto ejecutará `test-local.js` que simula las funciones de Google Apps Script y muestra el resultado en la consola.

### Personalizar los datos de prueba

Actualiza el archivo meals.csv para agregar mas comidas