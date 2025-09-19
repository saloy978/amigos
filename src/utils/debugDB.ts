// Utility for debugging database operations
import { supabase } from '../services/supabaseClient';

export class DatabaseDebugger {
  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing database connection...');
      const { data, error } = await supabase.from('cards').select('count').limit(1);
      
      if (error) {
        console.error('❌ Database connection failed:', error);
        return false;
      }
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection error:', error);
      return false;
    }
  }

  // Check authentication status
  static async checkAuth(): Promise<void> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth check failed:', error);
        return;
      }
      
      if (user) {
        console.log('✅ User authenticated:', {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        });
      } else {
        console.log('❌ No authenticated user');
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
    }
  }

  // Test basic CRUD operations
  static async testCRUD(): Promise<void> {
    try {
      console.log('🧪 Testing CRUD operations...');
      
      // Test read
      const { data: cards, error: readError } = await supabase
        .from('cards')
        .select('*')
        .limit(5);
      
      if (readError) {
        console.error('❌ Read test failed:', readError);
        return;
      }
      
      console.log('✅ Read test successful, found cards:', cards?.length || 0);
      
      // Test user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .limit(1);
      
      if (settingsError) {
        console.error('❌ Settings read test failed:', settingsError);
      } else {
        console.log('✅ Settings read test successful');
      }
      
    } catch (error) {
      console.error('❌ CRUD test error:', error);
    }
  }

  // Log all database operations
  static enableVerboseLogging(): void {
    console.log('🔊 Enabling verbose database logging...');
    
    // Override console methods to capture all logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      if (args[0]?.includes?.('CardService') || args[0]?.includes?.('UserService')) {
        originalLog('📊 [DB]', ...args);
      } else {
        originalLog(...args);
      }
    };
    
    console.error = (...args) => {
      if (args[0]?.includes?.('CardService') || args[0]?.includes?.('UserService')) {
        originalError('🚨 [DB ERROR]', ...args);
      } else {
        originalError(...args);
      }
    };
  }

  // Run all debug tests
  static async runAllTests(): Promise<void> {
    console.log('🚀 Running all database debug tests...');
    
    await this.testConnection();
    await this.checkAuth();
    await this.testCRUD();
    
    console.log('🏁 Debug tests completed');
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).dbDebug = DatabaseDebugger;
  console.log('🛠️ Database debugger available as window.dbDebug');
}

