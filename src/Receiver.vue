<script setup>
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

import usePeer from './composables/use-peer';
import uid from './utils/uid';
import createPeerId from './utils/create-peer-id';
import { FILE_DONE, FILE_PROGRESS, NEW_CONNECTION, NEW_CONNECTION_ACCEPTED, NEW_CONNECTION_ASK_FOR_ACCEPT, NEW_CONNECTION_DISCONNECTED, NEW_CONNECTION_REJECTED } from './utils/event-peer';
import { downloadFile } from './utils/download-file';
import convertSize from './utils/format-file-size';

import MaterialSymbolsArrowBack from './icons/MaterialSymbolsArrowBack.vue';
import MaterialSymbolsContentCopyOutline from './icons/MaterialSymbolsContentCopyOutline.vue';
import MaterialSymbolsLinkRounded from './icons/MaterialSymbolsLinkRounded.vue';
import MaterialSymbolsMoveToInboxOutline from './icons/MaterialSymbolsMoveToInboxOutline.vue';
import MaterialSymbolsUploadFileOutline from './icons/MaterialSymbolsUploadFileOutline.vue';
import MaterialSymbolsCheckRounded from './icons/MaterialSymbolsCheckRounded.vue';
import MaterialSymbolsClose from './icons/MaterialSymbolsClose.vue';
import MaterialSymbolsSignalDisconnected from './icons/MaterialSymbolsSignalDisconnected.vue';
import ProgressBar from './components/progress-bar.vue';
import MaterialSymbolsDownload from './icons/MaterialSymbolsDownload.vue';
import MaterialSymbolsAndroidCamera from './icons/MaterialSymbolsAndroidCamera.vue';
import Modal from './components/modal.vue';

const QrcodeStream = defineAsyncComponent(() => import('vue-qrcode-reader').then(module => module.QrcodeStream));

const incomingChunks = ref([]);
const incomingFileMeta = ref(null);
const hasDownloadDone = ref(false);
const hasNewComingReceive = ref(false);
const progressUploadFile = ref(0);
const hasConnectSender = ref(null);
const peerConn = ref(null);
const isOpenModalScanQr = ref(false);


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

onUnmounted(() => {
    if (peerConn.value) {
        peerConn.value.send(
            JSON.stringify({
                type: NEW_CONNECTION_DISCONNECTED,
                data: {
                    id: myId.value
                }
            }
            ))
        peerConn.value.close()
    }
})


const onConnectSender = async () => {
    const _peerConn = await connectToPeer(senderUniqueId.value)
    peerConn.value = _peerConn;
    hasConnectSender.value = true;
    _peerConn.send(JSON.stringify({
        type: NEW_CONNECTION,
        data: {
            id: myId.value,
        }
    }))
}

const onDisconnectSender = () => {
    hasConnectSender.value = false;
    senderUniqueId.value = null;
    incomingFileMeta.value = null;
    hasNewComingReceive.value = false;
    incomingChunks.value = [];

    peerConn.value.send(
        JSON.stringify({
            type: NEW_CONNECTION_DISCONNECTED,
            data: {
                id: myId.value
            }
        }
        ))
    setTimeout(() => {
        peerConn.value.close()
    }, 500);
}

const onAcceptIncomingFile = async () => {
    // Logic to accept and receive the incoming file
    const peerConn = await connectToPeer(senderUniqueId.value)
    peerConn.send(JSON.stringify({
        type: NEW_CONNECTION_ACCEPTED,
        data: {
            accepted: true,
            id: myId.value
        }
    }))
}

const onRejectIncomingFile = async () => {
    // Logic to reject the incoming file
    const peerConn = await connectToPeer(senderUniqueId.value)
    peerConn.send(JSON.stringify({
        type: NEW_CONNECTION_REJECTED,
        data: {
            accepted: false,
            id: myId.value
        }
    }))
}


const onDownloadFile = () => {
    downloadFile(new Blob(incomingChunks.value), incomingFileMeta.value.fileName);
}

const onQrCodeDetect = (detectedCodes) => {
    if (detectedCodes.length > 0) {
        senderUniqueId.value = detectedCodes[0].rawValue
        isOpenModalScanQr.value = false
    }
}
</script>


<template>

    <Modal v-model="isOpenModalScanQr" size="md" @close="isOpenModalScanQr = false">
        <QrcodeStream v-if="isOpenModalScanQr" @detect="onQrCodeDetect"></QrcodeStream>
    </Modal>

    <div class="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
        <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border border-transparent min-h-8 rounded-md mb-2"
            @click="$router.push('/')">
            <MaterialSymbolsArrowBack />
            <span>Back</span>
        </button>
        <h1 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Receive File</h1>

        <div class="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm p-4 sm:p-6">
            <p class="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Your Receiver ID</p>
            <p class="text-base sm:text-lg font-mono font-bold truncate">{{ myId }}</p>
            <button
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-secondary text-secondary-foreground border border-secondary-border h-9 w-9 cursor-pointer">
                <MaterialSymbolsContentCopyOutline />
            </button>
        </div>


        <p class="text-base sm:text-lg font-semibold my-3 sm:my-4">Connect to Sender</p>


        <div class="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm p-4 sm:p-6">
            <div class="space-y-2">
                <div class="flex items-center gap-x-2">
                    <p class="text-xs sm:text-sm font-medium">Status:</p>
                    <div v-if="!hasConnectSender"
                        class="whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-secondary-foreground text-xs">
                        Disconnected
                    </div>

                    <div v-if="hasConnectSender"
                        class="whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-xs text-xs">
                        Connected to {{ senderUniqueId.value }}
                    </div>
                </div>

                <div class="flex items-center">
                    <input v-model="senderUniqueId" type="text" name="" id=""
                        placeholder="Enter Sender ID (e.g. abcde)"
                        class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono text-sm">
                    <button class="p-2 cursor-pointer" @click="isOpenModalScanQr = true">
                        <MaterialSymbolsAndroidCamera />
                    </button>
                </div>

                <button v-if="!hasConnectSender"
                    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-9 px-4 py-2 w-full sm:w-auto cursor-pointer"
                    @click="onConnectSender">
                    <MaterialSymbolsLinkRounded />
                    <span>Connect to Sender</span>
                </button>


                <button v-if="hasConnectSender"
                    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-9 px-4 py-2 w-full sm:w-auto cursor-pointer"
                    @click="onDisconnectSender">
                    <MaterialSymbolsSignalDisconnected />
                    <span>Disconnect</span>
                </button>
            </div>
        </div>

        <div class="flex items-center gap-2 my-3 sm:my-4">
            <MaterialSymbolsMoveToInboxOutline />
            <p>Incoming Files</p>
        </div>


        <div v-if="hasNewComingReceive"
            class="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm p-4 sm:p-6">
            <div class="flex items-start gap-3 sm:gap-4">
                <div
                    class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MaterialSymbolsUploadFileOutline />
                </div>

                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ incomingFileMeta.fileName }}</p>
                    <p class="text-xs text-muted-foreground">{{ convertSize(incomingFileMeta.fileSize) }}</p>

                    <div class="space-y-2" v-if="progressUploadFile">
                        <ProgressBar :percentage="progressUploadFile" color="bg-[#628141]" />
                        <p class="text-sm">{{ progressUploadFile }}% complete</p>
                    </div>

                    <button v-if="hasDownloadDone"
                        class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-8 rounded-md px-3 text-xs flex-1 sm:flex-none cursor-pointer"
                        @click="onDownloadFile">
                        <MaterialSymbolsDownload />
                        <span>Download</span>
                    </button>


                    <div v-if="!progressUploadFile" class="flex gap-2 mt-3 sm:mt-4">
                        <button
                            class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-8 rounded-md px-3 text-xs flex-1 sm:flex-none cursor-pointer"
                            @click="onAcceptIncomingFile">
                            <MaterialSymbolsCheckRounded />
                            <span>Accept</span>
                        </button>
                        <button
                            class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-secondary text-secondary-foreground border border-secondary-border min-h-8 rounded-md px-3 text-xs flex-1 sm:flex-none cursor-pointer"
                            @click="onRejectIncomingFile">
                            <MaterialSymbolsClose />
                            <span>Reject</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

    </div>

</template>

<style scoped></style>