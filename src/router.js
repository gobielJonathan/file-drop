import { createWebHashHistory } from "vue-router";
import { createRouter } from "vue-router";

const routes = [
    {path: "/", component: () => import("./Home.vue")},
    {path: "/sender", component: () => import("./Sender.vue")},
    {path: "/receiver", component: () => import("./Receiver.vue")},
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes
})