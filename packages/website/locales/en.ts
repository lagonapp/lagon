export default {
  'home.createfunction': 'Create a Function',

  'settings.name.title': 'Name',
  'settings.name.description': 'Change the name of this Organization.',
  'settings.name.placeholder': 'Organization name',
  'settings.name.submit': 'Update',

  'settings.description.title': 'Description',
  'settings.description.description': 'Change the description of this Organization.',
  'settings.description.placeholder': 'Organization description',
  'settings.description.submit': 'Update',

  'settings.transfer.title': 'Transfer',
  'settings.transfer.description': 'Transfer the ownership of this Organization to another user?',
  'settings.transfer.placeholder': 'New Owner email',
  'settings.transfer.submit': 'Transfer ownership',

  'settings.delete.title': 'Delete',
  'settings.delete.description':
    'Delete completely this Organization, its Functions, Deployments and Logs. This action is irreversible.',
  'settings.delete.submit': 'Delete',
  'settings.delete.modal.title': 'Delete Organization',
  'settings.delete.modal.description': "Write this Organization's name to confirm deletion: {organizationName}",
  'settings.delete.modal.error': 'Confirm with the name of this Funtion',
  'settings.delete.modal.submit': 'Delete Organization',

  'profile.information.title': 'Information',
  'profile.information.description': 'Edit your account information like your name and email.',
  'profile.information.name.title': 'Name',
  'profile.information.name.placeholder': 'John Doe',
  'profile.information.email.title': 'Email',
  'profile.information.email.placeholder': 'john@doe.com',
  'profile.information.submit': 'Update',

  'profile.tokens.title': 'Tokens',
  'profile.tokens.description': 'Below are your personal tokens, used for the CLI.',
  'profile.tokens.created': 'Created:',
  'profile.tokens.delete.submit': 'Delete',
  'profile.tokens.delete.modal.title': 'Delete Token',
  'profile.tokens.delete.modal.description':
    'Are you sure you want to delete this token? You will lose access to the CLI if it is still used.',
  'profile.tokens.delete.modal.submit': 'Delete Token',

  'profile.delete.title': 'Delete',
  'profile.delete.description': 'Delete permanentently this account. This action is irreversible.',
  'profile.delete.submit': 'Delete',
  'profile.delete.modal.title': 'Delete Account',
  'profile.delete.modal.description': 'Write your account email to confirm deletion: {email}',
  'profile.delete.modal.confirm': 'Confirm with your email',
  'profile.delete.modal.submit': 'Delete Account',
} as const;
