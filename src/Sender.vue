<script setup>
import { ref, onMounted, useTemplateRef, reactive } from 'vue'
import QrCode from 'qrcode'
import { useDropZone } from '@vueuse/core'


import useSendFile from './composables/use-send-file';
import usePeer from './composables/use-peer';
import uid from './utils/uid';
import createPeerId from './utils/create-peer-id';
import copyText from './utils/copy-text';
import { FILE_DONE, FILE_PROGRESS, NEW_CONNECTION, NEW_CONNECTION_ACCEPTED, NEW_CONNECTION_ASK_FOR_ACCEPT, NEW_CONNECTION_DISCONNECTED } from './utils/event-peer';

import MaterialSymbolsArrowBack from './icons/MaterialSymbolsArrowBack.vue';
import MaterialSymbolsContentCopyOutline from './icons/MaterialSymbolsContentCopyOutline.vue';
import MaterialSymbolsUploadFileOutline from './icons/MaterialSymbolsUploadFileOutline.vue';
import MaterialSymbolsClose from './icons/MaterialSymbolsClose.vue';
import MaterialSymbolsPatientListOutline from './icons/MaterialSymbolsPatientListOutline.vue';
import MaterialSymbolsPerson from './icons/MaterialSymbolsPerson.vue';
import MaterialSymbolsSend from './icons/MaterialSymbolsSend.vue';
import MaterialSymbolsUpload from './icons/MaterialSymbolsUpload.vue';
import CircularProgress from './components/circular-progress.vue';
import Modal from './components/modal.vue';
import MaterialSymbolsQrCode from './icons/MaterialSymbolsQrCode.vue';

const clients = ref([])
const file = ref(null)
const isOpenModalScanQr = ref(false)
const progressUpload = reactive({})
const qrCodeImageUrl = ref('')

const sendFile = useSendFile()

const dropZoneRef = useTemplateRef('dropZoneRef')
function onDrop(files) {
    file.value = files[0];
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
    onDrop,
    multiple: false,
    preventDefaultForUnhandled: false,
})

const fileInputRef = useTemplateRef('fileInputRef')

const { createPeerConnection, connectToPeer } = usePeer({
    onNewConnection: async (data) => {
        if (typeof data === 'string') {
            const parsedData = JSON.parse(data);

            if (parsedData.type === NEW_CONNECTION) {
                console.log("New connection from client:", parsedData.data);
                const alreadyInClients = clients.value.some(c => c.id === parsedData.data.id)
                if (!alreadyInClients) {
                    clients.value = [...new Set(clients.value.concat(parsedData.data))]
                }
            }
            if (parsedData.type === NEW_CONNECTION_DISCONNECTED) {
                clients.value = clients.value.filter(c => c.id !== parsedData.data.id)
            }
            if (parsedData.type === NEW_CONNECTION_ACCEPTED) {
                if (!parsedData.data.accepted || !parsedData.data.id) return
                const peerConn = await connectToPeer(parsedData.data.id)
                progressUpload[parsedData.data.id] = 0

                sendFile({
                    file: file.value,
                    onProgress: (data) => {
                        if (data instanceof ArrayBuffer) {
                            peerConn.send(data)
                        }
                        if (typeof data === 'string') {
                            const fileParsedData = JSON.parse(data);
                            console.log("Sending file progress:", fileParsedData);
                            if (fileParsedData.type === FILE_PROGRESS) {
                                progressUpload[parsedData.data.id] = fileParsedData.data.progress
                            }
                            if (fileParsedData.type === FILE_DONE) {
                                progressUpload[parsedData.data.id] = 100
                            }
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

onMounted(() => {
    QrCode.toDataURL(uniqueId.value)
        .then(url => {
            // You can use the generated QR code URL as needed
            console.log('QR Code URL:', url);
            qrCodeImageUrl.value = url;
        })
        .catch(err => {
            console.error('Error generating QR code:', err);
        });
})

const onFileChange = event => {
    file.value = event.target.files?.[0] || null
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

const onClearFile = () => {
    file.value = null
    progressUpload = {}
}

</script>

<template>
    <Modal v-model="isOpenModalScanQr" size="md" @close="isOpenModalScanQr = false">
        <img :src="qrCodeImageUrl" class="w-full h-full object-contain" alt="">
    </Modal>
    
    <div class="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
        <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border border-transparent min-h-8 rounded-md mb-2"
            @click="$router.push('/')">
            <MaterialSymbolsArrowBack />
            <span>Back</span>
        </button>
        <h1 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Send Files</h1>

        <div class="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm p-4 sm:p-6">
            <p class="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Your Sender ID</p>
            <p class="text-base sm:text-lg font-mono font-bold truncate">{{ uniqueId }}</p>
            <div class="flex gap-x-2">
                <button
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-secondary text-secondary-foreground border border-secondary-border h-9 w-9 cursor-pointer"
                @click="copyText(uniqueId)">
                <MaterialSymbolsContentCopyOutline />
            </button>
            <button 
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-secondary text-secondary-foreground border border-secondary-border h-9 w-9 cursor-pointer"
             @click="isOpenModalScanQr = true">
                        <MaterialSymbolsQrCode />
                    </button>
            </div>
        </div>


        <p class="text-base sm:text-lg font-semibold my-3 sm:my-4">
            Select File
        </p>

        <div v-if="!file" ref="dropZoneRef" @click="fileInputRef?.click()" :class="[
            'h-36 sm:h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all',
            isOverDropZone ? 'border-red-500' : 'border-muted-foreground/25 hover:border-primary/50 active:border-primary'
        ]">
            <div :class="[
                'w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center',
                isOverDropZone ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-muted-foreground/25 bg-muted/50'
            ]">
                <MaterialSymbolsUpload />
            </div>
            <p :class="[
                'text-sm font-medium mt-2',
                isOverDropZone ? 'text-red-500' : 'text-muted-foreground'
            ]">Tap to select a file</p>
            <p :class="[
                'text-xs text-muted-foreground mt-1 hidden sm:block',
                isOverDropZone ? 'text-red-500' : 'text-muted-foreground'
            ]">or drag and drop here</p>
        </div>

        <input type="file" class="hidden" ref="fileInputRef" multiple="false" @change="onFileChange" />

        <div v-if="file"
            class="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <MaterialSymbolsUploadFileOutline />
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ file.name }}</p>
            </div>
            <button
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border border-transparent h-9 w-9 cursor-pointer  "
                @click="onClearFile">
                <MaterialSymbolsClose />
            </button>
        </div>


        <div class="flex items-center gap-2 my-3 sm:my-4">
            <MaterialSymbolsPatientListOutline />
            <span class="text-base sm:text-lg font-semibold">Connected Receivers</span>
        </div>

        <div class="space-y-3">
            <div v-for="client in clients" :key="client"
                class="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm p-3 sm:p-4">
                <div class="flex items-center gap-3 sm:gap-4">
                    <div
                        class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0 bg-gray-100">
                        <MaterialSymbolsPerson />
                    </div>

                    <div class="flex-1 min-w-0">
                        <p>{{ client.id }}</p>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <button v-if="progressUpload[client.id] === undefined"
                            class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-8 rounded-md px-3 text-xs cursor-pointer"
                            @click="() => sendConfirmationIntoClient(client.id)">
                            <MaterialSymbolsSend />
                        </button>
                        <CircularProgress
                            v-if="progressUpload[client.id] !== undefined && progressUpload[client.id] < 100"
                            :percentage="progressUpload[client.id] || 0" />
                        <div v-if="progressUpload[client.id] !== undefined && progressUpload[client.id] === 100" class="rounded-sm border px-2">Sent</div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped></style>