export function showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
}

export function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
} 