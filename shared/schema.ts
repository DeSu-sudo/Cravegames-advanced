import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  craveCoins: integer("crave_coins").notNull().default(0),
  activeAvatarId: varchar("active_avatar_id"),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull().default("gamepad-2"),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  categoryId: varchar("category_id").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  iframeUrl: text("iframe_url"),
  htmlContent: text("html_content"),
  type: text("type").notNull().default("iframe"),
  playCount: integer("play_count").notNull().default(0),
  averageRating: real("average_rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  badge: text("badge"),
  isTrending: boolean("is_trending").notNull().default(false),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
  rating: integer("rating").notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const storeItems = pgTable("store_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  price: integer("price").notNull(),
  itemType: text("item_type").notNull().default("avatar"),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
});

// Friends system
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  friendId: varchar("friend_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const friendRequests = pgTable("friend_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  blockedUserId: varchar("blocked_user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat system
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Private messaging
export const privateConversations = pgTable("private_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull(),
  user2Id: varchar("user2_id").notNull(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
});

export const privateMessages = pgTable("private_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User-uploaded avatars
export const userAvatars = pgTable("user_avatars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  playCount: true,
  averageRating: true,
  ratingCount: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  gameId: true,
});

export const insertRatingSchema = createInsertSchema(ratings).pick({
  userId: true,
  gameId: true,
  rating: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  gameId: true,
  content: true,
});

export const insertStoreItemSchema = createInsertSchema(storeItems).omit({
  id: true,
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  userId: true,
  itemId: true,
});

export const insertFriendRequestSchema = createInsertSchema(friendRequests).pick({
  fromUserId: true,
  toUserId: true,
});

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).pick({
  userId: true,
  blockedUserId: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
  description: true,
  isPublic: true,
  createdBy: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  roomId: true,
  userId: true,
  content: true,
});

export const insertPrivateMessageSchema = createInsertSchema(privateMessages).pick({
  conversationId: true,
  senderId: true,
  content: true,
});

export const insertUserAvatarSchema = createInsertSchema(userAvatars).pick({
  userId: true,
  imageUrl: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertStoreItem = z.infer<typeof insertStoreItemSchema>;
export type StoreItem = typeof storeItems.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export type Friendship = typeof friendships.$inferSelect;

export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type FriendRequest = typeof friendRequests.$inferSelect;

export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type BlockedUser = typeof blockedUsers.$inferSelect;

export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type PrivateConversation = typeof privateConversations.$inferSelect;

export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;
export type PrivateMessage = typeof privateMessages.$inferSelect;

export type InsertUserAvatar = z.infer<typeof insertUserAvatarSchema>;
export type UserAvatar = typeof userAvatars.$inferSelect;

// Extended types for frontend
export type GameWithCategory = Game & { categoryName: string };
export type CommentWithUser = Comment & { username: string; avatarImageUrl: string | null };
export type UserWithAvatar = Omit<User, 'password'> & { avatarImageUrl: string | null };
export type ChatMessageWithUser = ChatMessage & { username: string; avatarImageUrl: string | null };
export type PrivateMessageWithUser = PrivateMessage & { username: string; avatarImageUrl: string | null };
export type FriendRequestWithUser = FriendRequest & { fromUsername: string; fromAvatarImageUrl: string | null };
export type FriendWithInfo = { id: string; friendId: string; username: string; avatarImageUrl: string | null };
export type ConversationWithUser = PrivateConversation & { otherUsername: string; otherAvatarImageUrl: string | null; lastMessage?: string };
