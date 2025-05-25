
import z from 'zod';

const JOIN_ROOM = "JOIN_ROOM";
const SEND_MESSAGE = "SEND_MESSAGE";
const UPVOTE_MESSAGE = "UPVOTE_MESSAGE";

const SUPPORTED_MESSAGE_TYPES = [JOIN_ROOM,SEND_MESSAGE,UPVOTE_MESSAGE];

const InitMessage = z.object({
    name : z.string(),
    userId : z.string(),
    roomId : z.string(),
})

export type InitMessageType = z.infer<typeof InitMessage>;

export const UserMessage = z.object({
    userId : z.string(),
    roomId : z.string(),
    message : z.string(),
})
export type UserMessage = z.infer<typeof UserMessage>;

export const UpvoteMessage = z.object({
    userId : z.string(),
    roomId : z.string(),
    chatId : z.string(),
})

export type UpvoteMessage = z.infer<typeof UpvoteMessage>;