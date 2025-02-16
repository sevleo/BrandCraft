<script setup lang="ts">
  import { X } from 'lucide-vue-next';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { connectMastodon } from '@/api/mastodonApi';
  import { disconnectConnectedAccount } from '@/api/connectedAccountsApi';

  async function connect() {
    connectionsDataStore.isConnectingMastodon.value = true;
    const { authUrl } = await connectMastodon();
    window.location.href = authUrl;
  }

  async function disconnect(platformId: string) {
    await disconnectConnectedAccount(platformId);
    connectionsDataStore.mastodonAccount.value =
      connectionsDataStore.mastodonAccount.value.filter(
        (record: any) => record.platformId !== platformId
      );
  }
</script>

<template>
  <div class="w-full max-w-2xl">
    <h3 class="mb-6 text-[20px] text-gray-900">Mastodon</h3>
    <h2 class="mb-6 text-2xl text-gray-900">
      Expand your reach to the Fediverse with our Mastodon integration
    </h2>
    <div>
      <div>
        <p class="mb-4 leading-relaxed text-gray-900"></p>
        <ul class="list-disc space-y-2 pl-5 text-gray-900">
          <li>Schedule text posts and media content for optimal engagement</li>
          <li>Support for images, videos, and custom visibility settings</li>
          <li>
            Maintain your Mastodon presence alongside other social platforms
          </li>
        </ul>
      </div>

      <h2
        v-if="
          connectionsDataStore.mastodonAccount.value &&
          connectionsDataStore.mastodonAccount.value.length > 0
        "
        class="mt-[50px] text-2xl text-gray-900"
      >
        Connected Mastodon
      </h2>
      <div v-if="connectionsDataStore.mastodonAccount.value">
        <div
          v-for="connection in connectionsDataStore.mastodonAccount.value"
          class="mt-[10px] flex w-[250px] items-center justify-start gap-3 rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-medium transition-colors duration-200 dark:border-[#313131] dark:bg-[#121212]"
        >
          <div>
            <img
              :src="connection.profileImageUrl"
              :alt="connection.username"
              class="h-[30px] w-[30px] rounded-full object-cover"
            />
          </div>
          <div class="mr-auto flex h-full flex-col justify-between">
            <div class="text-xs text-gray-500">Account</div>
            <div class="text-sm font-bold text-gray-900">
              {{ connection.username }}
            </div>
          </div>
          <div
            @click="() => disconnect(connection.platformId)"
            class="cursor-pointer rounded-md p-[3px] transition-all duration-300 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
          >
            <X />
          </div>
        </div>
      </div>
    </div>
    <div class="mt-[50px]">
      <h2 class="mb-6 text-2xl text-gray-900">Connect Mastodon</h2>
      <div class="space-y-6">
        <div class="rounded-lg bg-blue-50 p-6 dark:bg-gray-800">
          <div class="items-start space-y-4">
            <p class="text-sm leading-relaxed text-gray-900">
              Currently, we only support the main Mastodon server
              (mastodon.social). We're working on expanding our Mastodon
              integration to support more instances.
            </p>
          </div>
        </div>
        <div class="mt-8 flex justify-start space-x-4">
          <button
            type="button"
            class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            @click="connect"
            :disabled="connectionsDataStore.isConnectingMastodon.value"
          >
            <span v-if="connectionsDataStore.isConnectingMastodon.value">
              Connecting...
            </span>
            <span v-else>Connect</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
