<?php
/**
 * API pour récupérer la liste des serveurs Nextcloud configurés
 */
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/config.php';

    if (isset($NEXTCLOUD_SERVERS)) {
        // Formatter la réponse pour n'envoyer que les URLs
        $servers_list = [];
        foreach ($NEXTCLOUD_SERVERS as $url => $details) {
            $servers_list[] = [
                'url' => $url
            ];
        }
        echo json_encode(['success' => true, 'servers' => $servers_list]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Aucun serveur configuré.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur.']);
}
?> 