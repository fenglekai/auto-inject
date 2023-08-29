<script setup lang="tsx"></script>

<template>
  <v-app>
    <v-layout>
      <AsideLayout />
      <v-main>
        <slot />
      </v-main>
    </v-layout>
  </v-app>
</template>
