import { defineLocale } from 'locales';

export default defineLocale({
  'layout.header.functions': 'Fonctions',
  'layout.header.settings': 'Paramètres',
  'layout.header.menu.newOrganization': 'Créer une Organisation',
  'layout.header.menu.settings': 'Paramètres',
  'layout.header.menu.theme': 'Thème',
  'layout.header.menu.theme.light': 'Clair',
  'layout.header.menu.theme.dark': 'Sombre',
  'layout.header.menu.theme.system': 'Système',
  'layout.header.menu.profile': 'Profil',
  'layout.header.menu.language': 'Langue : {locale}',
  'layout.header.menu.language.en': 'Anglais',
  'layout.header.menu.language.fr': 'Français',
  'layout.header.menu.signOut': 'Déconnexion',
  'layout.empty.title': 'Aucune Organisation trouvée',
  'layout.empty.description': 'Merci de créer une Organisation pour commencer.',
  'layout.empty.action': 'Créer une Organisation',

  'home.title': 'Fonctions',
  'home.createFunction': 'Créer une Fonction',
  'home.empty.title': 'Aucune Fonction trouvée',
  'home.empty.description': 'Commencez par crééer une Fonction en cliquant sur le bouton en haut à droite.',
  'home.list.lastUpdate': 'Dernière mise à jour :',

  'settings.title': 'Paramètres',
  'settings.name.title': 'Nom',
  'settings.name.description': 'Changer le nom de cette Organisation.',
  'settings.name.placeholder': "Nom de l'Organisation",
  'settings.name.submit': 'Mettre à jour',
  'settings.name.success': "Le nom de l'Organisation a été mis à jour.",

  'settings.description.title': 'Description',
  'settings.description.description': 'Changer la description de cette Organisation.',
  'settings.description.placeholder': 'Organisation description',
  'settings.description.submit': 'Mettre à jour',
  'settings.description.success': "La descrption de l'Organisation a été mise à jour.",

  'settings.transfer.title': 'Transférer',
  'settings.transfer.description': "Transférer la propriété de l'Organisation a un autre utilisateur.",
  'settings.transfer.placeholder': 'Email du nouveau propriétaire',
  'settings.transfer.submit': 'Transférer la propriété',
  'settings.transfer.success': "La propriété de l'Organisation a été transférée.",

  'settings.delete.title': 'Supprimer',
  'settings.delete.description':
    'Supprimer complètement cette Organisation, ses Fonctions, Déploiement et Logs. Cette action est irréversible.',
  'settings.delete.submit': 'Supprimer',
  'settings.delete.modal.title': "Supprimer l'Organisation",
  'settings.delete.modal.description':
    'Ecrivez le nom de cette Organisation pour confirmer la suppression : {organizationName}',
  'settings.delete.modal.error': 'Confirmez avec le nom de cette Organisation',
  'settings.delete.modal.submit': "Supprimer l'Organisation",
  'settings.delete.success': "L'Organisation a été supprimée.",

  'profile.title': 'Profil',
  'profile.information.title': 'Information',
  'profile.information.description': 'Editez les informations de votre compte comme votre nom et email.',
  'profile.information.name.title': 'Nom',
  'profile.information.name.placeholder': 'John Doe',
  'profile.information.email.title': 'Email',
  'profile.information.email.placeholder': 'john@doe.com',
  'profile.information.submit': 'Mettre à jour',
  'profile.information.success': 'Les informations ont été mises à jour.',

  'profile.tokens.title': 'Tokens',
  'profile.tokens.description': 'Voici vos Tokens personnels, utilisés pour la CLI.',
  'profile.tokens.created': 'Créé :',
  'profile.tokens.delete.submit': 'Supprimer',
  'profile.tokens.delete.modal.title': 'Supprimer un Token',
  'profile.tokens.delete.modal.description':
    'Etes-vous sûr de vous supprimer ce Token ? Vous allez perdre accès à la CLI si il est encore utilisé.',
  'profile.tokens.delete.modal.submit': 'Supprimer ce Token',
  'profile.tokens.delete.success': 'Le Token a bien été supprimé',

  'profile.delete.title': 'Supprimer',
  'profile.delete.description': 'Supprimer complètement ce Compte. Cete action est irréversible.',
  'profile.delete.submit': 'Supprimer',
  'profile.delete.modal.title': 'Supprimer un Compte',
  'profile.delete.modal.description': "Ecrivez l'email de votre Compte pour confirmer la suppression : {email}",
  'profile.delete.modal.confirm': 'Confirmez avec votre email',
  'profile.delete.modal.submit': 'Supprimer ce Compte',

  'cli.title': 'Connexion à la CLI',
  'cli.description':
    'Voici votre code de vérification pour vous connecter à la CLI. Copiez et collez le code-le dans votre terminal.',
  'cli.copy': 'Cliquez pour copier',
  'cli.copy.success': 'Copié dans le presse-papier !',

  'new.success': "L'Organisation a été créée.",
  'new.name.title': 'Nom',
  'new.name.placeholder': 'super-projet',
  'new.description.title': 'Description',
  'new.description.placeholder': 'Description de mon super projet.',
  'new.submit': 'Créer une Organisation',

  'playground.title': '{functionName} playground',
  'playground.back': "Retour à l'aperçu",
  'playground.deploy': 'Déployer',
  'playground.deploy.success': 'La Fonction a été déployée.',
  'playground.deploy.error': 'Impossible de déployer la Fonction.',
  'playground.reload': 'Recharger',

  'function.nav.playground': 'Playground',
  'function.nav.overview': 'Aperçu',
  'function.nav.deployments': 'Déploiments',
  'function.nav.logs': 'Logs',
  'function.nav.settings': 'Paramètres',

  'functions.overview.usage': 'Utilisation & Limites',
  'functions.overview.usage.requests': 'Requêtes',
  'functions.overview.usage.avgCpu': 'Temps de CPU moyen',
  'functions.overview.usage.avgInBytes': 'Octets IN moyen',
  'functions.overview.usage.avgOutBytes': 'Octets OUT moyen',
  'functions.overview.usage.lastUpdate': 'Dernière mise à jour :',
  'functions.overview.usage.created': 'Créé :',
  'functions.overview.requests': 'Requêtes',
  'functions.overview.requests.label': 'Requêtes',
  'functions.overview.cpuTime': 'Temps de CPU',
  'functions.overview.cpuTime.label': 'Temps de CPU',
  'functions.overview.network': 'Réseau',
  'functions.overview.network.label.inBytes': 'Octets IN',
  'functions.overview.network.label.outBytes': 'Octets OUT',

  'functions.deployments.empty.title': 'Aucun Déploiment trouvé',
  'functions.deployments.empty.description': 'Créez votre premier Déploiment depuis le Playground ou la CLI.',
  'functions.deployments.empty.action': 'Aller au Playground',
  'functions.deployments.list.production': 'Déploiment de production',
  'functions.deployments.list.noCommit': 'Aucun commit lié',
  'functions.deployments.list.by': 'Par :',
  'functions.deployments.promote': 'Promouvoir en Production',
  'functions.deployments.promote.modal.title': 'Promouvoir le Déploiment en Production',
  'functions.deployments.promote.modal.description': 'Etes-vous sûr de vouloir promovoir ce Déploiment en Production ?',
  'functions.deployments.promote.modal.submit': 'Promouvoir en Production',
  'functions.deployments.promote.success': 'Le déploiment a été promu en Production.',
  'functions.deployments.delete': 'Supprimer',
  'functions.deployments.delete.modal.title': 'Supprimer un Déploiment',
  'functions.deployments.delete.modal.description': 'Etes-vous sûr de vouloir supprimer ce Déploiment ?',
  'functions.deployments.delete.modal.submit': 'Supprimer',
  'functions.deployments.delete.success': 'Le Déploiment a été supprimé.',

  'functions.logs.title': 'Logs & Erreurs',
  'functions.logs.logLevel': 'Niveau de log :',
  'functions.logs.empty.title': 'Aucun log trouvés',
  'functions.logs.empty.description': "Essayez d'ajouter des 'console.log', ou ajustez les filtres en haut à droite.",

  'functions.settings.name.title': 'Nom',
  'functions.settings.name.description':
    'Changer le nom de cette Fonction. Notz que changer le nom va aussi changer le nom de domaine par défaut.',
  'functions.settings.name.placeholder': 'ma-super-fonction',
  'functions.settings.name.submit': 'Mettre à jour',
  'functions.settings.name.success': 'Nom de la Fonction mis à jour.',
  'functions.settings.domains.title': 'Domaines',
  'functions.settings.domains.description':
    'Le nom de domaine par défaut est basé sur le nom de cette Fonction. Vous pouvez aussi ajoutez des noms de domaines.',
  'functions.settings.domains.default': 'Domaine par défaut',
  'functions.settings.domains.custom': 'Autres domaines',
  'functions.settings.domains.custom.placeholder': 'mondomaine.fr',
  'functions.settings.domains.update': 'Mettre à jour',
  'functions.settings.domains.success': 'Les domaines de la Fonction ont été mis à jour.',
  'functions.settings.cron.title': 'Cron',
  'functions.settings.cron.description':
    'Exécuter automatiquement cette Fonction avec une expression Cron. Vous pouvez aussi choisir dans quelle Région exécuter la Fonction.',
  'functions.settings.cron.expression': 'Expression',
  'functions.settings.cron.expression.placeholder': '* */12 * * *',
  'functions.settings.cron.region': 'Région',
  'functions.settings.cron.submit': 'Mettre à jour',
  'functions.settings.cron.success': 'Le Cron de la Fonction a été mis à jour.',
  'functions.settings.env.title': "Variables d'environement",
  'functions.settings.env.description': "Les Variables d'environement sont injectés dans votre Fonction au runtime",
  'functions.settings.env.placeholder.key': 'CLEE',
  'functions.settings.env.placeholder.value': 'valeur-secrete',
  'functions.settings.env.add': 'Ajouter',
  'functions.settings.env.remove': 'Supprimer',
  'functions.settings.env.submit': 'Valider',
  'functions.settings.env.success': "Les Variables d'Environement de la Fonction ont été mis à jour.",
  'functions.settings.delete.title': 'Supprimer',
  'functions.settings.delete.description':
    'Supprimer complètement cette Fonction, ces Déploiments et Logs. Cette action est irréversible',
  'functions.settings.delete.submit': 'Supprimer',
  'functions.settings.delete.modal.title': 'Supprimer une Fonction',
  'functions.settings.delete.modal.description':
    'Ecrivez le nom de cette Fonction pour confirmer la suppression : {functionName}',
  'functions.settings.delete.modal.confirm': 'Confirmer avec le nom de cette Fonction',
  'functions.settings.delete.modal.submit': 'Supprimer cette Fonction',
  'functions.settings.delete.success': 'La Fonction a été supprimée.',
});
