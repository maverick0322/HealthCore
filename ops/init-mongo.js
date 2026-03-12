db = db.getSiblingDB('db_identity');

db.createUser({
  user: 'identity_user',
  pwd: 'identity_password',
  roles: [
    {
      role: 'readWrite',
      db: 'db_identity'
    }
  ]
});

print("=== Base de datos db_identity inicializada con exito ===");