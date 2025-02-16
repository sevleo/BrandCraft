import { ref } from 'vue';
import { startOfWeek, endOfWeek, subWeeks, endOfDay } from 'date-fns';

const STORAGE_KEY_TAB_DATE_RANGES = 'brandcraft-tab-date-ranges';
const STORAGE_KEY_SELECTED_FILTERS = 'brandcraft-selected-filters';

interface TabDateRange {
  start: Date | null;
  end: Date | null;
}

interface TabDateRanges {
  scheduled: TabDateRange;
  drafts: TabDateRange;
  published: TabDateRange;
  failed: TabDateRange;
}

interface TabFilters {
  scheduled: string;
  published: string;
  drafts: string;
  failed: string;
}

// Load initial values from localStorage
const storedDataRanges = localStorage.getItem(STORAGE_KEY_TAB_DATE_RANGES);
let initialDataRanges = storedDataRanges ? JSON.parse(storedDataRanges) : null;

// Migration: Add failed tab if it doesn't exist in stored data
if (initialDataRanges && !initialDataRanges.failed) {
  const lastWeek = {
    start: subWeeks(new Date(), 1),
    end: new Date(),
  };
  initialDataRanges = {
    ...initialDataRanges,
    failed: lastWeek,
  };
  // Update localStorage with migrated data
  // localStorage.setItem(
  //   STORAGE_KEY_TAB_DATE_RANGES,
  //   JSON.stringify(initialDataRanges)
  // );
}

// Load initial values from localStorage
const storedDataFilters = localStorage.getItem(STORAGE_KEY_SELECTED_FILTERS);
let initialDataFilters = storedDataFilters
  ? JSON.parse(storedDataFilters)
  : null;

// Migration: Add failed tab if it doesn't exist in stored filters
if (initialDataFilters && !initialDataFilters.failed) {
  initialDataFilters = {
    ...initialDataFilters,
    failed: 'date',
  };
  // Update localStorage with migrated data
  // localStorage.setItem(
  //   STORAGE_KEY_SELECTED_FILTERS,
  //   JSON.stringify(initialDataFilters)
  // );
}

// Initialize with default values if no stored data
const getDefaultRanges = (): TabDateRanges => {
  const thisWeek = {
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  };

  const lastWeek = {
    start: subWeeks(new Date(), 1),
    end: new Date(),
  };

  return {
    scheduled: thisWeek,
    drafts: thisWeek,
    published: lastWeek,
    failed: lastWeek,
  };
};

const tabDateRanges = ref<TabDateRanges>(
  initialDataRanges
    ? {
        scheduled: {
          start: new Date(initialDataRanges.scheduled.start),
          end: new Date(initialDataRanges.scheduled.end),
        },
        drafts: {
          start: new Date(initialDataRanges.drafts.start),
          end: new Date(initialDataRanges.drafts.end),
        },
        published: {
          start: new Date(initialDataRanges.published.start),
          end: new Date(initialDataRanges.published.end),
        },
        failed: {
          start: new Date(initialDataRanges.failed.start),
          end: new Date(initialDataRanges.failed.end),
        },
      }
    : getDefaultRanges()
);

// Watch for changes and save to localStorage
// watch(
// tabDateRanges,
// (newRanges) => {
// localStorage.setItem(
//   STORAGE_KEY_TAB_DATE_RANGES,
//   JSON.stringify(newRanges)
// );
// },
// { deep: true }
// );

function setTabDateRange(
  tab: keyof TabDateRanges,
  start: Date | null,
  end: Date | null
) {
  tabDateRanges.value[tab] = {
    start,
    end: end ? endOfDay(end) : null,
  };
}

// Initialize with default values if no stored data
function getDefaultSortOptions(): TabFilters {
  return {
    scheduled: 'thisWeek',
    drafts: 'thisWeek',
    published: 'lastWeek',
    failed: 'lastWeek',
  };
}

const tabSortOptions = ref<TabFilters>(
  initialDataFilters || getDefaultSortOptions()
);

// Save to localStorage whenever the sort options change
const saveToLocalStorage = () => {
  // localStorage.setItem(
  //   STORAGE_KEY_SELECTED_FILTERS,
  //   JSON.stringify(tabSortOptions.value)
  // );
};

const setTabSortOption = (tab: keyof TabFilters, option: string) => {
  tabSortOptions.value[tab] = option;
  saveToLocalStorage();
};

export default {
  tabDateRanges,
  setTabDateRange,
  tabSortOptions,
  setTabSortOption,
};
