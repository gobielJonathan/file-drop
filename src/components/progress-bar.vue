<script setup>

const props = defineProps({
    percentage: {
        type: Number,
        required: true
    },
    height: {
        type: String,
        default: '8px'
    },
    color: {
        type: String,
        default: 'bg-blue-100'
    },
    rounded: {
        type: Boolean,
        default: false
    },
    animated: {
        type: Boolean,
        default: false
    }
})
</script>

<template>
    <div class="w-full bg-[#1B211A] rounded-sm overflow-hidden" :class="props.rounded ? 'rounded-full' : ''"
        :style="{ height: props.height }">
        <div class="h-full transition-all duration-300" :class="[
            props.color,
            props.rounded ? 'rounded-full' : '',
            props.animated ? 'animate-progress' : ''
        ]" :style="{ width: props.percentage + '%' }"></div>
    </div>
</template>

<style scoped>
@keyframes progress {
    0% {
        opacity: .6
    }

    50% {
        opacity: 1
    }

    100% {
        opacity: .6
    }
}

.animate-progress {
    animation: progress 1.5s ease-in-out infinite;
}
</style>
