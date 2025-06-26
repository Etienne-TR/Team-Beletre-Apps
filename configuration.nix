# configuration.nix - Serveur PHP/MySQL sur NixOS
{ config, pkgs, ... }:

{
  # Désactiver le pare-feu pour la simplicité
  networking.firewall.enable = false;

  # Activation de Podman (alternative à Docker)
  virtualisation.podman.enable = true;
  virtualisation.oci-containers.backend = "podman";

  # Service pour créer le réseau des conteneurs
  systemd.services.create-php-mysql-network = with config.virtualisation.oci-containers; {
    serviceConfig.Type = "oneshot";
    wantedBy = [ 
      "${backend}-php-web.service" 
      "${backend}-mysql-db.service" 
    ];
    script = ''
      ${pkgs.podman}/bin/podman network exists php-net || \
      ${pkgs.podman}/bin/podman network create php-net
    '';
  };

  # Définition des conteneurs
  virtualisation.oci-containers.containers = {
    
    # Conteneur PHP avec Apache
    php-web = {
      image = "php:8.2-apache";
      volumes = [
        "/home/etienne/Nextcloud/fichiers-personnels/dossiers-de-travail-coop/team-apps:/var/www/html"
        "/etc/localtime:/etc/localtime:ro"
      ];
      autoStart = true;
      ports = [ "80:80" ];
      environment = {
        MYSQL_HOST = "mysql-db";
        MYSQL_DATABASE = "team-apps";
        MYSQL_USER = "etienne";
        MYSQL_PASSWORD = "123456";
      };
      extraOptions = [ 
        "--network=php-net"
        "--init"
      ];
      # Commande pour installer les extensions PHP nécessaires
      cmd = [ 
        "bash" 
        "-c"
        "docker-php-ext-install mysqli pdo pdo_mysql && apache2-foreground"
      ];
    };

    # Conteneur MySQL
    mysql-db = {
      image = "mysql:8.0";
      volumes = [
        "mysql-data:/var/lib/mysql"
        "/etc/localtime:/etc/localtime:ro"
        "/home/etienne/Nextcloud/fichiers-personnels/dossiers-de-travail-coop/team-apps/mysql-custom.cnf:/etc/mysql/conf.d/custom.cnf:ro"
      ];
      autoStart = true;
      environment = {
        MYSQL_ROOT_PASSWORD = "admin";
        MYSQL_DATABASE = "team-apps";
        MYSQL_USER = "etienne";
        MYSQL_PASSWORD = "123456";
        MYSQL_CHARSET = "utf8mb4";
        MYSQL_COLLATION = "utf8mb4_unicode_ci";
      };
      extraOptions = [ 
        "--network=php-net"
        "--init"
      ];
    };

    # Conteneur PhpMyAdmin (optionnel, pour la gestion)
    phpmyadmin = {
      image = "phpmyadmin:latest";
      autoStart = true;
      ports = [ "8080:80" ];
      environment = {
        PMA_HOST = "mysql-db";
        PMA_PORT = "3306";
        PMA_USER = "etienne";
        PMA_PASSWORD = "123456";
      };
      extraOptions = [ 
        "--network=php-net"
        "--init"
      ];
    };
  };

  # Paquets système utiles
  environment.systemPackages = with pkgs; [
    vim
    htop
    curl
    wget
    mysql80 # Client MySQL
  ];

} 