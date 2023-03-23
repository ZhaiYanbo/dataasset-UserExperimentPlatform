<template>
  <TopNavbar />
  <div class="page-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import TopNavbar from '@/components/TopNavbar.vue'
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #666666;
  position: absolute;
  background-color: #f2f2f2;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1% 1.5%;
  cursor: default;
  font-family: 'Times New Roman';
}

.page-container {
  height: 89%;
}
</style>
