<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import TimePickerInput from '@/components/common/input/TimePickerInput.vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import { Brain, Pencil } from 'lucide-vue-next';
  import DatePicker from 'primevue/datepicker';
  import Dropdown from 'primevue/dropdown';
  import PlatformButton from '@/components/common/buttons/PlatformButton.vue';
  import scheduledPostsStore from '@/utils/scheduledPostsStore';

  import { createPostBundle, updatePostBundle } from '@/api/scheduledPostApi';

  const isLoading = ref(true);

  const toast = useToast();

  const mode = ref<'select' | 'manual' | 'assisted'>('select');
  const campaignLength = ref(7); // days
  const selectedDays = ref<number[]>([]); // Array to store selected day indices (0-based)
  const customFrequency = ref(1); // For "every X days" option
  const postsPerDay = ref(1);

  const postStatusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
  ];

  // Initialize first post time at 8am
  const initialTime = new Date();
  initialTime.setHours(8, 0, 0, 0);
  const postTimes = ref<Date[]>([initialTime]);

  const selectedPlatforms = ref<string[]>([]);
  const step = ref(1);
  const totalSteps = 5;
  const posts = ref<
    Array<{
      id?: string;
      content: string;
      scheduledTime: Date;
      selectedPlatforms: string[];
      selectedMedia: File[];
      mediaPreviewUrls: string[];
      status: string;
      removedMediaUrls: string[];
      initialMedia?: any[];
      isEditing: boolean;
    }>
  >([]);

  // Array to store platform selections for each post
  const postPlatforms = ref<string[][]>([]);

  // Function to generate post dates based on selected days
  function generatePostDates() {
    const result: any = [];
    selectedDays.value.forEach((dayIndex) => {
      postTimes.value.forEach((time) => {
        const date = new Date();
        date.setDate(date.getDate() + dayIndex);
        date.setHours(time.getHours(), time.getMinutes(), 0, 0);
        result.push(date);
      });
    });
    return result;
  }

  // Watch for changes in selectedDays and postTimes to update posts
  watch([selectedDays, postTimes], () => {
    if (step.value === 5) {
      const postDates = generatePostDates();
      posts.value = postDates.map((date: any) => ({
        content: '',
        scheduledTime: date,
        selectedPlatforms: [...selectedPlatforms.value],
        selectedMedia: [],
        mediaPreviewUrls: [],
        status: 'draft',
        removedMediaUrls: [],
        isEditing: true,
      }));
      postPlatforms.value = postDates.map(() => [...selectedPlatforms.value]);
    }
  });

  // Update nextStep function to initialize posts and postPlatforms
  function nextStep() {
    if (step.value < totalSteps) {
      step.value++;
      if (step.value === 5) {
        const postDates = generatePostDates();
        posts.value = postDates.map((date: any) => ({
          content: '',
          scheduledTime: date,
          selectedPlatforms: [...selectedPlatforms.value],
          selectedMedia: [],
          mediaPreviewUrls: [],
          status: 'draft',
          removedMediaUrls: [],
          isEditing: true,
        }));
        postPlatforms.value = postDates.map(() => [...selectedPlatforms.value]);
      }
    }
  }

  // Function to toggle platform selection in step 4
  function togglePlatform(platform: string) {
    const index = selectedPlatforms.value.indexOf(platform);
    if (index === -1) {
      selectedPlatforms.value.push(platform);
    } else {
      selectedPlatforms.value.splice(index, 1);
    }
  }

  // Function to toggle platform for a specific post in step 5
  function togglePostPlatform(postIndex: number, platform: string) {
    const platforms = [...postPlatforms.value[postIndex]];
    const index = platforms.indexOf(platform);
    if (index === -1) {
      platforms.push(platform);
    } else {
      platforms.splice(index, 1);
    }
    postPlatforms.value[postIndex] = platforms;
    // Update the corresponding post's selectedPlatforms
    posts.value[postIndex].selectedPlatforms = [...platforms];
  }

  // function startManualMode() {
  //   mode.value = 'manual';
  // }

  function startAssistedMode() {
    mode.value = 'assisted';
  }

  function previousStep() {
    if (step.value > 1) {
      step.value--;
    }
  }

  function resetToSelection() {
    mode.value = 'select';
    step.value = 1;
    campaignLength.value = 7;
    selectedDays.value = [];
    customFrequency.value = 1;
    selectedPlatforms.value = [];
  }

  const totalPosts = computed(() => {
    return selectedDays.value.length * postsPerDay.value;
  });

  watch(
    campaignLength,
    (newLength) => {
      selectedDays.value = Array.from({ length: newLength }, (_, i) => i);
    },
    { immediate: true }
  );

  function toggleDay(index: number) {
    const dayIndex = selectedDays.value.indexOf(index);
    if (dayIndex === -1) {
      selectedDays.value.push(index);
    } else {
      selectedDays.value.splice(dayIndex, 1);
    }
  }

  function selectEveryNthDay(n: number) {
    selectedDays.value = Array.from({ length: campaignLength.value })
      .map((_, i) => i)
      .filter((i) => i % n === 0);
  }

  function selectAllDays() {
    selectedDays.value = Array.from(
      { length: campaignLength.value },
      (_, i) => i
    );
  }

  // Watch postsPerDay to update postTimes array
  watch(
    postsPerDay,
    (newValue) => {
      // Ensure newValue is within limits
      if (newValue < 1) {
        postsPerDay.value = 1;
        return;
      }
      if (newValue > 5) {
        postsPerDay.value = 5;
        return;
      }

      // Update postTimes array
      const times = [];
      for (let i = 0; i < newValue; i++) {
        const time = new Date();
        time.setHours(8 + i, 0, 0, 0); // Start at 8am, increment by 1 hour
        times.push(new Date(time)); // Create a new Date instance
      }
      postTimes.value = times;

      // Initialize postPlatforms for each post with the selected platforms
      postPlatforms.value = Array(newValue).fill([...selectedPlatforms.value]);
    },
    { immediate: true }
  ); // Add immediate: true to initialize on component mount

  // Handle media functions for specific posts
  function handlePhotoUpload(postIndex: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (event) => handleMediaSelect(event, postIndex);
    input.click();
  }

  function handleVideoUpload() {
    toast.add({
      severity: 'info',
      summary: 'Coming Soon',
      detail: 'Video upload will be available soon!',
      life: 3000,
    });
  }

  function handleEmojiSelect() {
    toast.add({
      severity: 'info',
      summary: 'Coming Soon',
      detail: 'Emoji selector will be available soon!',
      life: 3000,
    });
  }

  function removeMedia(postIndex: number, mediaIndex: number) {
    const post = posts.value[postIndex];
    const removedUrl = post.mediaPreviewUrls[mediaIndex];

    // Add removed media to the list if it's from the server
    if (post.initialMedia?.some((media) => media.url === removedUrl)) {
      post.removedMediaUrls.push(removedUrl);
    }

    URL.revokeObjectURL(post.mediaPreviewUrls[mediaIndex]);
    post.mediaPreviewUrls.splice(mediaIndex, 1);
    post.selectedMedia.splice(mediaIndex, 1);
  }

  // Handle media selection for a specific post
  function handleMediaSelect(event: Event, postIndex: number) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      // Twitter allows up to 4 images total
      const totalAllowedMedia = 4;
      const currentMediaCount = posts.value[postIndex].mediaPreviewUrls.length;
      const remainingSlots = totalAllowedMedia - currentMediaCount;

      if (remainingSlots <= 0) {
        toast.add({
          severity: 'warn',
          summary: 'Maximum media limit',
          detail: 'You can only add up to 4 media files per post',
          life: 3000,
        });
        return;
      }

      const newFiles = files.slice(0, remainingSlots);
      posts.value[postIndex].selectedMedia.push(...newFiles);

      // Create preview URLs
      newFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        posts.value[postIndex].mediaPreviewUrls.push(url);
      });
    }
  }

  // Add new functions for handling individual post actions
  async function handleSavePost(postIndex: number) {
    if (
      isOverCharacterLimit(
        posts.value[postIndex].content,
        posts.value[postIndex].selectedPlatforms
      )
    ) {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Content exceeds character limit for selected platforms',
        life: 3000,
      });
      return;
    }
    const post = posts.value[postIndex];

    // Validate scheduled date-time
    if (!post.scheduledTime) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a scheduled date and time for your post',
        life: 3000,
      });
      return;
    }

    // Validate platform selection
    if (post.selectedPlatforms.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select at least one platform',
        life: 3000,
      });
      return;
    }

    // Validate content or media
    if (!post.content.trim() && post.mediaPreviewUrls.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter some content or add media for your post',
        life: 3000,
      });
      return;
    }

    const formData = new FormData();
    formData.append('content', post.content);
    formData.append('scheduledTime', post.scheduledTime.toISOString());
    formData.append('platforms', JSON.stringify(post.selectedPlatforms));
    formData.append('status', post.status);
    formData.append('sameContent', 'true');

    // Handle media files
    if (post.selectedMedia && post.selectedMedia.length > 0) {
      post.selectedMedia.forEach((file: File) => {
        formData.append('media', file);
      });
    }

    try {
      let response;
      if (post.id) {
        // If post has an ID, it's an update
        // Add which initial media URLs we're keeping
        const keptMediaUrls = post.mediaPreviewUrls.filter((url) =>
          post.initialMedia?.some((media) => media.url === url)
        );
        formData.append('keptMediaUrls', JSON.stringify(keptMediaUrls));
        formData.append(
          'removedMediaUrls',
          JSON.stringify(post.removedMediaUrls)
        );

        response = await updatePostBundle(post.id, formData);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Post updated successfully!',
          life: 3000,
        });
      } else {
        // If no ID, it's a new post
        response = await createPostBundle(formData);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail:
            post.status === 'draft'
              ? 'Post saved as draft!'
              : 'Post scheduled successfully!',
          life: 3000,
        });
      }

      // Update the post with the returned data
      posts.value[postIndex] = {
        ...post,
        id: response.postGroup._id,
        mediaPreviewUrls: response.postGroup.mediaFiles.map((m: any) => m.url),
        selectedMedia: [],
        initialMedia: response.postGroup.mediaFiles,
        isEditing: false,
      };

      // Revoke any blob URLs
      post.mediaPreviewUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      // Refresh the posts store
      await scheduledPostsStore.getAllPostGroups();
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Failed to save post',
        life: 3000,
      });
    }
  }

  function toggleEditMode(postIndex: number) {
    posts.value[postIndex].isEditing = !posts.value[postIndex].isEditing;
  }

  onMounted(async () => {
    isLoading.value = false;
    await connectionsDataStore.getAllAccounts();
  });

  // Add computed properties for button states
  // const canSaveAsDraft = computed(() => {
  //   return (index: number) => {
  //     const post = posts.value[index];
  //     return (
  //       post.selectedPlatforms.length > 0 ||
  //       post.content.trim().length > 0 ||
  //       post.selectedMedia.length > 0
  //     );
  //   };
  // });

  // const canSchedule = computed(() => {
  //   return (index: number) => {
  //     const post = posts.value[index];
  //     const now = new Date();
  //     const isValidScheduledTime =
  //       post.scheduledTime && new Date(post.scheduledTime) > now;

  //     return (
  //       post.selectedPlatforms.length > 0 &&
  //       isValidScheduledTime &&
  //       (post.content.trim().length > 0 || post.selectedMedia.length > 0)
  //     );
  //   };
  // });

  const PLATFORM_LIMITS = {
    twitter: 280,
    threads: 500,
    bluesky: 300,
  };

  const getMaxCharacterLimit = (platforms: string[]) => {
    if (platforms.length === 0) return Infinity;
    return Math.min(
      ...platforms.map(
        (platform) =>
          PLATFORM_LIMITS[
            platform.toLowerCase() as keyof typeof PLATFORM_LIMITS
          ]
      )
    );
  };

  const isOverCharacterLimit = (content: string, platforms: string[]) => {
    return content.length > getMaxCharacterLimit(platforms);
  };
</script>

<template>
  <DashboardNavigation />
  <transition name="fade" mode="out-in">
    <main v-if="!isLoading" class="min-h-screen bg-[white] p-6">
      <div class="mx-auto max-w-2xl">
        <!-- Mode Selection -->
        <div v-if="mode === 'select'" class="space-y-6">
          <h1 class="text-center text-2xl font-bold text-gray-900">
            How would you like to create your posts?
          </h1>
          <div class="grid grid-cols-2 gap-4">
            <!-- <button
            @click="startManualMode"
            class="flex flex-col items-center gap-4 rounded-lg border border-gray-200 p-6 text-center shadow-sm transition hover:border-blue-500 hover:shadow-md"
          >
            <PenLine class="h-12 w-12 text-blue-500" />
            <div>
              <h3 class="text-lg font-semibold">Manual Creation</h3>
              <p class="text-sm text-gray-600">
                Create and customize each post individually
              </p>
            </div>
          </button> -->

            <button
              @click="startAssistedMode"
              class="flex flex-col items-center gap-4 rounded-lg border border-gray-200 p-6 text-center shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <Brain class="h-12 w-12 text-blue-500" />
              <div>
                <h3 class="text-lg font-semibold">Assisted Creation</h3>
                <p class="text-sm text-gray-600">
                  Let us help you plan and create multiple posts
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- Manual Mode -->
        <div v-else-if="mode === 'manual'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">
              Create Posts Manually
            </h1>
            <button
              @click="resetToSelection"
              class="text-sm text-blue-500 hover:text-blue-600"
            >
              Change Mode
            </button>
          </div>
        </div>

        <!-- Assisted Mode -->
        <div v-else-if="mode === 'assisted'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">
              Assisted Post Creation
            </h1>
            <button
              @click="resetToSelection"
              class="text-sm text-blue-500 hover:text-blue-600"
            >
              Change Mode
            </button>
          </div>

          <!-- Progress Bar -->
          <div class="mb-8">
            <div class="mb-2 flex justify-between text-sm text-gray-600">
              <span>Step {{ step }} of {{ totalSteps }}</span>
              <span>{{ Math.round((step / totalSteps) * 100) }}%</span>
            </div>
            <div class="h-2 w-full rounded-full bg-gray-200">
              <div
                class="h-full rounded-full bg-blue-500 transition-all duration-300"
                :style="{ width: `${(step / totalSteps) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Step 1: Campaign Length -->
          <div v-if="step === 1" class="space-y-4">
            <h2 class="text-xl font-semibold">
              How long should the campaign run?
            </h2>
            <div class="flex items-center gap-4">
              <input
                v-model="campaignLength"
                type="number"
                min="1"
                max="30"
                class="w-20 rounded-lg border border-gray-300 bg-[white] p-2 text-center"
                @input="
                  (e) => {
                    const target = e.target as HTMLInputElement;
                    const val = parseInt(target.value);
                    if (val < 1) campaignLength = 1;
                    if (val > 30) campaignLength = 30;
                  }
                "
              />
              <span class="text-gray-600">days</span>
            </div>
            <p class="text-sm text-gray-500">Choose between 1 and 30 days</p>
          </div>

          <!-- Step 2: Post Frequency -->
          <div v-if="step === 2" class="space-y-6">
            <h2 class="text-xl font-semibold">Select posting days</h2>

            <!-- Day tiles -->
            <div
              class="grid gap-1.5"
              :style="{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }"
            >
              <button
                v-for="i in campaignLength"
                :key="i - 1"
                @click="toggleDay(i - 1)"
                class="flex aspect-square items-center justify-center rounded-md border text-[10px] transition-colors"
                :class="[
                  selectedDays.includes(i - 1)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-200 hover:border-blue-200',
                ]"
                :title="`Day ${i}`"
              >
                {{ i }}
              </button>
            </div>

            <!-- Frequency options -->
            <div class="space-y-4">
              <h3 class="font-medium">Quick selection:</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  @click="selectAllDays"
                  class="rounded-lg border border-gray-200 px-4 py-2 hover:border-blue-500 hover:bg-blue-50"
                >
                  Every day
                </button>
                <button
                  v-for="n in [2, 3]"
                  :key="n"
                  @click="selectEveryNthDay(n)"
                  class="rounded-lg border border-gray-200 px-4 py-2 hover:border-blue-500 hover:bg-blue-50"
                >
                  Every {{ n }} days
                </button>
                <!-- <div class="flex items-center gap-2">
                <span>Every</span>
                <input
                  v-model="customFrequency"
                  type="number"
                  min="1"
                  :max="campaignLength"
                  class="w-16 rounded-lg border border-gray-300 bg-[white] p-2 text-center"
                  @change="selectEveryNthDay(customFrequency)"
                />
                <span>days</span>
              </div> -->
              </div>
            </div>

            <p class="text-sm text-gray-600">
              Selected {{ selectedDays.length }} days out of
              {{ campaignLength }}
            </p>
          </div>

          <!-- Step 3: Posts per Day -->
          <div v-if="step === 3" class="space-y-4">
            <h2 class="text-xl font-semibold">How many posts per day?</h2>
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <input
                  v-model="postsPerDay"
                  type="number"
                  min="1"
                  max="10"
                  class="w-20 rounded-lg border border-gray-300 bg-[white] p-2 text-center"
                />
                <span class="text-gray-600">posts per day</span>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-medium">Select posting times:</h3>
                <div class="grid grid-cols-2 gap-6">
                  <div
                    v-for="(_, index) in postTimes"
                    :key="index"
                    class="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3"
                  >
                    <span class="min-w-[80px] text-sm text-gray-600"
                      >Post {{ index + 1 }}:</span
                    >
                    <TimePickerInput v-model="postTimes[index]" />
                  </div>
                </div>
              </div>
            </div>

            <p class="mt-4 text-sm text-gray-600">
              Total posts to be created: {{ totalPosts }}
            </p>
          </div>

          <!-- Step 4: Platforms -->
          <div v-if="step === 4" class="space-y-4">
            <h2 class="text-xl font-semibold">Select platforms to post to:</h2>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="account in connectionsDataStore.connectedAccounts.value"
                :key="account.id"
                type="button"
                class="relative flex h-[50px] w-[50px] items-center gap-2 rounded-full text-sm"
                :class="[
                  selectedPlatforms.includes(account.platform)
                    ? 'bg-[white] text-white outline outline-[1px] outline-[black]'
                    : 'bg-white text-black grayscale',
                ]"
                @click="togglePlatform(account.platform)"
              >
                <img
                  :src="account.profileImageUrl"
                  class="rounded-full p-[3px]"
                  :alt="account.username"
                />
                <!-- <img
                :src="account.platformIcon"
                class="absolute bottom-0 right-0 h-5 w-5 rounded-full border border-black bg-black p-[4px]"
                :alt="account.platform"
              /> -->
              </button>
            </div>
          </div>

          <!-- Step 5: Post Grid -->
          <div v-if="step === 5" class="space-y-4">
            <h2 class="mb-4 text-xl font-semibold">Create Your Posts</h2>
            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="(post, index) in posts"
                :key="index"
                class="scheduling-form rounded-lg border p-4 shadow-sm"
                :class="{
                  locked: !post.isEditing,
                  'border-gray-200 bg-white': post.isEditing,
                  'border-yellow-200 bg-yellow-50':
                    !post.isEditing && post.status === 'scheduled',
                  'border-gray-200 bg-gray-50':
                    !post.isEditing && post.status === 'draft',
                }"
              >
                <div class="mb-4">
                  <h3 class="mb-2 text-lg font-medium">Post {{ index + 1 }}</h3>

                  <!-- Platform Selection -->
                  <div class="mb-4">
                    <div class="flex flex-wrap gap-2">
                      <PlatformButton
                        v-for="account in connectionsDataStore.connectedAccounts
                          .value"
                        :key="account.id"
                        :account="account"
                        :is-selected="
                          postPlatforms[index].includes(account.platform)
                        "
                        :onClick="
                          () =>
                            post.isEditing &&
                            togglePostPlatform(index, account.platform)
                        "
                        :disabled="!post.isEditing"
                      />
                    </div>
                  </div>

                  <!-- Content and Media -->
                  <div class="mb-4">
                    <div class="relative">
                      <textarea
                        v-model="post.content"
                        rows="4"
                        :maxlength="
                          getMaxCharacterLimit(post.selectedPlatforms)
                        "
                        :class="{
                          'border-red-500': isOverCharacterLimit(
                            post.content,
                            post.selectedPlatforms
                          ),
                          'opacity-50': !post.isEditing,
                        }"
                        :disabled="!post.isEditing"
                        class="w-full resize-none rounded-lg border border-gray-200 bg-white p-2 text-black"
                        placeholder="Write your post content..."
                      ></textarea>
                      <div class="mt-2 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <button
                            @click="() => handlePhotoUpload(index)"
                            :disabled="!post.isEditing"
                            class="flex items-center gap-1 rounded-md border px-2 py-1 text-sm text-gray-700 transition"
                            :class="
                              post.isEditing ? 'hover:bg-gray-50' : 'opacity-50'
                            "
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Photo
                          </button>
                          <button
                            @click="() => handleVideoUpload()"
                            :disabled="!post.isEditing"
                            class="flex items-center gap-1 rounded-md border px-2 py-1 text-sm text-gray-700 transition"
                            :class="
                              post.isEditing ? 'hover:bg-gray-50' : 'opacity-50'
                            "
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Video
                          </button>
                          <button
                            @click="() => handleEmojiSelect()"
                            :disabled="!post.isEditing"
                            class="flex items-center gap-1 rounded-md border px-2 py-1 text-sm text-gray-700 transition"
                            :class="
                              post.isEditing ? 'hover:bg-gray-50' : 'opacity-50'
                            "
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Emoji
                          </button>
                        </div>
                        <div
                          class="text-sm"
                          :class="{
                            'text-red-500': isOverCharacterLimit(
                              post.content,
                              post.selectedPlatforms
                            ),
                          }"
                        >
                          {{ post.content.length }}/{{
                            getMaxCharacterLimit(post.selectedPlatforms) ===
                            Infinity
                              ? '∞'
                              : getMaxCharacterLimit(post.selectedPlatforms)
                          }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Date and Time Picker -->
                  <div class="mb-4">
                    <DatePicker
                      v-model="post.scheduledTime"
                      :showTime="true"
                      :showIcon="true"
                      :disabled="!post.isEditing"
                      dateFormat="dd/mm/yy"
                      class="w-full"
                    />
                  </div>

                  <!-- Media Preview -->
                  <div v-if="post.mediaPreviewUrls.length > 0" class="mb-4">
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="(url, mediaIndex) in post.mediaPreviewUrls"
                        :key="mediaIndex"
                        class="relative"
                      >
                        <img
                          :src="url"
                          class="h-20 w-20 rounded-lg object-cover"
                          alt="Media preview"
                        />
                        <button
                          v-if="post.isEditing"
                          @click="() => removeMedia(index, mediaIndex)"
                          class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Status and Action Buttons -->
                  <div class="mt-4 flex items-center gap-4">
                    <Dropdown
                      v-model="post.status"
                      :options="postStatusOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Status"
                      :disabled="!post.isEditing"
                      class="w-40"
                    />
                    <button
                      v-if="post.isEditing"
                      @click="handleSavePost(index)"
                      class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {{ post.id ? 'Update' : 'Save' }}
                    </button>
                    <button
                      v-else
                      @click="toggleEditMode(index)"
                      class="flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <Pencil class="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8 flex justify-between">
              <button
                @click="previousStep"
                class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
              >
                Previous
              </button>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div v-if="step < 5" class="flex justify-between pt-6">
            <button
              v-if="step > 1"
              @click="previousStep"
              class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              v-if="step < totalSteps"
              @click="nextStep"
              class="ml-auto rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  </transition>
</template>

<style scoped></style>

<style>
  .locked .p-select {
    background-color: transparent !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: none !important;
  }

  .locked .p-select-dropdown {
    opacity: 0 !important;
  }

  .locked .p-datepicker-input {
    background-color: transparent !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    border-top-right-radius: 6px !important;
    border-bottom-right-radius: 6px !important;
  }

  .locked .p-datepicker-dropdown {
    opacity: 0 !important;
  }
</style>
