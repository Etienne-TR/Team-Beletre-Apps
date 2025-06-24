<?php
/**
 * API d'authentification
 * 
 * Gère l'authentification des utilisateurs via Nextcloud
 * et la gestion des sessions utilisateur.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

session_start();
header('Content-Type: application/json; charset=utf-8');

function verifyNextcloudUser($username, $password, $server = null) {
    global $NEXTCLOUD_SERVERS, $DEFAULT_NEXTCLOUD_SERVER;
    
    // Utiliser le serveur par défaut si aucun n'est spécifié
    if (!$server || !isset($NEXTCLOUD_SERVERS[$server])) {
        $server = $DEFAULT_NEXTCLOUD_SERVER;
    }
    
    $baseUrl = $NEXTCLOUD_SERVERS[$server]['url'];
    $url = $baseUrl . '/ocs/v2.php/cloud/user?format=json';
    
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'CURL non disponible sur le serveur'];
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, $username . ':' . $password);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'OCS-APIRequest: true',
        'User-Agent: TeamApps/1.0'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'Erreur de connexion au serveur Nextcloud: ' . $error];
    }
    
    if ($httpCode === 401) {
        return ['success' => false, 'error' => 'Identifiants incorrects pour le serveur Nextcloud'];
    }
    
    if ($httpCode === 403) {
        return ['success' => false, 'error' => 'Accès refusé au serveur Nextcloud'];
    }
    
    if ($httpCode === 404) {
        return ['success' => false, 'error' => 'Serveur Nextcloud non trouvé'];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'Erreur serveur Nextcloud (code ' . $httpCode . ')'];
    }
    
    if (!$response) {
        return ['success' => false, 'error' => 'Réponse vide du serveur Nextcloud'];
    }
    
    $data = json_decode($response, true);
    if (!isset($data['ocs']['data'])) {
        return ['success' => false, 'error' => 'Format de réponse Nextcloud invalide'];
    }
    
    // Ajouter l'information du serveur utilisé
    $data['ocs']['data']['server'] = $server;
    $data['ocs']['data']['server_url'] = $baseUrl;
    return ['success' => true, 'data' => $data['ocs']['data']];
}

try {
    require_once 'config.php';

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            $server = $input['server'] ?? null;
            
            if (empty($username) || empty($password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Username et password requis']);
                exit;
            }
            
            // Vérification Nextcloud
            $nextcloudResponse = verifyNextcloudUser($username, $password, $server);
            
            if ($nextcloudResponse['success']) {
                $email = $nextcloudResponse['data']['email'] ?? '';
                $server_url = $nextcloudResponse['data']['server_url'] ?? '';
                
                if (empty($email)) {
                    http_response_code(401);
                    echo json_encode([
                        'success' => false, 
                        'error' => 'Aucun email associé à ce compte Nextcloud.',
                        'error_code' => 'NEXTCLOUD_NO_EMAIL'
                    ]);
                    exit;
                }
                
                // Vérifier l'association en base
                $stmt = $pdo->prepare("
                    SELECT u.id, u.display_name, u.initials 
                    FROM users u
                    JOIN user_nextcloud un ON u.id = un.user
                    WHERE un.email = ? AND un.server = ? AND u.status = 'active'
                ");
                $stmt->execute([$email, $server_url]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    http_response_code(403);
                    echo json_encode([
                        'success' => false, 
                        'error' => 'L\'identification au serveur Nextcloud a réussi, mais l\'email associé à votre compte (' . $email . ') n\'est pas reconnu dans notre base de données. Veuillez contacter l\'administrateur pour que votre email soit mis à jour.',
                        'error_code' => 'EMAIL_NOT_REGISTERED',
                        'email' => $email,
                        'server' => $server_url
                    ]);
                    exit;
                }
                
                // Créer session
                $sessionId = bin2hex(random_bytes(32));
                
                $stmt = $pdo->prepare("
                    INSERT INTO user_sessions (session_id, user_id, nextcloud_username, nextcloud_data, created_at, expires_at) 
                    VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))
                ");
                $stmt->execute([$sessionId, $user['id'], $username, json_encode($nextcloudResponse['data'])]);
                
                setcookie('team_session', $sessionId, time() + 7*24*3600, '/', '', false, true);
                
                echo json_encode([
                    'success' => true, 
                    'user' => [
                        'id' => $user['id'],
                        'nextcloud_id' => $username,
                        'email' => $email,
                        'displayname' => $user['display_name'],
                        'initials' => $user['initials']
                    ]
                ]);
            } else {
                // Erreur d'identification Nextcloud
                http_response_code(401);
                echo json_encode([
                    'success' => false, 
                    'error' => $nextcloudResponse['error'],
                    'error_code' => 'NEXTCLOUD_AUTH_FAILED'
                ]);
            }
            break;
            
        case 'GET':
            $sessionId = $_COOKIE['team_session'] ?? '';
            
            if ($sessionId) {
                $stmt = $pdo->prepare("
                    SELECT s.nextcloud_data, u.id, u.display_name, u.initials, u.email 
                    FROM user_sessions s
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE s.session_id = ? AND s.expires_at > NOW()
                ");
                $stmt->execute([$sessionId]);
                $session = $stmt->fetch();
                
                if ($session) {
                    $nextcloudData = json_decode($session['nextcloud_data'], true);
                    echo json_encode([
                        'success' => true, 
                        'user' => [
                            'id' => $session['id'],
                            'nextcloud_id' => $nextcloudData['id'] ?? '',
                            'email' => $session['email'],
                            'displayname' => $session['display_name'],
                            'initials' => $session['initials']
                        ]
                    ]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Session expirée']);
                }
            } else {
                echo json_encode(['success' => false, 'error' => 'Pas de session']);
            }
            break;
            
        case 'DELETE':
            $sessionId = $_COOKIE['team_session'] ?? '';
            
            if ($sessionId) {
                $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE session_id = ?");
                $stmt->execute([$sessionId]);
            }
            
            setcookie('team_session', '', time() - 3600, '/');
            echo json_encode(['success' => true]);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Méthode non supportée']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>