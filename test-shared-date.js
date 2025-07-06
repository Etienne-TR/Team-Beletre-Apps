// Test pour vérifier que selectedDate est bien partagé globalement
import { getSelectedDate, setSelectedDate } from '/modules/store/responsibilities.js';
import { globalStore } from '/modules/store/store.js';

console.log('=== TEST DE PARTAGE DE SELECTEDDATE ===');

// Test 1: Vérifier l'état initial
console.log('1. État initial de selectedDate:', getSelectedDate());

// Test 2: Modifier la date
console.log('2. Modification de la date...');
setSelectedDate('2024-12-25');
console.log('   Date après modification:', getSelectedDate());

// Test 3: Vérifier que la date est bien dans le store global
console.log('3. Vérification dans le store global:');
const responsibilitiesState = globalStore.getState('responsibilities');
console.log('   État complet responsibilities:', responsibilitiesState);
console.log('   selectedDate dans le store:', responsibilitiesState.selectedDate);

// Test 4: Vérifier l'accès direct via le store global
console.log('4. Accès direct via globalStore:');
const directAccess = globalStore.getState('responsibilities.selectedDate');
console.log('   Accès direct:', directAccess);

// Test 5: Simuler un changement depuis une autre page
console.log('5. Simulation d\'un changement depuis une autre page...');
setSelectedDate('2024-06-15');
console.log('   Nouvelle date:', getSelectedDate());

// Test 6: Vérifier la cohérence
console.log('6. Vérification de la cohérence:');
const finalState = globalStore.getState('responsibilities');
console.log('   État final responsibilities:', finalState);
console.log('   getSelectedDate() retourne:', getSelectedDate());
console.log('   Égalité:', getSelectedDate() === finalState.selectedDate);

console.log('=== TEST TERMINÉ ==='); 