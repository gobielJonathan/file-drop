<script setup>
import { computed } from "vue";

const props = defineProps({
    percentage: {
        type: Number,
        required: true
    },
    size: {
        type: Number,
        default: 48
    },
    strokeWidth: {
        type: Number,
        default: 4
    }
})

const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => radius.value * 2 * Math.PI);
const offset = computed(
  () => circumference.value - (props.percentage / 100) * circumference.value
);
</script>

<template>
  <div
    class="relative"
    :style="{ width: props.size + 'px', height: props.size + 'px' }"
  >
    <svg class="transform -rotate-90" :width="props.size" :height="props.size">
      <!-- Background circle -->
      <circle
        class="text-muted"
        :stroke-width="props.strokeWidth"
        stroke="currentColor"
        fill="transparent"
        :r="radius"
        :cx="props.size / 2"
        :cy="props.size / 2"
      />

      <!-- Progress circle -->
      <circle
        class="text-blue-50 transition-all duration-300"
        :stroke-width="props.strokeWidth"
        stroke="currentColor"
        stroke-linecap="round"
        fill="transparent"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        :r="radius"
        :cx="props.size / 2"
        :cy="props.size / 2"
      />
    </svg>

    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-xs font-medium">{{ props.percentage }}%</span>
    </div>
  </div>
</template>
