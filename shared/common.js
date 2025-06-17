// Fonctions communes à toutes les pages

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`api/${endpoint}`, options);
    return await response.json();
}

function showMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.textContent = message;
    div.style.padding = '10px';
    div.style.margin = '10px 0';
    div.style.borderRadius = '5px';
    div.style.backgroundColor = type === 'error' ? '#ffebee' : '#e8f5e8';
    div.style.color = type === 'error' ? '#c62828' : '#2e7d32';
    
    document.body.insertBefore(div, document.body.firstChild);
    
    setTimeout(() => div.remove(), 5000);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}