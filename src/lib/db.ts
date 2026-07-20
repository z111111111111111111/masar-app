export interface User {
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface Subscription {
  email: string; // using email as userId for simplicity
  plan: string;
  status: 'active' | 'inactive';
  amount: number;
  paidAt: string;
  expiresAt: string;
}

const DB_NAME = 'MasarDB';
const DB_VERSION = 1;

function log(...args: any[]) {
  console.log('[MasarDB]', ...args);
}

// SHA-256 hash
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      log('Database error:', event);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }
      if (!db.objectStoreNames.contains('subscriptions')) {
        db.createObjectStore('subscriptions', { keyPath: 'email' });
      }
      log('Database upgrade complete');
    };
  });

  return dbPromise;
}

// --- Users ---

export async function createUser(user: Omit<User, 'passwordHash' | 'createdAt'> & { password: string }): Promise<User> {
  log('Creating user:', user.email);
  const db = await getDB();
  const passwordHash = await hashPassword(user.password);
  
  const newUser: User = {
    email: user.email,
    name: user.name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.add(newUser);

    request.onsuccess = () => resolve(newUser);
    request.onerror = () => {
      if (request.error?.name === 'ConstraintError') {
        reject(new Error('User with this email already exists'));
      } else {
        reject(request.error);
      }
    };
  });
}

export async function checkEmailExists(email: string): Promise<boolean> {
  log('Checking email:', email);
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function authenticateUser(email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
  log('Authenticating user:', email);
  const db = await getDB();
  const passwordHash = await hashPassword(password);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email);

    request.onsuccess = () => {
      const user = request.result as User | undefined;
      if (user && user.passwordHash === passwordHash) {
        const { passwordHash: _hash, ...userWithoutHash } = user;
        resolve(userWithoutHash as any); // user.name is required in return, casting to bypass strict type issue easily
      } else {
        reject(new Error('Invalid email or password'));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// --- Subscriptions ---

export async function getSubscription(email: string): Promise<Subscription | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptions'], 'readonly');
    const store = transaction.objectStore('subscriptions');
    const request = store.get(email);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function activateSubscription(email: string, amount: number): Promise<Subscription> {
  log('Activating subscription for:', email);
  const db = await getDB();
  
  const now = new Date();
  const expires = new Date();
  expires.setMonth(now.getMonth() + 9); // 9 months (full academic year)

  const sub: Subscription = {
    email,
    plan: 'full_year',
    status: 'active',
    amount,
    paidAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptions'], 'readwrite');
    const store = transaction.objectStore('subscriptions');
    const request = store.put(sub);

    request.onsuccess = () => resolve(sub);
    request.onerror = () => reject(request.error);
  });
}
