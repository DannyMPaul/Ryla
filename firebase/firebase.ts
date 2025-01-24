import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // your config
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});
const database = getDatabase(app);

export { app, auth, database };
export default app; 