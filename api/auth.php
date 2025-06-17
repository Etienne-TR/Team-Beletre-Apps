<?php
// api/auth.php
error_reporting(E_ALL);
ini_set('display_errors', 0);

session_start();
header('Content-Type: application/json; charset=utf-8');

function verifyNextcloudUser($username, $password) {
    $url = 'https://nuage.ouvaton.coop/ocs/v2.php/cloud/user?format=json';
    
    if (function_exists('curl_init')) {
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
            return false;
        }
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (isset($data['ocs']['data'])) {
                return $data['ocs']['data'];
            }
        }
    }
    
    return false;
}

try {
    require_once 'config.php';

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            
            if (empty($username) || empty($password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Username et password requis']);
                exit;
            }
            
            // Vérification Nextcloud
            $nextcloudResponse = verifyNextcloudUser($username, $password);
            
            if ($nextcloudResponse) {
                $email = $nextcloudResponse['email'] ?? '';
                
                if (empty($email)) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'error' => 'Aucun email associé à ce compte Nextcloud.']);
                    exit;
                }
                
                // Vérifier utilisateur en base
                $stmt = $pdo->prepare("SELECT id, display_name, initials FROM users WHERE email = ? AND status = 'active'");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'error' => 'Utilisateur non autorisé. Email: ' . $email]);
                    exit;
                }
                
                // Créer session
                $sessionId = bin2hex(random_bytes(32));
                
                $stmt = $pdo->prepare("
                    INSERT INTO user_sessions (session_id, user_id, nextcloud_username, nextcloud_data, created_at, expires_at) 
                    VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))
                ");
                $stmt->execute([$sessionId, $user['id'], $username, json_encode($nextcloudResponse)]);
                
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
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Identifiants incorrects. Vérifiez votre nom d\'utilisateur et votre mot de passe d\'application Nextcloud.']);
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