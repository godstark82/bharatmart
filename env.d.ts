/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Add your environment variables here
    // Example:
    // NODE_ENV: 'development' | 'production' | 'test';
    // API_URL: string;
    // DATABASE_URL: string;
    
    // Firebase Configuration (example - uncomment and fill in as needed)
    NEXT_PUBLIC_FIREBASE_API_KEY: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    NEXT_PUBLIC_FIREBASE_APP_ID: string;
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
  }
}
