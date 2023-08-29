import { defineStore } from 'pinia'

export const useClientStore = defineStore('client', {
  state: () => ({
    port: 0
  }),
  getters: {
    getCounter: (state): number => state.port
  },
  actions: {
    counterIncrease(amount: number) {
      this.port = amount
    }
  }
})
