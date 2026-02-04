import type { App } from "vue"
import { createPinia } from "pinia"
import { Toaster } from "vue-sonner"

export default (app: App) => {
  const pinia = createPinia()
  app.use(pinia)
}
