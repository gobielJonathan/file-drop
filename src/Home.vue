<script setup>
import { useRouter } from 'vue-router';
import MaterialSymbolsShare from './icons/MaterialSymbolsShare.vue';
import MaterialSymbolsUpload from './icons/MaterialSymbolsUpload.vue';
import MaterialSymbolsDownload from './icons/MaterialSymbolsDownload.vue';

const router = useRouter()
</script>

<template>
    <div class="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-24">

        <div class="flex flex-col gap-y-3 items-center mb-8 sm:mb-12">
            <div class="border w-16 h-16 rounded-full grid place-items-center">
                <MaterialSymbolsShare />
            </div>
            <h2 class="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">File Share</h2>
            <p class="text-sm sm:text-base text-gray-500 px-4">Share files directly between devices. No sign-up
                required.</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-y-6 sm:gap-x-6">
            <button @click="router.push('/sender')"
                class="rounded-xl border bg-card h-44 sm:h-56 flex flex-col items-center justify-center p-5 sm:p-6 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] hover-elevate">
                <div class="border w-16 h-16 rounded-full grid place-items-center">
                    <MaterialSymbolsUpload width="32" height="32" />
                </div>
                <h4 class="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-2">Send Files</h4>
                <p class="text-xs sm:text-sm text-gray-500 text-center px-2">Share files with connected
                    receivers</p>
            </button>

            <button @click="router.push('/receiver')"
                class="rounded-xl border bg-card h-44 sm:h-56 flex flex-col items-center justify-center p-5 sm:p-6 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] hover-elevate">
                <div class="border w-16 h-16 rounded-full grid place-items-center">
                    <MaterialSymbolsDownload width="32" height="32" />
                </div>
                <h4 class="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-2">Recive Files</h4>
                <p class="text-xs sm:text-sm text-gray-500 text-center px-2">Connect to a sender and receive files</p>
            </button>
        </div>

    </div>

</template>

<style scoped></style>