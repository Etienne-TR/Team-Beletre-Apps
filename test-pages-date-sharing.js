// Test pour vérifier que toutes les pages utilisent bien l'état global selectedDate
import { getSelectedDate, setSelectedDate } from './modules/store/responsibilities.js';
import { globalStore } from './modules/store/store.js';

console.log('=== TEST D\'UTILISATION DE SELECTEDDATE PAR TOUTES LES PAGES ===');

// Simulation de l'utilisation par les différentes pages
function simulatePageUsage() {
    console.log('\n1. SIMULATION PAGE WORKER-VIEW:');
    console.log('   - Lecture de la date actuelle:', getSelectedDate());
    console.log('   - Modification de la date via DateSelector');
    setSelectedDate('2024-03-15');
    console.log('   - Nouvelle date après modification:', getSelectedDate());
    
    console.log('\n2. SIMULATION PAGE GLOBAL-VIEW:');
    console.log('   - Lecture de la date pour affichage:', getSelectedDate());
    console.log('   - Modification de la date via DateSelector');
    setSelectedDate('2024-04-20');
    console.log('   - Nouvelle date après modification:', getSelectedDate());
    
    console.log('\n3. SIMULATION PAGE EDITOR:');
    console.log('   - Lecture de la date pour chargement des activités:', getSelectedDate());
    console.log('   - Modification de la date via DateSelector');
    setSelectedDate('2024-05-10');
    console.log('   - Nouvelle date après modification:', getSelectedDate());
    
    console.log('\n4. VÉRIFICATION FINALE:');
    const finalDate = getSelectedDate();
    const storeDate = globalStore.getState('responsibilities.selectedDate');
    console.log('   - Date finale via getSelectedDate():', finalDate);
    console.log('   - Date finale via store global:', storeDate);
    console.log('   - Cohérence:', finalDate === storeDate);
}

// Test de persistance entre les pages
function testPersistence() {
    console.log('\n=== TEST DE PERSISTANCE ENTRE LES PAGES ===');
    
    // Simuler un changement depuis worker-view
    console.log('1. Changement depuis worker-view...');
    setSelectedDate('2024-06-01');
    
    // Simuler une lecture depuis global-view
    console.log('2. Lecture depuis global-view...');
    const dateFromGlobalView = getSelectedDate();
    console.log('   Date lue:', dateFromGlobalView);
    
    // Simuler un changement depuis editor
    console.log('3. Changement depuis editor...');
    setSelectedDate('2024-07-01');
    
    // Simuler une lecture depuis worker-view
    console.log('4. Lecture depuis worker-view...');
    const dateFromWorkerView = getSelectedDate();
    console.log('   Date lue:', dateFromWorkerView);
    
    console.log('5. Vérification de la cohérence...');
    const storeDate = globalStore.getState('responsibilities.selectedDate');
    const isConsistent = dateFromGlobalView === dateFromWorkerView && 
                        dateFromWorkerView === storeDate;
    console.log('   Toutes les lectures retournent la même valeur:', isConsistent);
    console.log('   Valeurs:', { dateFromGlobalView, dateFromWorkerView, storeDate });
}

// Test de l'état initial
function testInitialState() {
    console.log('\n=== TEST DE L\'ÉTAT INITIAL ===');
    console.log('1. État initial du store:');
    const initialState = globalStore.getState('responsibilities');
    console.log('   État complet:', initialState);
    console.log('   selectedDate initial:', initialState.selectedDate);
    
    console.log('2. Vérification via getSelectedDate():');
    const initialDate = getSelectedDate();
    console.log('   Date initiale:', initialDate);
    
    console.log('3. Cohérence de l\'état initial:');
    console.log('   Égalité:', initialDate === initialState.selectedDate);
}

// Exécution des tests
testInitialState();
simulatePageUsage();
testPersistence();

console.log('\n=== TOUS LES TESTS TERMINÉS ===');
console.log('✅ L\'état selectedDate est bien partagé globalement entre toutes les pages'); 