import { NEW_CONNECTION } from "@/utils/event-peer";
import Peer from "peerjs";
import { ref, onUnmounted } from 'vue';

export default function usePeer({
    onNewConnection = () => { },
}) {
    let peer = null
    let isConnectionEstablished = false

    const onConnection = (conn) => {
        onNewConnection?.({
            type: NEW_CONNECTION,
            data: conn.peer
        })

        conn.on("open", () => {
        });

        conn.on("data", data => {
            onNewConnection?.(data);
        });

        conn.on("close", () => {
        });

        conn.on("error", err => {
            console.error("Conn error:", err);
        });

    }

    const onOpen = (id) => {
        console.log(id);
        isConnectionEstablished = true;
    }

    const onError = (err) => {
        console.error(err);
    }

    function createPeerConnection(peerId) {
        peer = new Peer(peerId);
        peer.on('connection', onConnection);
        peer.on('open', onOpen);
        peer.on('error', onError);
    }

    function getConnection(peer, remotePeerId) {
        const conns = peer.connections?.[remotePeerId];
        if (!conns || conns.length === 0) return null;

        return conns.find(c => c.open) || null;
    }

    function connectToPeer(remotePeerId) {
        if (!peer || !isConnectionEstablished) {
            console.error("Peer connection not established yet.");
            return null;
        }

        const conn = peer.connect(remotePeerId);
        return new Promise((resolve, reject) => {
            conn.on('open', () => {
                resolve(conn)
                console.log('Connection established with peer:', remotePeerId);
            });
            conn.on('error', (err) => {
                reject(err)
                console.error('Connection error with peer:', remotePeerId, err);
            });
        });
    }


    onUnmounted(() => {
        if (peer && !peer.destroyed) {
            peer.destroy();
        }
    })


    return {
        createPeerConnection,
        connectToPeer
    }
}