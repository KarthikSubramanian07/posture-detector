// token-generator.js
import { AccessToken } from 'livekit-server-sdk';

const API_KEY = 'APIvaqTFiynBGgZ';
const API_SECRET = 'O6Zw4OWAwNTvVtoZJSfglJcXtAqirLsJhTBif7iffCtC';

const roomName = 'test-room'; // or any room name you want
const participantName = 'test-user'; // unique identity

const token = new AccessToken(API_KEY, API_SECRET, {
  identity: participantName,
  ttl: '10m', // token valid for 10 minutes
});

token.addGrant({
  roomJoin: true,
  room: roomName,
  canPublish: true,
  canSubscribe: true,
});

token.toJwt().then(jwt => {
  console.log('Your room token:', jwt);
});