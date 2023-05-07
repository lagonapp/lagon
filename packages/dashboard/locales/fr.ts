import { defineLocale } from 'locales';

export default defineLocale({
  'signin.title': 'Connexion',
  'signin.description': 'Merci de vous connecter pour accéder au dashboard.',
  'signin.github': 'Se connecter avec GitHub',
  'signin.google': 'Se connecter avec Google',
  'signin.error.title': 'Impossible de se connecter',
  'signin.error.description': 'Une erreur ({error}) est survenue. Merci de re-essayer.',
  'signin.error.description.notAuthorized':
    "Vous n'êtes pas autorisé à vous connecter. Rejoignez la liste d'attente pour être notifié des futures mises à jour.",
  'signin.error.joinWaitlist': 'Rejoindre la liste d’attente',

  'layout.header.functions': 'Fonctions',
  'layout.header.settings': 'Paramètres',
  'layout.header.documentation': 'Documentation',
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
  'home.empty.description':
    'Démarrez en créant une Fonction sur le Dashboard, ou en utilisant la CLI pour tester et déployer.',
  'home.empty.action': 'Guide de démarrage',
  'home.list.lastUpdate': 'Dernière mise à jour :',
  'home.list.cron': 'Cron',

  'settings.title': 'Paramètres',
  'settings.general': 'Général',
  'settings.members': 'Membres',
  'settings.billingUsage': 'Facturation & Utilisation',
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

  'settings.members.title': 'Membres',
  'settings.members.description': 'Gérer les membres de cette Organisation.',
  'settings.members.owner': 'Propriétaire',
  'settings.members.member': 'Membre',
  'settings.members.invite': 'Inviter un nouveau membre',
  'settings.members.invite.modal.title': 'Inviter un nouveau membre',
  'settings.members.invite.modal.description': "Entrez l'email du membre que vous voulez inviter.",
  'settings.members.invite.modal.submit': 'Inviter le membre',
  'settings.members.invite.success': 'Le membre a été invité.',
  'settings.members.joined': 'Rejoins le :',
  'settings.members.remove': 'Supprimer le membre',
  'settings.members.remove.modal.title': 'Supprimer ce membre de cette Organisation',
  'settings.members.remove.modal.description': 'Etes-vous sûr de vouloir supprimer {member} de {organization} ?',
  'settings.members.remove.modal.submit': 'Supprimer le membre',
  'settings.members.remove.success': "Membre supprimé de l'Organisation",

  'settings.transfer.title': 'Transférer',
  'settings.transfer.description': "Transférer la propriété de l'Organisation a un autre utilisateur.",
  'settings.transfer.placeholder': 'Email du nouveau propriétaire',
  'settings.transfer.submit': 'Transférer la propriété',
  'settings.transfer.success': "La propriété de l'Organisation a été transférée.",
  'settings.transfer.notAvailable': 'Non disponible.',
  'settings.transfer.notAvailable.description':
    "Merci d'envoyer un email à contact@lagon.app si vous voulez transférer votre Organisation.",

  'settings.usage.title': 'Utilisation',
  'settings.usage.description':
    "Voici l'utilisation et les limites de cette Organisation. L'utilisation des requêtes est remis à 0 au début de chaque mois.",
  'settings.usage.requests': 'Requêtes',
  'settings.usage.functions': 'Fonctions',
  'settings.usage.members': "Membres dans l'Organisation",

  'settings.subcription.title': 'Abonnement',
  'settings.subcription.description': ' Upgrade and manage the subscription of this Organization.',
  'settings.subcription.plan.personal': 'Personal',
  'settings.subcription.plan.pro': 'Pro',
  'settings.subcription.renew': 'Renouvellement : {date}',
  'settings.subcription.upgrade.pro': "S'abonner à Pro",
  'settings.subcription.manage': "Gérer l'abonnement",

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
  'profile.tokens.description':
    'Voici vos Tokens personnels, utilisés pour vous authentifier dans la CLI et la GitHub Action.',
  'profile.tokens.created': 'Créé :',
  'profile.tokens.copy': 'Copier',
  'profile.tokens.copy.success': 'Le Token a été copié dans le presse-papiers.',
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
  'profile.delete.notAvailable': 'Non disponible.',
  'profile.delete.notAvailable.description':
    "Merci d'envoyer un email à contact@lagon.app si vous voulez supprimer votre Compte.",

  'cli.title': 'Connexion à la CLI',
  'cli.description':
    'Voici votre code de vérification pour vous connecter à la CLI. Copiez et collez le code-le dans votre terminal.',
  'cli.copy': 'Cliquez pour copier',
  'cli.copy.success': 'Copié dans le presse-papier !',

  'new.title': 'Nouvelle Organisation',
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
  'function.nav.deployments': 'Déploiements',
  'function.nav.logs': 'Logs',
  'function.nav.settings': 'Paramètres',
  'function.nav.cron': 'Cron',

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

  'functions.deployments.empty.title': 'Aucun Déploiement trouvé',
  'functions.deployments.empty.description': 'Créez votre premier Déploiement depuis le Dashboard ou la CLI.',
  'functions.deployments.empty.action': 'Documentation des Déploiements',
  'functions.deployments.list.production': 'Déploiement de production',
  'functions.deployments.list.noCommit': 'Aucun commit lié',
  'functions.deployments.list.by': 'Par :',
  'functions.deployments.promote': 'Promouvoir en Production',
  'functions.deployments.promote.modal.title': 'Promouvoir le Déploiement en Production',
  'functions.deployments.promote.modal.description':
    'Etes-vous sûr de vouloir promovoir ce Déploiement en Production ?',
  'functions.deployments.promote.modal.submit': 'Promouvoir en Production',
  'functions.deployments.promote.success': 'Le déploiment a été promu en Production.',
  'functions.deployments.delete': 'Supprimer',
  'functions.deployments.delete.modal.title': 'Supprimer un Déploiement',
  'functions.deployments.delete.modal.description': 'Etes-vous sûr de vouloir supprimer ce Déploiement ?',
  'functions.deployments.delete.modal.submit': 'Supprimer',
  'functions.deployments.delete.success': 'Le Déploiement a été supprimé.',
  'functions.deployments.cron': 'Cron',

  'functions.logs.title': 'Logs & Erreurs',
  'functions.logs.logLevel': 'Niveau de log :',
  'functions.logs.empty.title': 'Aucun log trouvés',
  'functions.logs.empty.description': 'Ajustez les filtres ou rajoutez des logs en lisant la documentation.',
  'functions.logs.empty.action': 'Documentation des logs',

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
  'functions.settings.env.placeholder.key': 'ex. MA_CLEE',
  'functions.settings.env.placeholder.value': 'ex. valeure',
  'functions.settings.env.add': 'Ajouter',
  'functions.settings.env.remove': 'Supprimer',
  'functions.settings.env.submit': 'Valider',
  'functions.settings.env.success': "Les Variables d'Environement de la Fonction ont été mis à jour.",
  'functions.settings.delete.title': 'Supprimer',
  'functions.settings.delete.description':
    'Supprimer complètement cette Fonction, ces Déploiements et Logs. Cette action est irréversible',
  'functions.settings.delete.submit': 'Supprimer',
  'functions.settings.delete.modal.title': 'Supprimer une Fonction',
  'functions.settings.delete.modal.description':
    'Ecrivez le nom de cette Fonction pour confirmer la suppression : {functionName}',
  'functions.settings.delete.modal.confirm': 'Confirmer avec le nom de cette Fonction',
  'functions.settings.delete.modal.submit': 'Supprimer cette Fonction',
  'functions.settings.delete.success': 'La Fonction a été supprimée.',
});
