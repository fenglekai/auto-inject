<script setup lang="tsx"></script>

<template>
  <v-app>
    <v-layout full-height>
      <HeaderLayout />
      <AsideLayout />
      <v-main style="max-height: 100vh; overflow-y: scroll">
        <slot />
      </v-main>
    </v-layout>
  </v-app>
</template>
