<script setup lang="ts">
  import { X } from 'lucide-vue-next';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { connectInstagram } from '@/api/instagramApi';
  import { disconnectConnectedAccount } from '@/api/connectedAccountsApi';

  async function connect() {
    connectionsDataStore.isConnectingInstagram.value = true;
    const { authUrl } = await connectInstagram();
    window.location.href = authUrl;
  }

  async function disconnect(platformId: string) {
    await disconnectConnectedAccount(platformId);
    connectionsDataStore.instagramAccount.value =
      connectionsDataStore.instagramAccount.value.filter(
        (record: any) => record.platformId !== platformId
      );
  }
</script>

<template>
  <div class="w-full max-w-2xl">
    <h3 class="mb-6 text-[20px] text-gray-900">Instagram</h3>
    <h2 class="mb-6 text-2xl text-gray-900">
      Elevate your Instagram presence with effortless content planning and
      scheduling
    </h2>
    <div>
      <div>
        <p class="mb-4 leading-relaxed text-gray-900">
          Connect your Instagram Business account to schedule and manage your
          content seamlessly.
        </p>
        <ul class="list-disc space-y-2 pl-5 text-gray-900">
          <li>Schedule posts, stories, and reels</li>
          <li>Plan your feed layout with visual grid preview</li>
          <li>Track engagement metrics and audience growth</li>
        </ul>
      </div>
      <h2
        v-if="
          connectionsDataStore.instagramAccount.value &&
          connectionsDataStore.instagramAccount.value.length > 0
        "
        class="mt-[50px] text-2xl text-gray-900"
      >
        Connected Instagram Account
      </h2>

      <div v-if="connectionsDataStore.instagramAccount.value">
        <div
          v-for="connection in connectionsDataStore.instagramAccount.value"
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
      <h2 class="mb-6 text-2xl text-gray-900">Connect Instagram</h2>

      <div class="space-y-6">
        <div class="rounded-lg bg-pink-50 p-6 dark:bg-gray-800">
          <div class="items-start space-y-4">
            <p class="text-sm leading-relaxed text-gray-900">
              Connect your Instagram Business account to start managing your
              content.
            </p>
            <p class="text-sm leading-relaxed text-gray-900">
              Make sure you have a Facebook Business account linked to your
              Instagram account.
            </p>
          </div>
        </div>
        <div class="mt-8 flex justify-start space-x-4">
          <button
            type="button"
            :disabled="connectionsDataStore.isConnectingInstagram.value"
            @click="connect"
            class="rounded-lg bg-pink-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="connectionsDataStore.isConnectingInstagram.value"
              >Connecting...</span
            >
            <span v-else>Connect</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
