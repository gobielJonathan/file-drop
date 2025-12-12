<!-- Modal.vue -->
<template>
    <transition name="modal-fade" appear>
        <div v-show="modelValue" class="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="false">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="onBackdropClick"></div>

            <!-- Modal panel -->
            <div ref="panel" role="dialog" :aria-modal="true" :aria-labelledby="titleId" :class="[
                'relative z-10 mx-4 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden transform transition-all bg-white',
                sizeClass
            ]" @keydown.tab.prevent="handleTabKey" @keydown.esc.prevent="onEscKey">
                <!-- Header slot -->
                <header v-if="$slots.header" class="px-6 py-4 border-b">
                    <slot name="header"></slot>
                </header>

                <!-- Default/body slot -->
                <section class="p-6">
                    <slot />
                </section>

                <!-- Footer slot -->
                <footer v-if="$slots.footer" class="px-6 py-4 border-t">
                    <slot name="footer"></slot>
                </footer>

                <!-- Close button (top-right) -->
                <button
                    class="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    @click="close" :aria-label="closeLabel">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"
                        aria-hidden="true">
                        <path fill-rule="evenodd"
                            d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05A1 1 0 115.05 3.636L10 8.586z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'

const props = defineProps({
    modelValue: { type: Boolean, required: true },
    /** 'sm' | 'md' | 'lg' | 'full' */
    size: { type: String, default: 'md' },
    closeOnBackdrop: { type: Boolean, default: true },
    closeOnEsc: { type: Boolean, default: true },
    closeLabel: { type: String, default: 'Close modal' },
})

const emit = defineEmits(['update:modelValue', 'close'])

const panel = ref(null)
const lastFocused = ref(null)
const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`

// size -> tailwind classes (tailwind v4)
const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm':
            return 'w-full max-w-lg'
        case 'lg':
            return 'w-full max-w-3xl'
        case 'full':
            return 'inset-0 h-full w-full rounded-none'
        case 'md':
        default:
            return 'w-full max-w-2xl'
    }
})

/* --- open / close handling --- */
function close() {
    emit('update:modelValue', false)
    emit('close')
}

function onBackdropClick() {
    if (props.closeOnBackdrop) close()
}

function onEscKey() {
    if (props.closeOnEsc) close()
}

/* --- Keyboard / focus trap --- */
function focusableElements(container) {
    if (!container) return []
    return Array.from(
        container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    ).filter((el) => el.offsetParent !== null) // visible only
}

function handleTabKey(e) {
    // custom tab handling is enabled via @keydown.tab.prevent
    const focusables = focusableElements(panel.value)
    if (!focusables.length) {
        e.preventDefault()
        return
    }
    const current = document.activeElement
    const idx = focusables.indexOf(current)
    if (e.shiftKey) {
        // shift+tab
        const prev = idx > 0 ? focusables[idx - 1] : focusables[focusables.length - 1]
        prev.focus()
    } else {
        // tab
        const next = idx === -1 || idx === focusables.length - 1 ? focusables[0] : focusables[idx + 1]
        next.focus()
    }
}

/* keep focus inside modal and restore focus to previously focused element when closed */
watch(
    () => props.modelValue,
    async (open) => {
        if (open) {
            lastFocused.value = document.activeElement
            await nextTick()
            // focus the first focusable element or the panel itself
            const list = focusableElements(panel.value)
            if (list.length) list[0].focus()
            else panel.value?.focus()
            // install global keydown for Esc (in case focusing elements stops panel from receiving)
            if (props.closeOnEsc) document.addEventListener('keydown', globalEscHandler)
            // prevent body scroll
            document.body.style.overflow = 'hidden'
        } else {
            // cleanup
            document.removeEventListener('keydown', globalEscHandler)
            document.body.style.overflow = ''
            if (lastFocused.value && lastFocused.value.focus) lastFocused.value.focus()
        }
    },
    { immediate: false }
)

function globalEscHandler(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        onEscKey()
    }
}

/* cleanup on unmount */
onBeforeUnmount(() => {
    document.removeEventListener('keydown', globalEscHandler)
    document.body.style.overflow = ''
})
</script>

<style>
/* Tailwind handles most of the look — these transitions keep things smooth */
.modal-fade-enter-from {
    opacity: 0;
    transform: translateY(6px) scale(.995);
}

.modal-fade-enter-active {
    transition: opacity .18s ease, transform .18s ease;
}

.modal-fade-enter-to {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.modal-fade-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.modal-fade-leave-active {
    transition: opacity .16s ease, transform .16s ease;
}

.modal-fade-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(.995);
}
</style>
