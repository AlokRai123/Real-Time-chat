import { OutgoingMessage, SupportedMessage as OutgoingSupportedMessages } from './messages/outgoingMessages';
import {connection, server as WebSocketServer} from 'websocket'
import http from 'http'
import { IncomingMessage, SupportedMessage } from './messages/incomingMessages';
import { UserManager } from './UserManager';
import { InMemoryStore } from './store/InMemoryStore';

const server = http.createServer(function(request : any, response : any) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin : string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {

        // todo and rate limiting  logic here
        if (message.type === 'utf8') {

            try {
                messageHandler(connection,JSON.parse(message.utf8Data));
            } catch (error) {
                
            }
            //console.log('Received Message: ' + message.utf8Data);
            //connection.sendUTF(message.utf8Data);
        }
       
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

function messageHandler(ws : connection,message : IncomingMessage){
    if(message.type == SupportedMessage.JoinRoom){
        const payload = message.payload;
        userManager.addUser(payload.name,payload.userId,payload.roomId,ws);
    }
    
    if(message.type == SupportedMessage.SendMessage){
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId,payload.userId);

        if(!user){
            console.error("User is not found in the the db");
            return;
        }

        let chat = store.addChat(payload.userId,user.name,payload.roomId,payload.message);

        if(!chat){
            return;
        }

        const outgoingPayload : OutgoingMessage = {
            type : OutgoingSupportedMessages.AddChat,
            payload : {
                chatId : chat.id,
                    roomId : payload.roomId,
                    message : payload.message,
                    name : user.name,
                    upvotes : 0
            }
        }

        userManager.broadcast(payload.roomId,payload.userId,outgoingPayload);

        
    }

    if(message.type === SupportedMessage.UpvoteMessage){
        const payload = message.payload;
      const chat = store.upvote(payload.userId,payload.roomId,payload.chatId);

        if(!chat){
            return;
        }

        const outgoingPayload : OutgoingMessage = {
            type : OutgoingSupportedMessages.UpdateChat,
            payload : {
                chatId : payload.chatId,
                    roomId : payload.roomId,
                    upvotes : chat.upvotes.length
            }
        }

        userManager.broadcast(payload.roomId,payload.userId,outgoingPayload)
    }
}