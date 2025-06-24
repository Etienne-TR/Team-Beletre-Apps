import { checkAuth } from '../../shared/shared.js';
import { initializeUserInfo } from '../../modules/ui/user-info.js';

// Gestion de la page d'accueil Team Apps

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadServers();

    // Gérer la soumission du formulaire pour éviter le rechargement précoce
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutButton = document.querySelector('.btn-outline');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Gérer le bouton d'aide pliable
    const passwordHelpToggle = document.getElementById('passwordHelpToggle');
    if (passwordHelpToggle) {
        passwordHelpToggle.addEventListener('click', togglePasswordHelp);
    }
});

async function initializeApp() {
    try {
        // Vérifier si l'utilisateur est déjà connecté
        const user = await checkAuth();
        if (user) {
            showDashboard(user);
        } else {
            showLoginForm();
        }
    } catch (error) {
        // En production, on peut choisir de ne pas logger l'erreur dans la console
        // console.error('Erreur lors de l\'initialisation:', error);
        showLoginForm();
    }
}

async function loadServers() {
    try {
        const response = await fetch('../api/servers.php');
        const data = await response.json();

        if (data.success && data.servers) {
            const serverSelect = document.getElementById('nextcloudServer');
            data.servers.forEach(server => {
                const option = document.createElement('option');
                option.value = server.url;
                option.textContent = server.url;
                // Définir https://nuage.ouvaton.coop comme sélection par défaut
                if (server.url === 'https://nuage.ouvaton.coop') {
                    option.selected = true;
                }
                serverSelect.appendChild(option);
            });
        }
    } catch (error) {
        // console.error('Erreur lors du chargement des serveurs:', error);
    }
}

function showLoginForm() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

async function handleLogin(event) {
    if (event) {
        event.preventDefault();
    }
    
    const server = document.getElementById('nextcloudServer').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('appPassword').value;
    const statusDiv = document.getElementById('loginStatus');
    
    if (!server || !username || !password) {
        statusDiv.innerHTML = '<div class="message-error">Veuillez remplir tous les champs.</div>';
        return;
    }
    
    try {
        statusDiv.innerHTML = '<div class="message-info">Connexion en cours...</div>';
        
        const response = await fetch('../api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                server: server,
                username: username,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Supprimer le message de succès et passer directement au dashboard
            showDashboard(result.user);
        } else {
            statusDiv.innerHTML = `<div class="message-error">${result.error || result.message || 'Erreur de connexion'}</div>`;
        }
    } catch (error) {
        // console.error('Erreur lors de la connexion:', error);
        statusDiv.innerHTML = '<div class="message-error">Erreur lors de la connexion.</div>';
    }
}

function showDashboard(user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Ajouter les informations utilisateur et bouton de déconnexion au header
    const headerContent = document.querySelector('.header-content');
    headerContent.innerHTML = `
        <h1 class="heading-title">📊 Team Apps</h1>
        <div class="header-info">
            <div class="user-info" id="currentUser"></div>
            <button class="btn btn-outline">Déconnexion</button>
        </div>
    `;
    
    // Utiliser le module partagé pour afficher les informations utilisateur
    initializeUserInfo();
    
    // Réattacher l'événement de déconnexion
    const logoutButton = document.querySelector('.btn-outline');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

function logout() {
    fetch('../api/auth.php', {
        method: 'DELETE',
        credentials: 'include'
    }).then(() => {
        // Afficher un message de déconnexion avant de rediriger
        const statusDiv = document.getElementById('loginStatus');
        statusDiv.innerHTML = '<div class="message-success">Déconnexion réussie</div>';
        
        // Réinitialiser le header
        const headerContent = document.querySelector('.header-content');
        headerContent.innerHTML = `
            <h1 class="heading-title">📊 Team Apps</h1>
            <div class="header-info">
                <button class="btn btn-outline" style="visibility: hidden;">placeholder</button>
            </div>
        `;
        
        setTimeout(() => {
            showLoginForm();
        }, 1000);
    }).catch(error => {
        // console.error('Erreur lors de la déconnexion:', error);
        showLoginForm();
    });
}

function togglePasswordHelp() {
    const helpContent = document.getElementById('passwordHelp');
    
    if (helpContent.style.display === 'none') {
        helpContent.style.display = 'block';
    } else {
        helpContent.style.display = 'none';
    }
} 