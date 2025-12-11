<script setup>
import { inject, watchEffect, ref, onMounted } from 'vue'
import useSendFile from './composables/use-send-file';
import usePeer from './composables/use-peer';
import uid from './utils/uid';
import createPeerId from './utils/create-peer-id';
import { NEW_CONNECTION, NEW_CONNECTION_ACCEPTED, NEW_CONNECTION_ASK_FOR_ACCEPT } from './utils/event-peer';

const clients = ref([])
const file = ref(null)

const sendFile = useSendFile()

const { createPeerConnection, connectToPeer } = usePeer({
    onNewConnection: async (data) => {
        if (typeof data === 'string') {
            const parsedData = JSON.parse(data);

            if (parsedData.type === NEW_CONNECTION) {
                clients.value = [...new Set(clients.value.concat(parsedData.data))]
            }
            if (parsedData.type === NEW_CONNECTION_ACCEPTED) {
                if (!parsedData.data.accepted || !parsedData.data.id) return
                const peerConn = await connectToPeer(parsedData.data.id)
                sendFile({
                    file: file.value,
                    onProgress: (data) => {
                        if (data instanceof ArrayBuffer) {
                            peerConn.send(data)
                        }
                        if (typeof data === 'string') {
                            peerConn.send(data)
                        }
                    }
                })
            }
        }

    },
})

const uniqueId = ref(localStorage.getItem('uniqueId') || uid())

onMounted(() => {
    localStorage.setItem('uniqueId', uniqueId.value)
})

onMounted(() => {
    createPeerConnection(createPeerId(uniqueId.value))
})



const onFileChange = fileInput => {
    file.value = fileInput.files[0];
    if (!file.value) return;
}

const sendConfirmationIntoClient = async (peerIdClient) => {
    const peerConn = await connectToPeer(peerIdClient)
    peerConn.send(JSON.stringify({
        type: NEW_CONNECTION_ASK_FOR_ACCEPT,
        data: {
            fileName: file.value.name,
            fileSize: file.value.size,
        }

    }))
}

</script>

<template>
    <h1>Sender</h1>
    <p>unique id: {{ uniqueId }}</p>

    <h4>Connected Clients</h4>
    <ul>
        <li v-for="client in clients" :key="client">
            <span>{{ client.id }}</span>
            <button @click="() => sendConfirmationIntoClient(client.id)">send</button>
        </li>
    </ul>

    <input type="file" @change="e => onFileChange(e.target)" />
</template>

<style scoped></style>
