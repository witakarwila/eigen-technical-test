const admin = require("firebase-admin");

const serviceAccount = process.env.NODE_ENV === "test"
  ? {}
  : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;