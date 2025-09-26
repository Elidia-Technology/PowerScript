/**
 * # Database Module Documentation
 * 
 * ## Overview
 * 
 * **Module Name:** PowerScript Database  
 * **Package:** eips  
 * **Phase:** 4  
 * **Description:** Comprehensive database integration system providing ORM capabilities, multi-database support, query building, migrations, and connection management.
 *
 * ## Purpose
 * 
 * The Database module provides:
 * - Multi-database support (PostgreSQL, MySQL, MongoDB, SQLite, Redis)
 * - ORM with model definitions and relationships
 * - Query builder with fluent interface
 * - Database migrations and schema management
 * - Connection pooling and management
 * - Transaction support with rollback capabilities
 * - Caching and query optimization
 * - Database monitoring and performance metrics
 * - Data validation and serialization
 *
 * ## Dependencies
 * 
 * ### Core Dependencies
 * - PowerScript Core module
 * - Node.js >= 18.0.0
 * 
 * ### Database Driver Dependencies
 * - `pg` - PostgreSQL driver
 * - `mysql2` - MySQL driver
 * - `mongodb` - MongoDB driver
 * - `sqlite3` - SQLite driver
 * - `redis` - Redis client
 * - `typeorm` - Enhanced ORM features
 * - `knex` - Query builder capabilities
 * - `sequelize` - Alternative ORM option
 *
 * ## Main Classes
 */

/**
 * ## PowerScriptDatabase Class
 * 
 * Main coordination class for all database operations that provides
 * unified access to multiple database providers with ORM capabilities.
 * 
 * ### Constructor (Singleton)
 * ```typescript
 * const database = PowerScriptDatabase.getInstance();
 * ```
 * 
 * ### Configuration Interface
 * ```typescript
 * interface DatabaseConfig {
 *   type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'redis';
 *   host?: string;
 *   port?: number;
 *   database: string;
 *   username?: string;
 *   password?: string;
 *   connectionString?: string;
 *   options?: {
 *     ssl?: boolean;
 *     poolSize?: number;
 *     timeout?: number;
 *     retries?: number;
 *     caching?: boolean;
 *     logging?: boolean;
 *   };
 * }
 * 
 * interface ModelDefinition {
 *   tableName: string;
 *   fields: {
 *     [key: string]: {
 *       type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'text';
 *       required?: boolean;
 *       unique?: boolean;
 *       default?: any;
 *       validate?: Function;
 *     };
 *   };
 *   relationships?: {
 *     [key: string]: {
 *       type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
 *       model: string;
 *       foreignKey?: string;
 *       through?: string;
 *     };
 *   };
 * }
 * ```
 * 
 * ### Methods
 */

/**
 * Configure database connection
 * 
 * @param {String} name - Connection name identifier
 * @param {DatabaseConfig} config - Database configuration
 * @param {DatabaseProvider} provider - Optional custom provider
 * @return {Promise<void>} Promise that resolves when configured
 * 
 * Example:
 * <pre>
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * 
 * // Configure PostgreSQL connection
 * await database.configure('main', {
 *   type: 'postgresql',
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'myapp',
 *   username: 'user',
 *   password: 'password',
 *   options: {
 *     ssl: false,
 *     poolSize: 10,
 *     timeout: 30000,
 *     caching: true
 *   }
 * });
 * 
 * // Configure MongoDB connection
 * await database.configure('mongo', {
 *   type: 'mongodb',
 *   connectionString: 'mongodb://localhost:27017/myapp',
 *   options: {
 *     poolSize: 5,
 *     timeout: 10000
 *   }
 * });
 * </pre>
 */
async configure(name: string, config: DatabaseConfig, provider?: DatabaseProvider): Promise<void>

/**
 * Connect to database
 * 
 * @param {String} name - Connection name (optional, uses default if not provided)
 * @return {Promise<void>} Promise that resolves when connected
 * 
 * Example:
 * <pre>
 * // Connect to default database
 * await database.connect();
 * 
 * // Connect to specific named connection
 * await database.connect('mongo');
 * 
 * console.log('Database connected successfully');
 * </pre>
 */
async connect(name?: string): Promise<void>

/**
 * Disconnect from database
 * 
 * @param {String} name - Connection name (optional, disconnects all if not provided)
 * @return {Promise<void>} Promise that resolves when disconnected
 * 
 * Example:
 * <pre>
 * // Disconnect specific connection
 * await database.disconnect('mongo');
 * 
 * // Disconnect all connections
 * await database.disconnect();
 * </pre>
 */
async disconnect(name?: string): Promise<void>

/**
 * Define a model
 * 
 * @param {String} name - Model name
 * @param {ModelDefinition} definition - Model definition
 * @param {String} connection - Connection name (optional)
 * @return {Model} Created model instance
 * 
 * Example:
 * <pre>
 * // Define User model
 * const User = database.defineModel('User', {
 *   tableName: 'users',
 *   fields: {
 *     id: { type: 'number', required: true, unique: true },
 *     name: { type: 'string', required: true },
 *     email: { type: 'string', required: true, unique: true },
 *     password: { type: 'string', required: true },
 *     createdAt: { type: 'date', default: () => new Date() },
 *     profile: { type: 'json' }
 *   },
 *   relationships: {
 *     posts: {
 *       type: 'hasMany',
 *       model: 'Post',
 *       foreignKey: 'userId'
 *     }
 *   }
 * });
 * 
 * // Define Post model
 * const Post = database.defineModel('Post', {
 *   tableName: 'posts',
 *   fields: {
 *     id: { type: 'number', required: true, unique: true },
 *     title: { type: 'string', required: true },
 *     content: { type: 'text' },
 *     userId: { type: 'number', required: true },
 *     published: { type: 'boolean', default: false },
 *     createdAt: { type: 'date', default: () => new Date() }
 *   },
 *   relationships: {
 *     author: {
 *       type: 'belongsTo',
 *       model: 'User',
 *       foreignKey: 'userId'
 *     }
 *   }
 * });
 * </pre>
 */
defineModel(name: string, definition: ModelDefinition, connection?: string): Model

/**
 * Get model by name
 * 
 * @param {String} name - Model name
 * @return {Model} Model instance
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * if (User) {
 *   const users = await User.findAll();
 *   console.log('Found users:', users.length);
 * }
 * </pre>
 */
getModel(name: string): Model | undefined

/**
 * Execute raw SQL query
 * 
 * @param {String} sql - SQL query string
 * @param {Array} params - Query parameters (optional)
 * @param {String} connection - Connection name (optional)
 * @return {Promise<QueryResult>} Query result
 * 
 * Example:
 * <pre>
 * // Simple query
 * const result = await database.query(
 *   'SELECT * FROM users WHERE active = $1',
 *   [true]
 * );
 * 
 * console.log('Active users:', result.rows);
 * 
 * // Complex query with joins
 * const complexResult = await database.query(`
 *   SELECT u.name, COUNT(p.id) as post_count
 *   FROM users u
 *   LEFT JOIN posts p ON u.id = p.user_id
 *   WHERE u.created_at > $1
 *   GROUP BY u.id, u.name
 *   ORDER BY post_count DESC
 * `, [new Date('2024-01-01')]);
 * </pre>
 */
async query(sql: string, params?: any[], connection?: string): Promise<QueryResult>

/**
 * Start database transaction
 * 
 * @param {String} connection - Connection name (optional)
 * @return {Promise<Transaction>} Transaction instance
 * 
 * Example:
 * <pre>
 * const transaction = await database.beginTransaction();
 * 
 * try {
 *   // Perform multiple operations within transaction
 *   const user = await User.create({
 *     name: 'John Doe',
 *     email: 'john@example.com'
 *   }, { transaction });
 * 
 *   const post = await Post.create({
 *     title: 'First Post',
 *     content: 'This is my first post',
 *     userId: user.id
 *   }, { transaction });
 * 
 *   // Commit transaction
 *   await transaction.commit();
 *   console.log('Transaction completed successfully');
 * } catch (error) {
 *   // Rollback on error
 *   await transaction.rollback();
 *   console.error('Transaction rolled back:', error);
 * }
 * </pre>
 */
async beginTransaction(connection?: string): Promise<Transaction>

/**
 * Run database migration
 * 
 * @param {String} name - Migration name
 * @param {Migration} migration - Migration definition
 * @param {String} connection - Connection name (optional)
 * @return {Promise<MigrationResult>} Migration result
 * 
 * Example:
 * <pre>
 * const migration = {
 *   up: async (db) => {
 *     await db.query(`
 *       CREATE TABLE users (
 *         id SERIAL PRIMARY KEY,
 *         name VARCHAR(255) NOT NULL,
 *         email VARCHAR(255) UNIQUE NOT NULL,
 *         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *       )
 *     `);
 *   },
 *   down: async (db) => {
 *     await db.query('DROP TABLE users');
 *   }
 * };
 * 
 * const result = await database.migrate('create_users_table', migration);
 * console.log('Migration result:', result.success);
 * </pre>
 */
async migrate(name: string, migration: Migration, connection?: string): Promise<MigrationResult>

/**
 * Get database metrics and statistics
 * 
 * @return {Object} Database metrics object
 * 
 * Example:
 * <pre>
 * const metrics = database.getMetrics();
 * console.log('Active connections:', metrics.connections.active);
 * console.log('Total queries:', metrics.queries.total);
 * console.log('Average query time:', metrics.queries.averageTime);
 * console.log('Cache hit rate:', metrics.cache.hitRate);
 * </pre>
 */
getMetrics(): any

/**
 * ## Model Class
 * 
 * Represents a database model with CRUD operations and relationships.
 * 
 * ### Static Methods
 */

/**
 * Find all records matching criteria
 * 
 * @param {Object} where - Where conditions (optional)
 * @param {Object} options - Query options (optional)
 * @return {Promise<Array>} Array of records
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * // Find all users
 * const allUsers = await User.findAll();
 * 
 * // Find with conditions
 * const activeUsers = await User.findAll({
 *   active: true,
 *   createdAt: { $gte: new Date('2024-01-01') }
 * });
 * 
 * // Find with options
 * const recentUsers = await User.findAll({}, {
 *   limit: 10,
 *   offset: 0,
 *   orderBy: 'createdAt DESC',
 *   include: ['posts']
 * });
 * </pre>
 */
static async findAll(where?: WhereClause, options?: QueryOptions): Promise<any[]>

/**
 * Find single record by criteria
 * 
 * @param {Object} where - Where conditions
 * @param {Object} options - Query options (optional)
 * @return {Promise<Object|null>} Single record or null
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * // Find by ID
 * const user = await User.findOne({ id: 123 });
 * 
 * // Find by email
 * const userByEmail = await User.findOne({
 *   email: 'john@example.com'
 * });
 * 
 * // Find with relationships
 * const userWithPosts = await User.findOne(
 *   { id: 123 },
 *   { include: ['posts'] }
 * );
 * </pre>
 */
static async findOne(where: WhereClause, options?: QueryOptions): Promise<any | null>

/**
 * Find record by primary key
 * 
 * @param {String|Number} id - Primary key value
 * @param {Object} options - Query options (optional)
 * @return {Promise<Object|null>} Record or null
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * const user = await User.findById(123);
 * 
 * if (user) {
 *   console.log('User found:', user.name);
 * } else {
 *   console.log('User not found');
 * }
 * </pre>
 */
static async findById(id: string | number, options?: QueryOptions): Promise<any | null>

/**
 * Create new record
 * 
 * @param {Object} data - Record data
 * @param {Object} options - Creation options (optional)
 * @return {Promise<Object>} Created record
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * const newUser = await User.create({
 *   name: 'Jane Doe',
 *   email: 'jane@example.com',
 *   password: 'hashedPassword123',
 *   profile: {
 *     age: 28,
 *     city: 'New York'
 *   }
 * });
 * 
 * console.log('Created user:', newUser.id);
 * </pre>
 */
static async create(data: any, options?: any): Promise<any>

/**
 * Update records matching criteria
 * 
 * @param {Object} data - Updated data
 * @param {Object} where - Where conditions
 * @param {Object} options - Update options (optional)
 * @return {Promise<Number>} Number of updated records
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * // Update single user
 * const updatedCount = await User.update(
 *   { name: 'John Smith' },
 *   { id: 123 }
 * );
 * 
 * // Bulk update
 * const bulkUpdated = await User.update(
 *   { active: false },
 *   { lastLoginAt: { $lt: new Date('2023-01-01') } }
 * );
 * 
 * console.log('Updated records:', updatedCount);
 * </pre>
 */
static async update(data: any, where: WhereClause, options?: any): Promise<number>

/**
 * Delete records matching criteria
 * 
 * @param {Object} where - Where conditions
 * @param {Object} options - Delete options (optional)
 * @return {Promise<Number>} Number of deleted records
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * // Delete single user
 * const deletedCount = await User.delete({ id: 123 });
 * 
 * // Bulk delete inactive users
 * const bulkDeleted = await User.delete({
 *   active: false,
 *   createdAt: { $lt: new Date('2020-01-01') }
 * });
 * 
 * console.log('Deleted records:', deletedCount);
 * </pre>
 */
static async delete(where: WhereClause, options?: any): Promise<number>

/**
 * Count records matching criteria
 * 
 * @param {Object} where - Where conditions (optional)
 * @return {Promise<Number>} Record count
 * 
 * Example:
 * <pre>
 * const User = database.getModel('User');
 * 
 * // Count all users
 * const totalUsers = await User.count();
 * 
 * // Count active users
 * const activeUsers = await User.count({ active: true });
 * 
 * console.log(`${activeUsers} out of ${totalUsers} users are active`);
 * </pre>
 */
static async count(where?: WhereClause): Promise<number>

/**
 * ## Usage Examples
 * 
 * ### Basic Database Setup
 * ```typescript
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * 
 * // Configure multiple database connections
 * await database.configure('main', {
 *   type: 'postgresql',
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'myapp_production',
 *   username: process.env.DB_USER,
 *   password: process.env.DB_PASSWORD,
 *   options: {
 *     ssl: true,
 *     poolSize: 20,
 *     timeout: 30000,
 *     caching: true,
 *     logging: true
 *   }
 * });
 * 
 * await database.configure('cache', {
 *   type: 'redis',
 *   host: 'localhost',
 *   port: 6379,
 *   options: {
 *     poolSize: 10
 *   }
 * });
 * 
 * // Connect to databases
 * await database.connect('main');
 * await database.connect('cache');
 * 
 * console.log('All databases connected successfully');
 * ```
 * 
 * ### Model Definition and Relationships
 * ```typescript
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * 
 * // Define User model
 * const User = database.defineModel('User', {
 *   tableName: 'users',
 *   fields: {
 *     id: { type: 'number', required: true, unique: true },
 *     username: { type: 'string', required: true, unique: true },
 *     email: { type: 'string', required: true, unique: true },
 *     passwordHash: { type: 'string', required: true },
 *     firstName: { type: 'string', required: true },
 *     lastName: { type: 'string', required: true },
 *     avatar: { type: 'string' },
 *     isActive: { type: 'boolean', default: true },
 *     lastLoginAt: { type: 'date' },
 *     preferences: { type: 'json', default: {} },
 *     createdAt: { type: 'date', default: () => new Date() },
 *     updatedAt: { type: 'date', default: () => new Date() }
 *   },
 *   relationships: {
 *     posts: {
 *       type: 'hasMany',
 *       model: 'Post',
 *       foreignKey: 'authorId'
 *     },
 *     profile: {
 *       type: 'hasOne',
 *       model: 'UserProfile',
 *       foreignKey: 'userId'
 *     },
 *     roles: {
 *       type: 'belongsToMany',
 *       model: 'Role',
 *       through: 'UserRoles',
 *       foreignKey: 'userId'
 *     }
 *   }
 * });
 * 
 * // Define Post model
 * const Post = database.defineModel('Post', {
 *   tableName: 'posts',
 *   fields: {
 *     id: { type: 'number', required: true, unique: true },
 *     title: { type: 'string', required: true },
 *     slug: { type: 'string', required: true, unique: true },
 *     content: { type: 'text' },
 *     excerpt: { type: 'text' },
 *     authorId: { type: 'number', required: true },
 *     categoryId: { type: 'number' },
 *     status: { type: 'string', default: 'draft' },
 *     publishedAt: { type: 'date' },
 *     metadata: { type: 'json', default: {} },
 *     createdAt: { type: 'date', default: () => new Date() },
 *     updatedAt: { type: 'date', default: () => new Date() }
 *   },
 *   relationships: {
 *     author: {
 *       type: 'belongsTo',
 *       model: 'User',
 *       foreignKey: 'authorId'
 *     },
 *     category: {
 *       type: 'belongsTo',
 *       model: 'Category',
 *       foreignKey: 'categoryId'
 *     },
 *     tags: {
 *       type: 'belongsToMany',
 *       model: 'Tag',
 *       through: 'PostTags',
 *       foreignKey: 'postId'
 *     }
 *   }
 * });
 * 
 * // Define Category model
 * const Category = database.defineModel('Category', {
 *   tableName: 'categories',
 *   fields: {
 *     id: { type: 'number', required: true, unique: true },
 *     name: { type: 'string', required: true },
 *     slug: { type: 'string', required: true, unique: true },
 *     description: { type: 'text' },
 *     parentId: { type: 'number' },
 *     createdAt: { type: 'date', default: () => new Date() }
 *   },
 *   relationships: {
 *     posts: {
 *       type: 'hasMany',
 *       model: 'Post',
 *       foreignKey: 'categoryId'
 *     },
 *     parent: {
 *       type: 'belongsTo',
 *       model: 'Category',
 *       foreignKey: 'parentId'
 *     },
 *     children: {
 *       type: 'hasMany',
 *       model: 'Category',
 *       foreignKey: 'parentId'
 *     }
 *   }
 * });
 * ```
 * 
 * ### CRUD Operations
 * ```typescript
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * const User = database.getModel('User');
 * const Post = database.getModel('Post');
 * 
 * // Create operations
 * async function createUser() {
 *   const newUser = await User.create({
 *     username: 'johndoe2024',
 *     email: 'john@example.com',
 *     passwordHash: await hashPassword('secure123'),
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     preferences: {
 *       theme: 'dark',
 *       notifications: true,
 *       language: 'en'
 *     }
 *   });
 * 
 *   console.log('Created user:', newUser.id);
 *   return newUser;
 * }
 * 
 * // Read operations
 * async function getUsers() {
 *   // Get all active users
 *   const activeUsers = await User.findAll({ isActive: true });
 * 
 *   // Get user with posts
 *   const userWithPosts = await User.findOne(
 *     { id: 1 },
 *     { include: ['posts', 'profile'] }
 *   );
 * 
 *   // Get recent posts with authors
 *   const recentPosts = await Post.findAll(
 *     { 
 *       status: 'published',
 *       publishedAt: { $gte: new Date('2024-01-01') }
 *     },
 *     {
 *       limit: 10,
 *       orderBy: 'publishedAt DESC',
 *       include: ['author', 'category', 'tags']
 *     }
 *   );
 * 
 *   return { activeUsers, userWithPosts, recentPosts };
 * }
 * 
 * // Update operations
 * async function updateUser(userId: number, updates: any) {
 *   const updatedCount = await User.update(
 *     {
 *       ...updates,
 *       updatedAt: new Date()
 *     },
 *     { id: userId }
 *   );
 * 
 *   if (updatedCount > 0) {
 *     console.log('User updated successfully');
 *     return await User.findById(userId);
 *   }
 * 
 *   return null;
 * }
 * 
 * // Delete operations
 * async function deleteInactiveUsers() {
 *   const cutoffDate = new Date();
 *   cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // 2 years ago
 * 
 *   const deletedCount = await User.delete({
 *     isActive: false,
 *     lastLoginAt: { $lt: cutoffDate }
 *   });
 * 
 *   console.log(`Deleted ${deletedCount} inactive users`);
 *   return deletedCount;
 * }
 * ```
 * 
 * ### Advanced Querying
 * ```typescript
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * 
 * // Complex queries with raw SQL
 * async function getPopularAuthors() {
 *   const result = await database.query(`
 *     SELECT 
 *       u.id,
 *       u.username,
 *       u.first_name,
 *       u.last_name,
 *       COUNT(p.id) as post_count,
 *       AVG(p.views) as avg_views,
 *       MAX(p.published_at) as last_post_date
 *     FROM users u
 *     INNER JOIN posts p ON u.id = p.author_id
 *     WHERE p.status = $1 
 *       AND p.published_at >= $2
 *     GROUP BY u.id, u.username, u.first_name, u.last_name
 *     HAVING COUNT(p.id) >= $3
 *     ORDER BY post_count DESC, avg_views DESC
 *     LIMIT $4
 *   `, ['published', new Date('2024-01-01'), 5, 10]);
 * 
 *   return result.rows;
 * }
 * 
 * // Aggregation queries
 * async function getPostStatistics() {
 *   const stats = await database.query(`
 *     SELECT 
 *       c.name as category,
 *       COUNT(p.id) as total_posts,
 *       SUM(CASE WHEN p.status = 'published' THEN 1 ELSE 0 END) as published_posts,
 *       AVG(LENGTH(p.content)) as avg_content_length,
 *       MIN(p.created_at) as oldest_post,
 *       MAX(p.created_at) as newest_post
 *     FROM categories c
 *     LEFT JOIN posts p ON c.id = p.category_id
 *     GROUP BY c.id, c.name
 *     ORDER BY total_posts DESC
 *   `);
 * 
 *   return stats.rows;
 * }
 * 
 * // Search functionality
 * async function searchPosts(searchTerm: string) {
 *   const searchResults = await database.query(`
 *     SELECT 
 *       p.*,
 *       u.username as author_name,
 *       c.name as category_name,
 *       ts_rank_cd(
 *         to_tsvector('english', p.title || ' ' || p.content),
 *         plainto_tsquery('english', $1)
 *       ) as relevance
 *     FROM posts p
 *     INNER JOIN users u ON p.author_id = u.id
 *     INNER JOIN categories c ON p.category_id = c.id
 *     WHERE p.status = 'published'
 *       AND (
 *         to_tsvector('english', p.title || ' ' || p.content) @@ plainto_tsquery('english', $1)
 *         OR p.title ILIKE $2
 *         OR p.content ILIKE $2
 *       )
 *     ORDER BY relevance DESC, p.published_at DESC
 *     LIMIT 20
 *   `, [searchTerm, `%${searchTerm}%`]);
 * 
 *   return searchResults.rows;
 * }
 * ```
 * 
 * ### Transactions and Data Integrity
 * ```typescript
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * const User = database.getModel('User');
 * const Post = database.getModel('Post');
 * 
 * // Transaction example - Create user with initial post
 * async function createUserWithPost(userData: any, postData: any) {
 *   const transaction = await database.beginTransaction();
 * 
 *   try {
 *     // Create user
 *     const user = await User.create(userData, { transaction });
 * 
 *     // Create initial post
 *     const post = await Post.create({
 *       ...postData,
 *       authorId: user.id
 *     }, { transaction });
 * 
 *     // Update user stats
 *     await User.update(
 *       { postsCount: 1 },
 *       { id: user.id },
 *       { transaction }
 *     );
 * 
 *     // Commit transaction
 *     await transaction.commit();
 * 
 *     console.log('User and post created successfully');
 *     return { user, post };
 *   } catch (error) {
 *     // Rollback on any error
 *     await transaction.rollback();
 *     console.error('Transaction failed:', error);
 *     throw error;
 *   }
 * }
 * 
 * // Batch operations with transaction
 * async function batchUpdatePostStatus(postIds: number[], newStatus: string) {
 *   const transaction = await database.beginTransaction();
 * 
 *   try {
 *     const results = [];
 * 
 *     for (const postId of postIds) {
 *       const updated = await Post.update(
 *         { 
 *           status: newStatus,
 *           updatedAt: new Date()
 *         },
 *         { id: postId },
 *         { transaction }
 *       );
 *       results.push({ postId, updated });
 *     }
 * 
 *     await transaction.commit();
 *     console.log(`Updated ${results.length} posts to status: ${newStatus}`);
 *     return results;
 *   } catch (error) {
 *     await transaction.rollback();
 *     console.error('Batch update failed:', error);
 *     throw error;
 *   }
 * }
 * ```
 * 
 * ### Database Migrations
 * ```typescript
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * 
 * // Create initial schema migration
 * const createUsersTable = {
 *   up: async (db) => {
 *     await db.query(`
 *       CREATE TABLE users (
 *         id SERIAL PRIMARY KEY,
 *         username VARCHAR(50) UNIQUE NOT NULL,
 *         email VARCHAR(255) UNIQUE NOT NULL,
 *         password_hash VARCHAR(255) NOT NULL,
 *         first_name VARCHAR(100) NOT NULL,
 *         last_name VARCHAR(100) NOT NULL,
 *         avatar VARCHAR(255),
 *         is_active BOOLEAN DEFAULT true,
 *         last_login_at TIMESTAMP,
 *         preferences JSONB DEFAULT '{}',
 *         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *       )
 *     `);
 * 
 *     // Create indexes
 *     await db.query('CREATE INDEX idx_users_email ON users(email)');
 *     await db.query('CREATE INDEX idx_users_username ON users(username)');
 *     await db.query('CREATE INDEX idx_users_active ON users(is_active)');
 *   },
 *   down: async (db) => {
 *     await db.query('DROP TABLE users');
 *   }
 * };
 * 
 * // Add new column migration
 * const addUserVerification = {
 *   up: async (db) => {
 *     await db.query(`
 *       ALTER TABLE users 
 *       ADD COLUMN email_verified BOOLEAN DEFAULT false,
 *       ADD COLUMN verification_token VARCHAR(255),
 *       ADD COLUMN verification_expires_at TIMESTAMP
 *     `);
 * 
 *     await db.query('CREATE INDEX idx_users_verification ON users(verification_token)');
 *   },
 *   down: async (db) => {
 *     await db.query(`
 *       ALTER TABLE users 
 *       DROP COLUMN email_verified,
 *       DROP COLUMN verification_token,
 *       DROP COLUMN verification_expires_at
 *     `);
 *   }
 * };
 * 
 * // Run migrations
 * async function runMigrations() {
 *   try {
 *     await database.migrate('001_create_users_table', createUsersTable);
 *     await database.migrate('002_add_user_verification', addUserVerification);
 *     console.log('All migrations completed successfully');
 *   } catch (error) {
 *     console.error('Migration failed:', error);
 *   }
 * }
 * 
 * runMigrations();
 * ```
 * 
 * ### Performance Monitoring
 * ```typescript
 * import { PowerScriptDatabase } from "eips";
 * 
 * const database = PowerScriptDatabase.getInstance();
 * 
 * // Database event monitoring
 * database.on('query:start', (event) => {
 *   console.log(`[${event.timestamp}] Query started: ${event.sql.substring(0, 100)}...`);
 * });
 * 
 * database.on('query:complete', (event) => {
 *   console.log(`[${event.timestamp}] Query completed in ${event.duration}ms`);
 *   
 *   // Log slow queries
 *   if (event.duration > 1000) {
 *     console.warn(`Slow query detected (${event.duration}ms): ${event.sql}`);
 *   }
 * });
 * 
 * database.on('connection:error', (event) => {
 *   console.error(`Database connection error: ${event.error.message}`);
 *   // Implement retry logic or alerting
 * });
 * 
 * // Periodic performance reporting
 * setInterval(() => {
 *   const metrics = database.getMetrics();
 *   
 *   console.log('\\n--- Database Performance Report ---');
 *   console.log(`Active Connections: ${metrics.connections.active}/${metrics.connections.total}`);
 *   console.log(`Total Queries: ${metrics.queries.total}`);
 *   console.log(`Query Success Rate: ${(metrics.queries.successful / metrics.queries.total * 100).toFixed(2)}%`);
 *   console.log(`Average Query Time: ${metrics.queries.averageTime.toFixed(2)}ms`);
 *   console.log(`Slow Queries: ${metrics.queries.slowQueries}`);
 *   console.log(`Cache Hit Rate: ${(metrics.cache.hitRate * 100).toFixed(2)}%`);
 *   console.log(`Active Transactions: ${metrics.transactions.started - metrics.transactions.committed - metrics.transactions.rolledBack}`);
 *   console.log('--- End Report ---\\n');
 * }, 60000); // Every minute
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Connection Management**: Use connection pooling for better performance
 * 2. **Transactions**: Use transactions for data integrity in multi-step operations
 * 3. **Indexing**: Create proper database indexes for frequently queried fields
 * 4. **Query Optimization**: Monitor and optimize slow queries
 * 5. **Data Validation**: Validate data at the model level before database operations
 * 6. **Security**: Use parameterized queries to prevent SQL injection
 * 
 * ```typescript
 * // Example of secure and optimized database usage
 * const secureConfig = {
 *   type: 'postgresql',
 *   host: process.env.DB_HOST,
 *   database: process.env.DB_NAME,
 *   username: process.env.DB_USER,
 *   password: process.env.DB_PASSWORD,
 *   options: {
 *     ssl: true,
 *     poolSize: 20,
 *     timeout: 30000,
 *     caching: true,
 *     logging: process.env.NODE_ENV === 'development'
 *   }
 * };
 * 
 * // Always use parameterized queries
 * const safeQuery = await database.query(
 *   'SELECT * FROM users WHERE email = $1 AND active = $2',
 *   [email, true]
 * );
 * 
 * // Use appropriate indexes
 * await database.query(`
 *   CREATE INDEX CONCURRENTLY idx_posts_published 
 *   ON posts(published_at) 
 *   WHERE status = 'published'
 * `);
 * ```
 */