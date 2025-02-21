<script setup lang="ts">
  import { ref, computed, watch, defineEmits } from 'vue';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import Select from 'primevue/select';
  import CustomSwitch from '@/components/common/buttons/CustomSwitch.vue';
  import { ChevronDown, ChevronUp } from 'lucide-vue-next';
  import { getCreatorInfo } from '@/api/tiktokApi';
  import editorDataStore from '@/utils/editorDataStore';

  const props = defineProps<{
    currentMediaType: 'image' | 'video' | null;
  }>();

  const emit = defineEmits<{
    (
      e: 'update:settings',
      settings: {
        viewerSetting: string;
        allowComments: boolean;
        allowDuet: boolean;
        allowStitch: boolean;
        commercialContent: boolean;
        brandOrganic: boolean;
        brandedContent: boolean;
      }
    ): void;
  }>();

  const tiktokOptionsExpanded = ref(false);
  const tiktokViewerSetting = ref<any>('');

  watch(
    () => tiktokOptionsExpanded.value,
    async () => {
      await getCreatorInfo(
        editorDataStore.selectedPost.value?.platforms?.[0]
          .split('-')
          .slice(1)
          .join('-')
      );
      console.log(editorDataStore.tiktokSettings.value);
    }
  );

  // Mapping for values to labels
  const valueToLabelMap: Record<string, string> = {
    FOLLOWER_OF_CREATOR: 'Followers',
    PUBLIC_TO_EVERYONE: 'Public to everyone',
    MUTUAL_FOLLOW_FRIENDS: 'Friends',
    SELF_ONLY: 'Only me',
  };

  const tiktokViewerOptions = computed(() => {
    const privacyOptions =
      connectionsDataStore.tiktokAccount.value?.creatorInfo
        .privacy_level_options;

    const isBrandedContent = tiktokBrandedContent.value;

    const options = [
      privacyOptions?.includes('FOLLOWER_OF_CREATOR') && {
        label: valueToLabelMap['FOLLOWER_OF_CREATOR'],
        val: 'FOLLOWER_OF_CREATOR',
      },
      privacyOptions?.includes('PUBLIC_TO_EVERYONE') && {
        label: valueToLabelMap['PUBLIC_TO_EVERYONE'],
        val: 'PUBLIC_TO_EVERYONE',
      },
      privacyOptions?.includes('MUTUAL_FOLLOW_FRIENDS') && {
        label: valueToLabelMap['MUTUAL_FOLLOW_FRIENDS'],
        val: 'MUTUAL_FOLLOW_FRIENDS',
      },
      privacyOptions?.includes('SELF_ONLY') && {
        label: isBrandedContent
          ? 'Only me (Branded content visibility cannot be set to private)'
          : valueToLabelMap['SELF_ONLY'],
        val: 'SELF_ONLY',
      },
    ];

    return options.filter(Boolean);
  });

  const isOptionDisabled = (option: any) => {
    return option.value === 'SELF_ONLY' && tiktokBrandedContent.value;
  };

  const isCommentsDisabled = computed(() => {
    return (
      connectionsDataStore.tiktokAccount.value?.creatorInfo.comment_disabled ??
      false
    );
  });

  const isDuetDisabled = computed(() => {
    return (
      connectionsDataStore.tiktokAccount.value?.creatorInfo.duet_disabled ??
      false
    );
  });

  const isStitchDisabled = computed(() => {
    return (
      connectionsDataStore.tiktokAccount.value?.creatorInfo.stitch_disabled ??
      false
    );
  });

  const tiktokAllowComments = ref(false);
  const tiktokAllowDuet = ref(false);
  const tiktokAllowStitch = ref(false);
  const tiktokCommercialContent = ref(false);
  const tiktokBrandOrganic = ref(false);
  const tiktokBrandedContent = ref(false);

  watch(
    [
      tiktokViewerSetting,
      tiktokAllowComments,
      tiktokAllowDuet,
      tiktokAllowStitch,
      tiktokCommercialContent,
      tiktokBrandOrganic,
      tiktokBrandedContent,
    ],
    () => {
      emit('update:settings', {
        viewerSetting: tiktokViewerSetting.value,
        allowComments: tiktokAllowComments.value,
        allowDuet: tiktokAllowDuet.value,
        allowStitch: tiktokAllowStitch.value,
        commercialContent: tiktokCommercialContent.value,
        brandOrganic: tiktokBrandOrganic.value,
        brandedContent: tiktokBrandedContent.value,
      });
    },
    { immediate: true } // Emit immediately during initialization
  );

  watch(tiktokCommercialContent, (newValue) => {
    if (newValue === false) {
      tiktokBrandOrganic.value = false;
      tiktokBrandedContent.value = false;
    }
  });

  const tiktokContentLabel = computed(() => {
    if (!tiktokCommercialContent.value) return '';
    if (tiktokBrandedContent.value)
      return 'Your photo/video will be labeled as "Paid partnership"';
    if (tiktokBrandOrganic.value)
      return 'Your photo/video will be labeled as "Promotional content"';
    return '';
  });

  // Populate initial settings for Edit
  if (editorDataStore.tiktokSettings.value) {
    const {
      viewerSetting,
      allowComments,
      allowDuet,
      allowStitch,
      commercialContent,
      brandOrganic,
      brandedContent,
    } = editorDataStore.tiktokSettings.value;

    console.log(editorDataStore.tiktokSettings.value);

    // tiktokViewerSetting.value = viewerSetting?.value || '';
    tiktokViewerSetting.value = viewerSetting?.value
      ? {
          value: viewerSetting.value,
          label: valueToLabelMap[viewerSetting.value],
        }
      : '';
    tiktokAllowComments.value = allowComments || false;
    tiktokAllowDuet.value = allowDuet || false;
    tiktokAllowStitch.value = allowStitch || false;
    tiktokCommercialContent.value = commercialContent || false;
    tiktokBrandOrganic.value = brandOrganic || false;
    tiktokBrandedContent.value = brandedContent || false;
  }
</script>

<template>
  <div
    class="rounded-[8px] border bg-gray-50 dark:border-[#313131] dark:bg-[#5a5a5a]"
  >
    <div
      class="cursor-pointer hover:bg-gray-200 dark:hover:bg-[#d9d9d9]/10"
      :class="tiktokOptionsExpanded ? 'rounded-t-[8px]' : 'rounded-[8px]'"
      @click="tiktokOptionsExpanded = !tiktokOptionsExpanded"
    >
      <div class="flex items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <label class="cursor-pointer text-sm font-medium text-gray-700">
            TikTok Presets
          </label>
        </div>
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <component
            :is="tiktokOptionsExpanded ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-600"
          />
        </div>
      </div>
    </div>

    <div
      v-if="tiktokOptionsExpanded"
      :class="[
        'overflow-hidden px-4 transition-all',
        tiktokOptionsExpanded ? 'py-3 opacity-100' : 'max-h-0 opacity-0',
      ]"
    >
      {{ editorDataStore.tiktokSettings.value }}
      <div class="space-y-4">
        <div>
          <div class="relative">
            <Select
              v-model="tiktokViewerSetting"
              :options="tiktokViewerOptions"
              optionLabel="label"
              class="w-full"
              :placeholder="
                tiktokViewerSetting
                  ? valueToLabelMap[tiktokViewerSetting.value]
                  : 'Who can view your post?'
              "
              :optionDisabled="isOptionDisabled"
            ></Select>
          </div>
        </div>

        <p class="text-md pt-3 font-bold text-gray-600">Allow users to</p>
        <div class="flex items-center justify-start gap-7">
          <div class="flex items-center justify-between">
            <CustomSwitch
              v-model="tiktokAllowComments"
              label="Comment"
              :disabled="isCommentsDisabled"
            />
          </div>

          <div
            v-if="props.currentMediaType !== 'image'"
            class="flex items-center justify-between"
          >
            <CustomSwitch
              v-model="tiktokAllowDuet"
              label="Duet"
              :disabled="isDuetDisabled"
            />
          </div>

          <div
            v-if="props.currentMediaType !== 'image'"
            class="flex items-center justify-between"
          >
            <CustomSwitch
              v-model="tiktokAllowStitch"
              label="Stitch"
              :disabled="isStitchDisabled"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-start gap-3 pt-3">
            <p class="text-md flex font-bold text-gray-600">
              Disclose video content
            </p>
            <CustomSwitch v-model="tiktokCommercialContent" />
          </div>
          <p class="pt-1 text-sm text-gray-600">
            Turn on to disclose that this video promotes goods or services in
            exchange for something of value. Your video could promote yourself,
            a third party, or both.
          </p>

          <div v-if="tiktokCommercialContent" class="mt-3 space-y-3">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tiktokBrandOrganic"
                  v-model="tiktokBrandOrganic"
                  class="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
                />
                <label
                  for="tiktokBrandOrganic"
                  class="text-md flex font-bold text-gray-600"
                  >Your Brand</label
                >
              </div>
              <p class="text-sm text-gray-600">
                You are promoting yourself or your own business
              </p>
            </div>

            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tiktokBrandedContent"
                  v-model="tiktokBrandedContent"
                  :disabled="tiktokViewerSetting.value === 'SELF_ONLY'"
                  :class="[
                    'h-4 w-4 rounded border-gray-300 focus:ring-blue-500',
                    tiktokViewerSetting.value === 'SELF_ONLY'
                      ? 'cursor-not-allowed bg-gray-100 text-gray-400 opacity-50'
                      : 'bg-white text-blue-600',
                  ]"
                />
                <label
                  for="tiktokBrandedContent"
                  :class="[
                    'text-md group relative font-bold',
                    tiktokViewerSetting.value === 'SELF_ONLY'
                      ? 'cursor-not-allowed text-gray-400'
                      : 'text-gray-600',
                  ]"
                >
                  Branded Content

                  <div
                    v-if="tiktokViewerSetting.value === 'SELF_ONLY'"
                    class="absolute bottom-full left-0 mb-2 hidden w-64 rounded-lg bg-gray-700 p-2 text-sm text-white group-hover:block"
                  >
                    Branded content visibility cannot be set to private
                  </div>
                </label>
              </div>
              <p
                class="text-sm"
                :class="
                  tiktokViewerSetting.value === 'SELF_ONLY'
                    ? 'text-gray-400'
                    : 'text-gray-600'
                "
              >
                You are promoting another brand or a third party
              </p>
            </div>

            <div
              v-if="tiktokContentLabel"
              class="mt-2 rounded-md bg-blue-50 p-3 dark:bg-[#1d9bf0]"
            >
              <p class="text-sm text-blue-600">{{ tiktokContentLabel }}</p>
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <p for="tiktokMusicConsent" class="text-sm text-gray-600">
              By posting, you agree to TikTok's
              <template v-if="tiktokBrandedContent">
                <a
                  class="text-[blue] underline"
                  href="https://www.tiktok.com/legal/page/global/bc-policy/en"
                >
                  Branded Content Policy
                </a>
                and
              </template>
              <a
                class="text-[blue] underline"
                href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
              >
                Music Usage Confirmation
              </a>
              .
            </p>
          </div>
          <p class="mt-[10px] text-sm text-gray-600">
            It may take a few minutes after the specified time for the content
            to process and be visible on your profile
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
