import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Game, type InsertGame,
  type Favorite, type InsertFavorite,
  type Rating, type InsertRating,
  type Comment, type InsertComment,
  type StoreItem, type InsertStoreItem,
  type Inventory, type InsertInventory,
  type CommentWithUser
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(userId: string, coins: number): Promise<void>;
  updateUserAvatar(userId: string, avatarId: string | null): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  // Games
  getGames(): Promise<Game[]>;
  getGameById(id: string): Promise<Game | undefined>;
  getGamesByCategory(categoryId: string): Promise<Game[]>;
  getTrendingGames(): Promise<Game[]>;
  incrementPlayCount(gameId: string): Promise<void>;
  updateGameRating(gameId: string, avgRating: number, count: number): Promise<void>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: string): Promise<void>;

  // Favorites
  getFavoritesByUser(userId: string): Promise<Favorite[]>;
  getFavorite(userId: string, gameId: string): Promise<Favorite | undefined>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, gameId: string): Promise<void>;

  // Ratings
  getRatingsByGame(gameId: string): Promise<Rating[]>;
  getRating(userId: string, gameId: string): Promise<Rating | undefined>;
  upsertRating(rating: InsertRating): Promise<Rating>;

  // Comments
  getCommentsByGame(gameId: string): Promise<CommentWithUser[]>;
  addComment(comment: InsertComment): Promise<Comment>;

  // Store
  getStoreItems(): Promise<StoreItem[]>;
  getStoreItemById(id: string): Promise<StoreItem | undefined>;
  createStoreItem(item: InsertStoreItem): Promise<StoreItem>;
  updateStoreItem(id: string, item: Partial<InsertStoreItem>): Promise<StoreItem | undefined>;
  deleteStoreItem(id: string): Promise<void>;

  // Inventory
  getInventoryByUser(userId: string): Promise<Inventory[]>;
  getInventoryItem(userId: string, itemId: string): Promise<Inventory | undefined>;
  addToInventory(inventory: InsertInventory): Promise<Inventory>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private games: Map<string, Game>;
  private favorites: Map<string, Favorite>;
  private ratings: Map<string, Rating>;
  private comments: Map<string, Comment>;
  private storeItems: Map<string, StoreItem>;
  private inventory: Map<string, Inventory>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.games = new Map();
    this.favorites = new Map();
    this.ratings = new Map();
    this.comments = new Map();
    this.storeItems = new Map();
    this.inventory = new Map();

    this.seedData();
  }

  private seedData() {
    // Seed only categories - games and avatars are added through admin panel
    const categoryData = [
      { name: "Action", icon: "gamepad-2" },
      { name: "Puzzle", icon: "gamepad-2" },
      { name: "Racing", icon: "gamepad-2" },
      { name: "Sports", icon: "gamepad-2" },
      { name: "Adventure", icon: "gamepad-2" },
    ];

    categoryData.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { id, ...cat });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const isFirstUser = this.users.size === 0;
    const user: User = { ...insertUser, id, craveCoins: 100, activeAvatarId: null, isAdmin: isFirstUser };
    this.users.set(id, user);
    return user;
  }

  async updateUserCoins(userId: string, coins: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.craveCoins = coins;
      this.users.set(userId, user);
    }
  }

  async updateUserAvatar(userId: string, avatarId: string | null): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.activeAvatarId = avatarId;
      this.users.set(userId, user);
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.name.toLowerCase() === name.toLowerCase());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = { id, ...category };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    const updated: Category = { ...existing, ...category };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id);
  }

  // Games
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamesByCategory(categoryId: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.categoryId === categoryId);
  }

  async getTrendingGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.isTrending);
  }

  async incrementPlayCount(gameId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.playCount += 1;
      this.games.set(gameId, game);
    }
  }

  async updateGameRating(gameId: string, avgRating: number, count: number): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.averageRating = avgRating;
      game.ratingCount = count;
      this.games.set(gameId, game);
    }
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = randomUUID();
    const newGame: Game = {
      id,
      name: game.name,
      description: game.description || null,
      instructions: game.instructions || null,
      categoryId: game.categoryId,
      thumbnailUrl: game.thumbnailUrl,
      iframeUrl: game.iframeUrl || null,
      type: game.type || "iframe",
      playCount: 0,
      averageRating: 0,
      ratingCount: 0,
      badge: game.badge || null,
      isTrending: game.isTrending || false,
    };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined> {
    const existing = this.games.get(id);
    if (!existing) return undefined;
    const updated: Game = { ...existing, ...game };
    this.games.set(id, updated);
    return updated;
  }

  async deleteGame(id: string): Promise<void> {
    this.games.delete(id);
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(fav => fav.userId === userId);
  }

  async getFavorite(userId: string, gameId: string): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values()).find(fav => fav.userId === userId && fav.gameId === gameId);
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = randomUUID();
    const newFavorite: Favorite = { ...favorite, id };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }

  async removeFavorite(userId: string, gameId: string): Promise<void> {
    const favorite = await this.getFavorite(userId, gameId);
    if (favorite) {
      this.favorites.delete(favorite.id);
    }
  }

  // Ratings
  async getRatingsByGame(gameId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => rating.gameId === gameId);
  }

  async getRating(userId: string, gameId: string): Promise<Rating | undefined> {
    return Array.from(this.ratings.values()).find(rating => rating.userId === userId && rating.gameId === gameId);
  }

  async upsertRating(rating: InsertRating): Promise<Rating> {
    const existing = await this.getRating(rating.userId, rating.gameId);
    if (existing) {
      existing.rating = rating.rating;
      this.ratings.set(existing.id, existing);
      return existing;
    }
    const id = randomUUID();
    const newRating: Rating = { ...rating, id };
    this.ratings.set(id, newRating);
    return newRating;
  }

  // Comments
  async getCommentsByGame(gameId: string): Promise<CommentWithUser[]> {
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.gameId === gameId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return Promise.all(comments.map(async comment => {
      const user = await this.getUser(comment.userId);
      return {
        ...comment,
        username: user?.username || "Unknown"
      };
    }));
  }

  async addComment(comment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const newComment: Comment = { ...comment, id, createdAt: new Date() };
    this.comments.set(id, newComment);
    return newComment;
  }

  // Store
  async getStoreItems(): Promise<StoreItem[]> {
    return Array.from(this.storeItems.values());
  }

  async getStoreItemById(id: string): Promise<StoreItem | undefined> {
    return this.storeItems.get(id);
  }

  async createStoreItem(item: InsertStoreItem): Promise<StoreItem> {
    const id = randomUUID();
    const newItem: StoreItem = { id, ...item };
    this.storeItems.set(id, newItem);
    return newItem;
  }

  async updateStoreItem(id: string, item: Partial<InsertStoreItem>): Promise<StoreItem | undefined> {
    const existing = this.storeItems.get(id);
    if (!existing) return undefined;
    const updated: StoreItem = { ...existing, ...item };
    this.storeItems.set(id, updated);
    return updated;
  }

  async deleteStoreItem(id: string): Promise<void> {
    this.storeItems.delete(id);
  }

  // Inventory
  async getInventoryByUser(userId: string): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(inv => inv.userId === userId);
  }

  async getInventoryItem(userId: string, itemId: string): Promise<Inventory | undefined> {
    return Array.from(this.inventory.values()).find(inv => inv.userId === userId && inv.itemId === itemId);
  }

  async addToInventory(inventory: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const newInventory: Inventory = { ...inventory, id };
    this.inventory.set(id, newInventory);
    return newInventory;
  }
}

export const storage = new MemStorage();
