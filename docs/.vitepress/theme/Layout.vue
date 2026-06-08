<template>
  <div class="custom-layout">
    <DirectionalCursor />
    <DefaultTheme.Layout>
      <template #nav-bar-title-before>
        <span class="nav-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="url(#grad)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f4c36f" />
                <stop offset="100%" stop-color="#86c5c0" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      </template>
    </DefaultTheme.Layout>
  </div>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import DirectionalCursor from './components/DirectionalCursor.vue'
</script>

<style scoped>
.custom-layout {
  position: relative;
  min-height: 100vh;
}

.nav-logo {
  display: flex;
  align-items: center;
  margin-right: 4px;
}
</style>
