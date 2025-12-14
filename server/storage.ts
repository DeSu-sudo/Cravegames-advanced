import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Game, type InsertGame,
  type Favorite, type InsertFavorite,
  type Rating, type InsertRating,
  type Comment, type InsertComment,
  type StoreItem, type InsertStoreItem,
  type Inventory, type InsertInventory,
  type CommentWithUser,
  type Friendship, type FriendRequest, type InsertFriendRequest,
  type BlockedUser, type InsertBlockedUser,
  type ChatRoom, type InsertChatRoom,
  type ChatMessage, type InsertChatMessage, type ChatMessageWithUser,
  type PrivateConversation, type PrivateMessage, type InsertPrivateMessage,
  type FriendRequestWithUser, type FriendWithInfo, type ConversationWithUser,
  type UserAvatar, type InsertUserAvatar
} from "@shared/schema";
import { supabase } from "./supabase";

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

  // Friends
  getFriends(userId: string): Promise<FriendWithInfo[]>;
  addFriend(userId: string, friendId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  
  // Friend Requests
  getFriendRequests(userId: string): Promise<FriendRequestWithUser[]>;
  getSentFriendRequests(userId: string): Promise<FriendRequest[]>;
  sendFriendRequest(request: InsertFriendRequest): Promise<FriendRequest>;
  acceptFriendRequest(requestId: string): Promise<void>;
  rejectFriendRequest(requestId: string): Promise<void>;
  getPendingFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest | undefined>;
  
  // Blocked Users
  getBlockedUsers(userId: string): Promise<{ id: string; blockedUserId: string; username: string }[]>;
  blockUser(data: InsertBlockedUser): Promise<BlockedUser>;
  unblockUser(userId: string, blockedUserId: string): Promise<void>;
  isBlocked(userId: string, otherUserId: string): Promise<boolean>;
  
  // Chat Rooms
  getChatRooms(): Promise<ChatRoom[]>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getChatMessages(roomId: string, limit?: number): Promise<ChatMessageWithUser[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Private Conversations
  getConversations(userId: string): Promise<ConversationWithUser[]>;
  getOrCreateConversation(user1Id: string, user2Id: string): Promise<PrivateConversation>;
  getPrivateMessages(conversationId: string, limit?: number): Promise<PrivateMessage[]>;
  addPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  // User Avatars
  getUserAvatar(userId: string): Promise<UserAvatar | undefined>;
  createUserAvatar(avatar: InsertUserAvatar): Promise<UserAvatar>;
  searchUsers(query: string, excludeUserId: string): Promise<{ id: string; username: string; avatarImageUrl: string | null }[]>;
}

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapUser(data) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    return data ? this.mapUser(data) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const isFirstUser = count === 0;
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: insertUser.username,
        password: insertUser.password,
        crave_coins: 100,
        active_avatar_id: null,
        is_admin: isFirstUser
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUser(data);
  }

  async updateUserCoins(userId: string, coins: number): Promise<void> {
    await supabase
      .from('users')
      .update({ crave_coins: coins })
      .eq('id', userId);
  }

  async updateUserAvatar(userId: string, avatarId: string | null): Promise<void> {
    await supabase
      .from('users')
      .update({ active_avatar_id: avatarId })
      .eq('id', userId);
  }

  private mapUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      craveCoins: data.crave_coins,
      activeAvatarId: data.active_avatar_id,
      isAdmin: data.is_admin
    };
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data } = await supabase
      .from('categories')
      .select('*');
    return (data || []).map(this.mapCategory);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', name)
      .single();
    return data ? this.mapCategory(data) : undefined;
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapCategory(data) : undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        icon: category.icon || 'gamepad-2'
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapCategory(data);
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const { data } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    return data ? this.mapCategory(data) : undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await supabase.from('categories').delete().eq('id', id);
  }

  private mapCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      icon: data.icon
    };
  }

  // Games
  async getGames(): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*');
    return (data || []).map(this.mapGame);
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapGame(data) : undefined;
  }

  async getGamesByCategory(categoryId: string): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('category_id', categoryId);
    return (data || []).map(this.mapGame);
  }

  async getTrendingGames(): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('is_trending', true);
    return (data || []).map(this.mapGame);
  }

  async incrementPlayCount(gameId: string): Promise<void> {
    const game = await this.getGameById(gameId);
    if (game) {
      await supabase
        .from('games')
        .update({ play_count: game.playCount + 1 })
        .eq('id', gameId);
    }
  }

  async updateGameRating(gameId: string, avgRating: number, count: number): Promise<void> {
    await supabase
      .from('games')
      .update({ average_rating: avgRating, rating_count: count })
      .eq('id', gameId);
  }

  async createGame(game: InsertGame): Promise<Game> {
    const { data, error } = await supabase
      .from('games')
      .insert({
        name: game.name,
        description: game.description || null,
        instructions: game.instructions || null,
        category_id: game.categoryId,
        thumbnail_url: game.thumbnailUrl,
        iframe_url: game.iframeUrl || null,
        html_content: game.htmlContent || null,
        type: game.type || 'iframe',
        play_count: 0,
        average_rating: 0,
        rating_count: 0,
        badge: game.badge || null,
        is_trending: game.isTrending || false
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGame(data);
  }

  async updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined> {
    const updateData: any = {};
    if (game.name !== undefined) updateData.name = game.name;
    if (game.description !== undefined) updateData.description = game.description;
    if (game.instructions !== undefined) updateData.instructions = game.instructions;
    if (game.categoryId !== undefined) updateData.category_id = game.categoryId;
    if (game.thumbnailUrl !== undefined) updateData.thumbnail_url = game.thumbnailUrl;
    if (game.iframeUrl !== undefined) updateData.iframe_url = game.iframeUrl;
    if (game.htmlContent !== undefined) updateData.html_content = game.htmlContent;
    if (game.type !== undefined) updateData.type = game.type;
    if (game.badge !== undefined) updateData.badge = game.badge;
    if (game.isTrending !== undefined) updateData.is_trending = game.isTrending;

    const { data } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return data ? this.mapGame(data) : undefined;
  }

  async deleteGame(id: string): Promise<void> {
    await supabase.from('games').delete().eq('id', id);
  }

  private mapGame(data: any): Game {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      categoryId: data.category_id,
      thumbnailUrl: data.thumbnail_url,
      iframeUrl: data.iframe_url,
      htmlContent: data.html_content,
      type: data.type,
      playCount: data.play_count,
      averageRating: data.average_rating,
      ratingCount: data.rating_count,
      badge: data.badge,
      isTrending: data.is_trending
    };
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId);
    return (data || []).map(this.mapFavorite);
  }

  async getFavorite(userId: string, gameId: string): Promise<Favorite | undefined> {
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();
    return data ? this.mapFavorite(data) : undefined;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: favorite.userId,
        game_id: favorite.gameId
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapFavorite(data);
  }

  async removeFavorite(userId: string, gameId: string): Promise<void> {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId);
  }

  private mapFavorite(data: any): Favorite {
    return {
      id: data.id,
      userId: data.user_id,
      gameId: data.game_id
    };
  }

  // Ratings
  async getRatingsByGame(gameId: string): Promise<Rating[]> {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('game_id', gameId);
    return (data || []).map(this.mapRating);
  }

  async getRating(userId: string, gameId: string): Promise<Rating | undefined> {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();
    return data ? this.mapRating(data) : undefined;
  }

  async upsertRating(rating: InsertRating): Promise<Rating> {
    const existing = await this.getRating(rating.userId, rating.gameId);
    
    if (existing) {
      const { data, error } = await supabase
        .from('ratings')
        .update({ rating: rating.rating })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return this.mapRating(data);
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert({
        user_id: rating.userId,
        game_id: rating.gameId,
        rating: rating.rating
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapRating(data);
  }

  private mapRating(data: any): Rating {
    return {
      id: data.id,
      userId: data.user_id,
      gameId: data.game_id,
      rating: data.rating
    };
  }

  // Comments
  async getCommentsByGame(gameId: string): Promise<CommentWithUser[]> {
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (!comments || comments.length === 0) {
      return [];
    }

    const userIds = [...new Set(comments.map((c: any) => c.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username, active_avatar_id')
      .in('id', userIds);

    // Get avatar URLs for users who have active avatars
    const avatarIds = (users || [])
      .filter((u: any) => u.active_avatar_id)
      .map((u: any) => u.active_avatar_id);
    
    let avatarMap = new Map<string, string>();
    if (avatarIds.length > 0) {
      const { data: avatars } = await supabase
        .from('store_items')
        .select('id, image_url')
        .in('id', avatarIds);
      avatarMap = new Map((avatars || []).map((a: any) => [a.id, a.image_url]));
    }

    const userMap = new Map((users || []).map((u: any) => [u.id, {
      username: u.username,
      avatarImageUrl: u.active_avatar_id ? avatarMap.get(u.active_avatar_id) || null : null
    }]));

    return comments.map((comment: any) => {
      const userInfo = userMap.get(comment.user_id) || { username: 'Unknown', avatarImageUrl: null };
      return {
        id: comment.id,
        userId: comment.user_id,
        gameId: comment.game_id,
        content: comment.content,
        createdAt: new Date(comment.created_at),
        username: userInfo.username,
        avatarImageUrl: userInfo.avatarImageUrl
      };
    });
  }

  async addComment(comment: InsertComment): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: comment.userId,
        game_id: comment.gameId,
        content: comment.content
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      gameId: data.game_id,
      content: data.content,
      createdAt: new Date(data.created_at)
    };
  }

  // Store
  async getStoreItems(): Promise<StoreItem[]> {
    const { data } = await supabase
      .from('store_items')
      .select('*');
    return (data || []).map(this.mapStoreItem);
  }

  async getStoreItemById(id: string): Promise<StoreItem | undefined> {
    const { data } = await supabase
      .from('store_items')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapStoreItem(data) : undefined;
  }

  async createStoreItem(item: InsertStoreItem): Promise<StoreItem> {
    const { data, error } = await supabase
      .from('store_items')
      .insert({
        name: item.name,
        image_url: item.imageUrl,
        price: item.price,
        item_type: item.itemType || 'avatar'
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapStoreItem(data);
  }

  async updateStoreItem(id: string, item: Partial<InsertStoreItem>): Promise<StoreItem | undefined> {
    const updateData: any = {};
    if (item.name !== undefined) updateData.name = item.name;
    if (item.imageUrl !== undefined) updateData.image_url = item.imageUrl;
    if (item.price !== undefined) updateData.price = item.price;
    if (item.itemType !== undefined) updateData.item_type = item.itemType;

    const { data } = await supabase
      .from('store_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return data ? this.mapStoreItem(data) : undefined;
  }

  async deleteStoreItem(id: string): Promise<void> {
    await supabase.from('store_items').delete().eq('id', id);
  }

  private mapStoreItem(data: any): StoreItem {
    return {
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
      price: data.price,
      itemType: data.item_type
    };
  }

  // Inventory
  async getInventoryByUser(userId: string): Promise<Inventory[]> {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId);
    return (data || []).map(this.mapInventory);
  }

  async getInventoryItem(userId: string, itemId: string): Promise<Inventory | undefined> {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();
    return data ? this.mapInventory(data) : undefined;
  }

  async addToInventory(inventory: InsertInventory): Promise<Inventory> {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        user_id: inventory.userId,
        item_id: inventory.itemId
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapInventory(data);
  }

  private mapInventory(data: any): Inventory {
    return {
      id: data.id,
      userId: data.user_id,
      itemId: data.item_id
    };
  }

  // Friends
  async getFriends(userId: string): Promise<FriendWithInfo[]> {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', userId);

    if (!friendships || friendships.length === 0) {
      return [];
    }

    const friendIds = friendships.map((f: any) => f.friend_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, username, active_avatar_id')
      .in('id', friendIds);

    const avatarIds = (users || [])
      .filter((u: any) => u.active_avatar_id)
      .map((u: any) => u.active_avatar_id);
    
    let avatarMap = new Map<string, string>();
    if (avatarIds.length > 0) {
      const { data: avatars } = await supabase
        .from('store_items')
        .select('id, image_url')
        .in('id', avatarIds);
      avatarMap = new Map((avatars || []).map((a: any) => [a.id, a.image_url]));
    }

    const userMap = new Map((users || []).map((u: any) => [u.id, {
      username: u.username,
      avatarImageUrl: u.active_avatar_id ? avatarMap.get(u.active_avatar_id) || null : null
    }]));

    return friendships.map((f: any) => {
      const userInfo = userMap.get(f.friend_id) || { username: 'Unknown', avatarImageUrl: null };
      return {
        id: f.id,
        friendId: f.friend_id,
        username: userInfo.username,
        avatarImageUrl: userInfo.avatarImageUrl
      };
    });
  }

  async addFriend(userId: string, friendId: string): Promise<void> {
    await supabase
      .from('friendships')
      .insert([
        { user_id: userId, friend_id: friendId },
        { user_id: friendId, friend_id: userId }
      ]);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
  }

  // Friend Requests
  async getFriendRequests(userId: string): Promise<FriendRequestWithUser[]> {
    const { data: requests } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    if (!requests || requests.length === 0) {
      return [];
    }

    const fromUserIds = requests.map((r: any) => r.from_user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, username, active_avatar_id')
      .in('id', fromUserIds);

    const avatarIds = (users || [])
      .filter((u: any) => u.active_avatar_id)
      .map((u: any) => u.active_avatar_id);
    
    let avatarMap = new Map<string, string>();
    if (avatarIds.length > 0) {
      const { data: avatars } = await supabase
        .from('store_items')
        .select('id, image_url')
        .in('id', avatarIds);
      avatarMap = new Map((avatars || []).map((a: any) => [a.id, a.image_url]));
    }

    const userMap = new Map((users || []).map((u: any) => [u.id, {
      username: u.username,
      avatarImageUrl: u.active_avatar_id ? avatarMap.get(u.active_avatar_id) || null : null
    }]));

    return requests.map((r: any) => {
      const userInfo = userMap.get(r.from_user_id) || { username: 'Unknown', avatarImageUrl: null };
      return {
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        status: r.status,
        createdAt: new Date(r.created_at),
        fromUsername: userInfo.username,
        fromAvatarImageUrl: userInfo.avatarImageUrl
      };
    });
  }

  async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    const { data } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_user_id', userId)
      .eq('status', 'pending');

    return (data || []).map((r: any) => ({
      id: r.id,
      fromUserId: r.from_user_id,
      toUserId: r.to_user_id,
      status: r.status,
      createdAt: new Date(r.created_at)
    }));
  }

  async sendFriendRequest(request: InsertFriendRequest): Promise<FriendRequest> {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: request.fromUserId,
        to_user_id: request.toUserId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      status: data.status,
      createdAt: new Date(data.created_at)
    };
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    const { data: request } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (request) {
      await this.addFriend(request.from_user_id, request.to_user_id);
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
    }
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
  }

  async getPendingFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest | undefined> {
    const { data } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending')
      .single();

    if (!data) return undefined;
    return {
      id: data.id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      status: data.status,
      createdAt: new Date(data.created_at)
    };
  }

  // Blocked Users
  async getBlockedUsers(userId: string): Promise<{ id: string; blockedUserId: string; username: string }[]> {
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', userId);

    if (!blocked || blocked.length === 0) {
      return [];
    }

    const blockedIds = blocked.map((b: any) => b.blocked_user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', blockedIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u.username]));

    return blocked.map((b: any) => ({
      id: b.id,
      blockedUserId: b.blocked_user_id,
      username: userMap.get(b.blocked_user_id) || 'Unknown'
    }));
  }

  async blockUser(data: InsertBlockedUser): Promise<BlockedUser> {
    const { data: result, error } = await supabase
      .from('blocked_users')
      .insert({
        user_id: data.userId,
        blocked_user_id: data.blockedUserId
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: result.id,
      userId: result.user_id,
      blockedUserId: result.blocked_user_id,
      createdAt: new Date(result.created_at)
    };
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);
  }

  async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
    const { data } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(user_id.eq.${userId},blocked_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},blocked_user_id.eq.${userId})`)
      .limit(1);

    return (data && data.length > 0) || false;
  }

  // Chat Rooms
  async getChatRooms(): Promise<ChatRoom[]> {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    return (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isPublic: r.is_public,
      createdBy: r.created_by,
      createdAt: new Date(r.created_at)
    }));
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (!data) return undefined;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isPublic: data.is_public,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  }

  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        name: room.name,
        description: room.description || null,
        is_public: room.isPublic ?? true,
        created_by: room.createdBy
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isPublic: data.is_public,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  }

  async getChatMessages(roomId: string, limit: number = 50): Promise<ChatMessageWithUser[]> {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!messages || messages.length === 0) {
      return [];
    }

    const userIds = [...new Set(messages.map((m: any) => m.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username, active_avatar_id')
      .in('id', userIds);

    const avatarIds = (users || [])
      .filter((u: any) => u.active_avatar_id)
      .map((u: any) => u.active_avatar_id);
    
    let avatarMap = new Map<string, string>();
    if (avatarIds.length > 0) {
      const { data: avatars } = await supabase
        .from('store_items')
        .select('id, image_url')
        .in('id', avatarIds);
      avatarMap = new Map((avatars || []).map((a: any) => [a.id, a.image_url]));
    }

    const userMap = new Map((users || []).map((u: any) => [u.id, {
      username: u.username,
      avatarImageUrl: u.active_avatar_id ? avatarMap.get(u.active_avatar_id) || null : null
    }]));

    return messages.map((m: any) => {
      const userInfo = userMap.get(m.user_id) || { username: 'Unknown', avatarImageUrl: null };
      return {
        id: m.id,
        roomId: m.room_id,
        userId: m.user_id,
        content: m.content,
        createdAt: new Date(m.created_at),
        username: userInfo.username,
        avatarImageUrl: userInfo.avatarImageUrl
      };
    }).reverse();
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: message.roomId,
        user_id: message.userId,
        content: message.content
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      roomId: data.room_id,
      userId: data.user_id,
      content: data.content,
      createdAt: new Date(data.created_at)
    };
  }

  // Private Conversations
  async getConversations(userId: string): Promise<ConversationWithUser[]> {
    const { data: conversations } = await supabase
      .from('private_conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (!conversations || conversations.length === 0) {
      return [];
    }

    const otherUserIds = conversations.map((c: any) => 
      c.user1_id === userId ? c.user2_id : c.user1_id
    );
    const { data: users } = await supabase
      .from('users')
      .select('id, username, active_avatar_id')
      .in('id', otherUserIds);

    const avatarIds = (users || [])
      .filter((u: any) => u.active_avatar_id)
      .map((u: any) => u.active_avatar_id);
    
    let avatarMap = new Map<string, string>();
    if (avatarIds.length > 0) {
      const { data: avatars } = await supabase
        .from('store_items')
        .select('id, image_url')
        .in('id', avatarIds);
      avatarMap = new Map((avatars || []).map((a: any) => [a.id, a.image_url]));
    }

    const userMap = new Map((users || []).map((u: any) => [u.id, {
      username: u.username,
      avatarImageUrl: u.active_avatar_id ? avatarMap.get(u.active_avatar_id) || null : null
    }]));

    const conversationIds = conversations.map((c: any) => c.id);
    const { data: lastMessages } = await supabase
      .from('private_messages')
      .select('conversation_id, content')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    const lastMessageMap = new Map<string, string>();
    (lastMessages || []).forEach((m: any) => {
      if (!lastMessageMap.has(m.conversation_id)) {
        lastMessageMap.set(m.conversation_id, m.content);
      }
    });

    return conversations.map((c: any) => {
      const otherUserId = c.user1_id === userId ? c.user2_id : c.user1_id;
      const userInfo = userMap.get(otherUserId) || { username: 'Unknown', avatarImageUrl: null };
      return {
        id: c.id,
        user1Id: c.user1_id,
        user2Id: c.user2_id,
        lastMessageAt: new Date(c.last_message_at),
        otherUsername: userInfo.username,
        otherAvatarImageUrl: userInfo.avatarImageUrl,
        lastMessage: lastMessageMap.get(c.id)
      };
    });
  }

  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<PrivateConversation> {
    const { data: existing } = await supabase
      .from('private_conversations')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single();

    if (existing) {
      return {
        id: existing.id,
        user1Id: existing.user1_id,
        user2Id: existing.user2_id,
        lastMessageAt: new Date(existing.last_message_at)
      };
    }

    const { data, error } = await supabase
      .from('private_conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user1Id: data.user1_id,
      user2Id: data.user2_id,
      lastMessageAt: new Date(data.last_message_at)
    };
  }

  async getPrivateMessages(conversationId: string, limit: number = 50): Promise<PrivateMessage[]> {
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      isRead: m.is_read,
      createdAt: new Date(m.created_at)
    })).reverse();
  }

  async addPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const { data, error } = await supabase
      .from('private_messages')
      .insert({
        conversation_id: message.conversationId,
        sender_id: message.senderId,
        content: message.content
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('private_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', message.conversationId);

    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content,
      isRead: data.is_read,
      createdAt: new Date(data.created_at)
    };
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  }

  // User Avatars
  async getUserAvatar(userId: string): Promise<UserAvatar | undefined> {
    const { data } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      imageUrl: data.image_url,
      createdAt: new Date(data.created_at)
    };
  }

  async createUserAvatar(avatar: InsertUserAvatar): Promise<UserAvatar> {
    const { data, error } = await supabase
      .from('user_avatars')
      .insert({
        user_id: avatar.userId,
        image_url: avatar.imageUrl
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      imageUrl: data.image_url,
      createdAt: new Date(data.created_at)
    };
  }

  async searchUsers(query: string, excludeUserId: string): Promise<{ id: string; username: string; avatarImageUrl: string | null }[]> {
    const { data: users } = await supabase
      .from('users')
      .select('id, username, active_avatar_id')
      .ilike('username', `%${query}%`)
      .neq('id', excludeUserId)
      .limit(10);

    if (!users || users.length === 0) {
      return [];
    }

    const avatarIds = users
      .filter((u: any) => u.active_avatar_id)
      .map((u: any) => u.active_avatar_id);
    
    let avatarMap = new Map<string, string>();
    if (avatarIds.length > 0) {
      const { data: avatars } = await supabase
        .from('store_items')
        .select('id, image_url')
        .in('id', avatarIds);
      avatarMap = new Map((avatars || []).map((a: any) => [a.id, a.image_url]));
    }

    return users.map((u: any) => ({
      id: u.id,
      username: u.username,
      avatarImageUrl: u.active_avatar_id ? avatarMap.get(u.active_avatar_id) || null : null
    }));
  }
}

export const storage = new SupabaseStorage();
