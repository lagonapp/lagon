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
} as const;
