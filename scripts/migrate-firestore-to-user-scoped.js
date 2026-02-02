/**
 * Migrates Firestore data from root-level collections to user-scoped paths.
 *
 * Reads: meals, ingredients, mealIngredients, sides, sideIngredients,
 *        scheduledMeals, deliveryRules, settings (at database root)
 * Writes: users/{targetUid}/meals, users/{targetUid}/ingredients, etc.
 *
 * Preserves document IDs so references (mealId, sideId, etc.) keep working.
 *
 * Prerequisites:
 * 1. Firebase Admin SDK service account key (see README-MIGRATION.md)
 * 2. Your Firebase Auth UID (the user who should own the migrated data)
 *
 * Usage:
 *   node scripts/migrate-firestore-to-user-scoped.js <YOUR_FIREBASE_AUTH_UID>
 *   # or
 *   TARGET_UID=your-uid node scripts/migrate-firestore-to-user-scoped.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ROOT_COLLECTIONS = [
  'meals',
  'ingredients',
  'mealIngredients',
  'sides',
  'sideIngredients',
  'scheduledMeals',
  'deliveryRules',
  'settings'
];

const BATCH_SIZE = 500; // Firestore batch limit

function getTargetUid() {
  const fromEnv = process.env.TARGET_UID;
  const fromArg = process.argv[2];
  const uid = fromArg || fromEnv;
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    console.error('Usage: node scripts/migrate-firestore-to-user-scoped.js <YOUR_FIREBASE_AUTH_UID>');
    console.error('   or: TARGET_UID=your-uid node scripts/migrate-firestore-to-user-scoped.js');
    console.error('\nGet your UID from Firebase Console → Authentication → Users, or from the browser (e.g. auth.currentUser.uid).');
    process.exit(1);
  }
  return uid.trim();
}

function getServiceAccountPath() {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fromEnv) return fromEnv;
  const defaultPath = join(__dirname, '..', 'serviceAccountKey.json');
  return defaultPath;
}

function loadServiceAccount(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error('Service account key file not found:', path);
      console.error('Download it from Firebase Console → Project Settings → Service accounts → Generate new private key.');
      console.error('Save as serviceAccountKey.json in the project root (or set FIREBASE_SERVICE_ACCOUNT path).');
    } else {
      console.error('Failed to read service account:', e.message);
    }
    process.exit(1);
  }
}

async function migrateCollection(db, targetUid, collectionName) {
  const rootRef = db.collection(collectionName);
  const snapshot = await rootRef.get();
  if (snapshot.empty) {
    return { count: 0, skipped: 0 };
  }

  const userColRef = db.collection('users').doc(targetUid).collection(collectionName);
  let written = 0;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    for (const d of chunk) {
      const data = d.data();
      // Preserve Firestore types (Timestamp, etc.) by passing data as-is
      batch.set(userColRef.doc(d.id), data);
      written++;
    }
    await batch.commit();
  }

  return { count: written, skipped: 0 };
}

async function main() {
  const targetUid = getTargetUid();
  const serviceAccountPath = getServiceAccountPath();
  const serviceAccount = loadServiceAccount(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const db = admin.firestore();

  console.log('Firestore migration: root collections → user-scoped');
  console.log('Target user ID:', targetUid);
  console.log('');

  let totalDocs = 0;
  for (const name of ROOT_COLLECTIONS) {
    process.stdout.write(`  ${name}... `);
    try {
      const { count } = await migrateCollection(db, targetUid, name);
      totalDocs += count;
      console.log(count > 0 ? `${count} docs` : 'empty (skipped)');
    } catch (err) {
      console.log('ERROR');
      console.error(err);
      process.exit(1);
    }
  }

  console.log('');
  console.log('Done. Total documents migrated:', totalDocs);
  console.log('You can now use the app with the new rules; data lives under users/' + targetUid + '/');
}

main();
