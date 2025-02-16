import { ref, watch } from 'vue';

const STORAGE_KEY = 'brandcraft-publish-view';

// Load initial values from localStorage
const storedData = localStorage.getItem(STORAGE_KEY);
const initialData = storedData ? JSON.parse(storedData) : null;

const currentView = ref<string>(initialData?.currentView || 'calendar');
const weekOffset = ref(initialData?.weekOffset || 0);
const monthOffset = ref(initialData?.monthOffset || 0);
const viewType = ref<'week' | 'month'>(initialData?.viewType || 'week');
const selectedTab = ref<string>(initialData?.selectedTab || 'scheduled');
const savedScrollPosition = ref<number | null>(null); // Ref to store the scroll position

// Watch for changes and save to localStorage
watch(
  [currentView, weekOffset, monthOffset, viewType, selectedTab],
  () => {
    const data = {
      currentView: currentView.value,
      weekOffset: weekOffset.value,
      monthOffset: monthOffset.value,
      viewType: viewType.value,
      selectedTab: selectedTab.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  { deep: true }
);

// Function to reset store to default values
const resetStore = () => {
  currentView.value = 'calendar';
  weekOffset.value = 0;
  monthOffset.value = 0;
  viewType.value = 'week';
  selectedTab.value = 'scheduled';
  localStorage.removeItem(STORAGE_KEY);
};

export default {
  currentView,
  weekOffset,
  monthOffset,
  viewType,
  resetStore,
  selectedTab,
  savedScrollPosition,
};
