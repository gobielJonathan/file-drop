<script setup>
import { ref, onMounted, inject } from 'vue'
import usePeer from './composables/use-peer';
import uid from './utils/uid';
import createPeerId from './utils/create-peer-id';
import { FILE_DONE, FILE_METADATA, FILE_PROGRESS, NEW_CONNECTION, NEW_CONNECTION_ACCEPTED, NEW_CONNECTION_ASK_FOR_ACCEPT } from './utils/event-peer';
import { downloadFile } from './utils/download-file';

const incomingChunks = ref([]);
const incomingFileMeta = ref(null);
const hasDownloadDone = ref(false);
const hasNewComingReceive = ref(false);
const progressUploadFile = ref(0);

const { createPeerConnection, connectToPeer } = usePeer({
    onNewConnection: (data) => {
        if (typeof data === 'string') {
            const parsedData = JSON.parse(data);

            if (parsedData.type === NEW_CONNECTION_ASK_FOR_ACCEPT) {
                progressUploadFile.value = 0;
                hasNewComingReceive.value = true;
                hasDownloadDone.value = false;
                incomingFileMeta.value = parsedData.data;
                console.log("New incoming file transfer request.");
            }

            if (parsedData.type === FILE_PROGRESS) {
                progressUploadFile.value = parsedData.data.progress
            }

            if (parsedData.type === FILE_DONE) {
                hasDownloadDone.value = true;
                console.log("File transfer completed.");
            }

        }
        if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
            incomingChunks.value.push(data);
        }

    },
})

const myId = ref(localStorage.getItem('uniqueId') || uid())

const senderUniqueId = ref(null)

onMounted(() => {
    localStorage.setItem('uniqueId', myId.value)
})

onMounted(() => {
    createPeerConnection(createPeerId(myId.value))
})


const onConnectSender = async () => {
    const senderIdEl = senderUniqueId.value;
    const peerConn = await connectToPeer(senderIdEl.value)
    peerConn.send(JSON.stringify({
        type: NEW_CONNECTION,
        data: {
            id: myId.value,
        }
    }))

}

const onAcceptIncomingFile = async () => {
    // Logic to accept and receive the incoming file
    const senderIdEl = senderUniqueId.value;
    const peerConn = await connectToPeer(senderIdEl.value)
    peerConn.send(JSON.stringify({
        type: NEW_CONNECTION_ACCEPTED,
        data: {
            accepted: true,
            id: myId.value
        }
    }))
}


const onDownloadFile = () => {
    console.log("Downloading file...", incomingFileMeta.value.fileName);
downloadFile(new Blob(incomingChunks.value), incomingFileMeta.value.fileName);
}
</script>


<template>
    <h1>Receiver</h1>
    <p>My unique id: {{ myId }}</p>
    <input ref="senderUniqueId" type="text" name="" id="" placeholder="Input Sender UniqueId">
    <button @click="onConnectSender">connect</button>

    <div v-if="hasNewComingReceive">
        <h2>Incoming File:</h2>
        <p>File Name: {{ incomingFileMeta.fileName }}</p>
        <p>File Size: {{ incomingFileMeta.fileSize }} bytes</p>
        <!-- You can add more details or actions here -->
        <button @click="onAcceptIncomingFile">Accept</button>
        <button @click="onDownloadFile">Download</button>
        <progress :value="progressUploadFile" max="100"></progress>
    </div>
</template>

<style scoped></style>
