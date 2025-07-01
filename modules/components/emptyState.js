export function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('activitiesContainer').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
}

export function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('activitiesContainer').style.display = 'block';
    document.getElementById('statsSection').style.display = 'block';
} 