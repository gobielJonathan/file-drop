<script setup>
import { useRouter } from 'vue-router';

const router = useRouter()

</script>

<template>
    <button @click="router.push('/receiver')">receiver</button>
    <button @click="router.push('/sender')">sender</button>
</template>

<style scoped>

</style>