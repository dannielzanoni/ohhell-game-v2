import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { environment } from '@/shared/config/environment.js';

export const CHAT_RECEIVE_EVENT = 'ReceiveMessage';

export function createClassicChatConnection() {
  return new HubConnectionBuilder()
    .withUrl(environment.chatHubUrl)
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}

export function isClassicChatConnected(connection) {
  return connection?.state === HubConnectionState.Connected;
}

export function joinClassicChatLobby(connection, lobbyId) {
  return connection.invoke('JoinLobby', lobbyId);
}

export function leaveClassicChatLobby(connection, lobbyId) {
  return connection.invoke('LeaveLobby', lobbyId);
}

export function sendClassicChatMessage(connection, lobbyId, user, message) {
  return connection.invoke('SendMessage', lobbyId, user, message);
}
