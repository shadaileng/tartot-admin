import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'tarot-admin-theme'
type Theme = 'light' | 'dark'

const theme = ref<Theme>(
  (localStorage.getItem(STORAGE_KEY) as Theme) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
)

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

applyTheme(theme.value)

watchEffect(() => {
  applyTheme(theme.value)
  localStorage.setItem(STORAGE_KEY, theme.value)
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
}
