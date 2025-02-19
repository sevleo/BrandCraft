import { ref, computed, watch } from 'vue';
import { getPostGroups, getPostsStats } from '../api/postApi';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';

const postGroups = ref<any[]>([]);
const posts = computed(() =>
  postGroups.value.reduce(
    (acc, postGroup) => acc.concat(postGroup.posts || []),
    []
  )
);

const postStats = ref<{
  totalGroups: number;
  totalPosts: number;
  postGroups: number;
  publishedPosts: number;
  draftPosts: number;
  failedPosts: number;
}>({
  totalGroups: 0,
  totalPosts: 0,
  postGroups: 0,
  publishedPosts: 0,
  draftPosts: 0,
  failedPosts: 0,
});

// Store the animated values separately
const animatedTotalGroups = ref(0);
const animatedTotalPosts = ref(0);
const animatedScheduledPosts = ref(0);
const animatedPublishedPosts = ref(0);
const animatedDraftPosts = ref(0);
const animatedFailedPosts = ref(0);

const dateRange = ref<{ start: Date | null; end: Date | null }>({
  start: null,
  end: null,
});

const dates = ref<Date[] | null>(null); // Allows null or a valid date array

watch(dates, (newValue) => {
  if (!newValue) {
    dateRange.value = { start: null, end: null };
    return;
  }

  if (newValue.length === 2) {
    const [start, end] = newValue;
    setDateRange(start, end); // Pass valid Dates to your function
  }
});

const predefinedRanges = {
  lastWeek: () => ({
    start: startOfDay(subDays(new Date(), 7)),
    end: endOfDay(new Date()),
  }),
  currentMonth: () => ({
    start: startOfMonth(new Date()),
    end: endOfDay(new Date()),
  }),
  last30Days: () => ({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date()),
  }),
  previousMonth: () => ({
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1)),
  }),
  last3Months: () => ({
    start: startOfDay(subMonths(new Date(), 3)),
    end: endOfDay(new Date()),
  }),
};

const filteredPosts = computed(() => {
  const { start, end } = dateRange.value;

  if (!start || !end) {
    return postGroups.value;
  }

  const filteredPosts = postGroups.value.filter((post) => {
    const postDate = new Date(post.scheduledTime);

    return postDate >= start && postDate <= end;
  });

  return filteredPosts;
});

const draftPosts = computed(() =>
  postGroups.value.filter((post) => post.status === 'draft')
);

const scheduledPosts = computed(() =>
  postGroups.value.filter((post) => post.status === 'scheduled')
);

const publishedPosts = computed(() =>
  postGroups.value.filter((post) => post.status === 'published')
);

const failedPosts = computed(() =>
  postGroups.value.filter((post) => post.status === 'failed')
);

async function getAllPostGroups() {
  try {
    const response = await getPostGroups();
    postGroups.value = response.postGroups;
    console.log(postGroups.value);
    return response.data;
  } catch (error) {
    console.error('Failed to get scheduled posts:', error);
    throw error;
  }
}

async function updatePostStats() {
  try {
    const stats = await getPostsStats();
    postStats.value = stats;

    // Only animate if the animated values are 0 (initial state)
    if (animatedTotalGroups.value === 0) {
      await animateStats(stats);
    } else {
      // If already animated before, just set the values directly
      animatedTotalGroups.value = stats.totalGroups;
      animatedTotalPosts.value = stats.totalPosts;
      animatedScheduledPosts.value = stats.scheduledPosts;
      animatedPublishedPosts.value = stats.publishedPosts;
      animatedDraftPosts.value = stats.draftPosts;
      animatedFailedPosts.value = stats.failedPosts;
    }
  } catch (error) {
    console.error('Error fetching post stats:', error);
  }
}

async function animateStats(targetStats: typeof postStats.value) {
  const duration = 500;
  const startTime = performance.now();

  return new Promise<void>((resolve) => {
    function animate(currentTime: number) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out effect

      animatedTotalGroups.value = Math.round(
        targetStats.totalGroups * easedProgress
      );
      animatedTotalPosts.value = Math.round(
        targetStats.totalPosts * easedProgress
      );
      animatedScheduledPosts.value = Math.round(
        targetStats.postGroups * easedProgress
      );
      animatedPublishedPosts.value = Math.round(
        targetStats.publishedPosts * easedProgress
      );
      animatedDraftPosts.value = Math.round(
        targetStats.draftPosts * easedProgress
      );
      animatedFailedPosts.value = Math.round(
        targetStats.failedPosts * easedProgress
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

function setDateRange(start: Date | null, end: Date | null) {
  dateRange.value = {
    start,
    end: end ? endOfDay(end) : null, // Adjust end to include the entire day
  };
}

function setPredefinedRange(rangeName: keyof typeof predefinedRanges) {
  const range = predefinedRanges[rangeName]();
  setDateRange(range.start, range.end);
}

export default {
  postGroups,
  draftPosts,
  scheduledPosts,
  publishedPosts,
  failedPosts,
  postStats,

  animatedTotalGroups,
  animatedTotalPosts,
  animatedScheduledPosts,
  animatedPublishedPosts,
  animatedDraftPosts,
  animatedFailedPosts,
  filteredPosts,
  getAllPostGroups,
  updatePostStats,
  setDateRange,
  setPredefinedRange,
  dates,
  posts,
};
